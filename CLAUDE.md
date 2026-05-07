# nepi_rui — Developer Reference

## Purpose

`nepi_rui` is the Resident User Interface for NEPI. It provides a browser-accessible control and monitoring interface served directly from the device. The architecture is a thin Python/Flask backend that bridges the filesystem and serves static assets, combined with a React frontend that communicates with the ROS layer via a rosbridge WebSocket connection. No client software is required — users connect via browser to the device's IP on port 5003.

## Architecture

```
nepi_rui/
├── scripts/
│   └── run_webserver.py        # Entry point: starts the Flask server
├── src/
│   └── rui_webserver/
│       ├── server.py           # Flask app: routes, file serving, network info API
│       ├── config.py           # APP_BUILD_PATH, DATA_PATH (from RUI_HOME env var)
│       ├── utils.py            # Subprocess wrapper, timing decorator
│       ├── prebuild.py         # Build-time utilities
│       └── rui-app/            # React frontend source
│           ├── src/
│           │   ├── App.js              # Root React component, ROS connection gate
│           │   ├── Nepi_SDK.js         # Frontend utilities, device type helpers
│           │   ├── ComponentRegistry.js # Dynamic component registration
│           │   ├── Nav.js              # Navigation bar
│           │   ├── NepiDevice*.js      # Per-category device panels (IDX, PTX, LSX, NPX, RBX)
│           │   ├── NepiSystem*.js      # System management panels
│           │   └── [UI primitives]     # Button.js, Input.js, Label.js, Toggle.js, etc.
│           ├── public/
│           ├── package.json            # npm dependencies and build scripts
│           └── config-overrides.js     # react-app-rewired overrides
├── requirements.txt            # Python dependencies
├── setup.py                    # Catkin package setup
└── package.xml                 # ROS package metadata
```

## How It Works

**Backend (Python/Flask):**
`run_webserver.py` calls `start_server()` from `server.py`. Flask serves on port 5003. Three route groups:
- `GET /api/networkinfo` — returns the device's host IP address
- `GET /files/<path>` — directory-browsing and file-serving with path traversal protection, rooted at `DATA_PATH`
- `GET /` (catchall) — serves the compiled React build from `APP_BUILD_PATH`

Both `APP_BUILD_PATH` and `DATA_PATH` are derived from the `RUI_HOME` environment variable, which must be set before starting the server. Flask-Cors is enabled globally — no origin filtering.

**Frontend (React):**
The frontend is a single-page application. `App.js` is the root component. On mount it checks whether a ROS connection is established (via `roslib.js` connecting to the rosbridge WebSocket on port 9090). Until the connection is up, it renders a "Connecting" state. Once connected it renders either "Deploy Mode" or "Develop Mode" based on the ROS system state.

State management uses MobX (injected as `ros` store via `@inject("ros")` and observed with `@observer`). All ROS subscribers, publishers, and service proxies are managed in this MobX store.

Device panels are structured by NEPI device type — `NepiDeviceIDX.js` for cameras, `NepiDevicePTX.js` for pan-tilts, `NepiDeviceLSX.js` for lights, `NepiDeviceNPX.js` for nav/positioning, `NepiDeviceRBX.js` for robots. System management panels (`NepiSystemApps.js`, `NepiSystemSoftware.js`, `NepiSystemNavPose.js`, `NepiSystemAiModels.js`, `NepiSystemAdmin.js`) mirror the manager node domains in `nepi_engine`.

`Nepi_SDK.js` provides frontend utilities for config management, topic filtering, and device type resolution.

`ComponentRegistry.js` provides a dynamic registration system allowing app-specific React components (from `nepi_apps/*/rui/`) to be registered and rendered within the main UI without hardcoding them into the navigation structure.

## ROS Interface

The RUI does not communicate with ROS directly from the Flask backend. All ROS communication goes through:
1. `rosbridge_websocket` running on port 9090 (started by `nepi_env/launch/nepi_base.launch`)
2. `web_video_server` running on port 9091 (for HTTP image streaming)
3. The `roslib.js` library in the React frontend, which subscribes to topics and calls services via the WebSocket bridge

The RUI subscribes to all manager status topics, device status topics, and app status topics defined in `nepi_interfaces`. It calls services for queries and control operations. The exact topics and services are determined by what the MobX `ros` store has registered — there is no static list in the RUI code.

## Build and Dependencies

**Python backend:**
- `Flask`, `Flask-Cors` — web server
- `PyYAML`, `Pillow` — data handling
- `pymongo`, `tornado`, `Twisted` — additional server utilities
- `pyOpenSSL`, `autobahn`, `pyasn1`, `service_identity` — TLS/WebSocket support
- Install: `pip install -r requirements.txt` (in a virtualenv)

**React frontend:**
- React 16.5.2, react-dom 16.5.2 — UI framework
- react-router-dom 4.3.1 — client-side routing
- MobX 5.6.0, mobx-react 5.4.2 — state management
- roslib 0.20.0 — ROS WebSocket bridge client
- react-app-rewired 1.6.2 — create-react-app build override
- rc-slider, rc-tooltip, react-toggle, react-beautiful-dnd, react-circular-progressbar — UI components
- Build: `npm run build` from `src/rui_webserver/rui-app/`
- The compiled output goes to the directory pointed to by `APP_BUILD_PATH`

**One-time development setup:**
```bash
source devenv.sh                         # sets RUI_HOME and activates venv
cd src/rui_webserver/rui-app && npm install
npm run build                            # or npm start for hot-reload dev server on :3006
rosrun nepi_rui run_webserver.py         # start Flask backend
```

**Production deployment:** Managed by `/opt/nepi/nepi_rui/etc/start_rui.sh` or a systemd service. The `RUI_HOME` environment variable must be set to the deployment root.

## Known Constraints and Fragile Areas

**Node.js 8.11.1 is the target version.** The `package.json` and build tooling were written for Node 8. Building with newer Node versions may work but is not guaranteed. The README explicitly notes known vulnerabilities in this Node version.

**React 16.5.2 is significantly outdated.** Modern React (17+, 18+) introduced breaking changes. Any upgrade requires evaluating MobX compatibility, the react-app-rewired setup, and all hook/lifecycle patterns.

**ROS field access is by string name, not by type.** The roslib.js library accesses message fields by name (e.g., `msg.status`, `msg.device_name`). If a field in `nepi_interfaces` is renamed, the JavaScript code does not fail at build time — it silently receives `undefined`. Always search JavaScript source when changing `nepi_interfaces` field names.

**Global CORS.** Flask-Cors is applied globally with no origin whitelist. On a network-connected device, any origin can make requests to the Flask server. This is appropriate for a local device interface but should be noted before any deployment where the RUI is exposed to untrusted networks.

**`RUI_HOME` must be set.** If this environment variable is not set at startup, `config.py` will fail to determine `APP_BUILD_PATH` and `DATA_PATH`, and the server will not start. The error is not always obvious.

**App UI components must be registered at build time.** Components from `nepi_apps/*/rui/` are not dynamically loaded at runtime — they are imported and registered in the React build. Adding a new app requires updating the ComponentRegistry and rebuilding the frontend.

**Port conflicts.** Flask uses port 5003, rosbridge uses 9090, web_video_server uses 9091. These are not configurable via runtime flags — changes require modifying source. Verify port availability before deployment.

## Editable Input Box Pattern

All editable text/number inputs in the RUI must follow the PTX controls pattern. This is the authoritative pattern — do not deviate.

**Requirements:**
- Controlled input: `value` bound to a state field, updated in `onChange`
- `id` prop on the `<Input>` for DOM targeting via `document.getElementById`
- `onChange`: look up element by id, call `setElementStyleModified(el)`, then `setState` with new value
- `onKeyDown` Enter: look up element by id, call `clearElementStyleModified(el)`, then send the value
- Import `setElementStyleModified` and `clearElementStyleModified` from `./Utilities`
- When the backing value changes externally (e.g. a new item is selected), update the state field via `componentDidUpdate` — this resets the displayed value and the dirty style is cleared by the next render

**Template:**
```jsx
// State
this.state = { myValue: '' }

// componentDidUpdate — reset when source changes
if (prevState.someSource !== this.state.someSource) {
  this.setState({ myValue: this.state.someSource })
}

// JSX
<Input
  id={'MyUniqueInputId'}
  value={this.state.myValue}
  onChange={(e) => {
    const el = document.getElementById('MyUniqueInputId')
    setElementStyleModified(el)
    this.setState({ myValue: e.target.value })
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      const el = document.getElementById('MyUniqueInputId')
      clearElementStyleModified(el)
      // send el.value to ROS here
    }
  }}
/>
```

**Reference implementations:** `NepiDevicePTX-Controls.js` (`onUpdateText`/`onKeyText` methods), `NepiSystemNavPose.js` (frame rename box).

## Decision Log

- 2026-03 — CLAUDE.md created — Initial developer reference, Claude Code authoring pass.
- 2026-05 — Editable input pattern documented — PTX controls are the canonical reference; all editable inputs must follow this pattern.
