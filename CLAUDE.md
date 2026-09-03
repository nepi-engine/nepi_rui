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

## Toggle Pattern

`AsyncToggle` is the default toggle for all new RUI code. Any new toggle — in `nepi_rui` or in a `nepi_apps/*/rui/` component — uses `AsyncToggle`, not `react-toggle`. This is the authoritative pattern; do not reach for `react-toggle` in new code.

**Import:**
```jsx
import AsyncToggle from "./AsyncToggle"
```
The path is `./AsyncToggle` from both the `nepi_rui` src directory and from an app's `rui/` directory. `build_nepi_rui.sh` copies every `nepi_apps/*/rui/*.js` flat into the `nepi_rui` src directory, so at build time app components sit beside `AsyncToggle.js`. Never use a relative path that reaches across repos, and never copy `AsyncToggle.js` into an app package.

**Props** are identical to `react-toggle`, plus the optional `confirmTimeoutMs` (default 3000 ms). `checked`, `onClick`, `disabled`, `style`, and `id` all behave exactly as before.

**Behavior:** position is optimistic and color is authoritative. The thumb moves the instant the operator clicks, showing the request even when the confirming status message is slow. The track color only follows a confirmed `checked` value from the backend — so **the color change is the success signal**, and an unconfirmed request reads as "thumb has moved, color has not yet followed." If no confirming status arrives inside `confirmTimeoutMs`, the thumb reverts on its own.

**Pressing again while unconfirmed resends** — same value, fresh timeout window — so an operator on a flaky link can just keep pressing until the color follows. The resend is always the same value because the caller's `onClick` derives what it publishes from the same unconfirmed `checked` prop, so a repeat press cannot publish the opposite of the request in flight. Keep call-site `onClick` handlers idempotent and free of local state flips for this reason.

**Template:**
```jsx
<Label title={"Enable Thing"}>
  <AsyncToggle
    checked={thing_enabled === true}
    onClick={() => sendBoolMsg(namespace + "/set_thing_enable", !thing_enabled)}
  />
</Label>
```

**The one exception where plain `react-toggle` is still correct:** a toggle whose `checked` value is local component state with no backend round trip — a view preference such as a show/hide panel switch, or a staged edit committed later by a separate Save button. These values are already immediate, so optimistic position adds a revert timer with nothing to confirm it and the thumb can bounce back after 3000 ms even though nothing was wrong. Comment the reason at any such call site so the next reader does not take it for an oversight:
```jsx
{/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
```

`index.js` keeps `import "react-toggle/style.css"`. That is the base stylesheet `AsyncToggle.css` layers its pending-state overrides on top of — removing it breaks every toggle in the RUI.

**Reference implementations:** `Nepi_IF_AdminEnable.js`, `Nepi_IF_AdminModes.js` (whole-file conversions), `Nepi_IF_Controls.js`, `Nepi_IF_SaveData.js`, `NepiSystemNavPose.js` (mixed files carrying both imports).

## Decision Log

- 2026-03 — CLAUDE.md created — Initial developer reference, Claude Code authoring pass.
- 2026-05 — Editable input pattern documented — PTX controls are the canonical reference; all editable inputs must follow this pattern.
- 2026-08 — IDX connect components split into data + controls children — `Nepi_IF_ConnectIDX.js` now owns only the ConnectIFStatus subscription, the device selector, and composition; `Nepi_IF_IDX-Data.js` (`NepiIFIDXData`) renders read-only telemetry and `Nepi_IF_IDX-Controls.js` (`NepiIFIDXControls`) renders command widgets, each owning its own `setupIDXStatusListener` on the `namespace` prop. Section visibility resolves prop-overrides-ConnectIFStatus, and the child device namespace comes from `ConnectIFStatus.selected_topic` (there is no `selected_namespace` field on the wire). IDX is the pilot; PTX and the other device types are not yet converted.
- 2026-08 — Three-file connect pattern rolled out to every device type — PTX, LSX, NPX, RBX, and Motor now follow the IDX split: `Nepi_IF_Connect<T>.js` holds only the ConnectIFStatus subscription, `getConnectNamespace`, `onDeviceSelected`, `renderSelector`, and composition, with `Nepi_IF_<T>-Data.js` (`NepiIF<T>Data`) and `Nepi_IF_<T>-Controls.js` (`NepiIF<T>Controls`) each owning its own device status subscription on the `namespace` prop. The Controls child of every type also renders the Device Settings and Advanced Settings panels via `renderSettingsAndAdmin`, as siblings of its own Section because those panels build their own. The selector is never gated on a device being selected — gating it deadlocks the page, since with no selector no device can be chosen. Per-type deviations: Motor subscribes through the generic `setupStatusListener` on `<namespace>/motor_status` (there is no `setupMotorStatusListener` and no `motorDevices` capabilities dict, so its Advanced Settings panel takes an optional `node_name` prop instead of resolving one); splitting Motor also turned `renderMotorRow`'s side-by-side status/command columns into two stacked per-motor blocks. `show_controls_option` is IDX-only — the other four Controls children accept and ignore it to keep the prop contract uniform. The five `NepiDevice*` device pages and their monolithic `NepiDevice*-Controls.js` components are untouched; the new files are purely additive, as with IDX.
- 2026-08 — AsyncToggle is the default toggle; react-toggle swept out of backend-backed call sites — `AsyncToggle.js` renders thumb position optimistically from the operator click and track color authoritatively from the confirmed backend value, so a click shows immediately even when the confirming status message is slow; the thumb self-reverts after `confirmTimeoutMs` (default 3000 ms) if nothing confirms. A full sweep converted 63 of the 116 `<Toggle>` call sites across the RUI — 53 in `nepi_rui` (25 files), 10 in `nepi_apps` (5 files). The CONVERT test is whether `checked` reads a value that only updates on the next status message (a status field, or a mobx `ros` store value populated by a subscriber or service response). The 53 sites left on plain `react-toggle` read local component state the click itself sets synchronously — view preferences (`show_*` via `onChangeSwitchStateValue`, which is a bare `setState`), staged edits committed by a separate Save button (`nepi_app_onvif_mgr`), or handlers that `setState` before publishing (`Nepi_IF_Transform.js`, `Nepi_IF_Motor-Controls.js`, `EnableAdjustment.js`); optimistic position there would add a revert timer with nothing to confirm it. Going forward every new toggle is an `AsyncToggle` — see the Toggle Pattern section. Mixed files keep both imports with a comment at each surviving `react-toggle` site. `index.js` keeps `import "react-toggle/style.css"`, the base stylesheet `AsyncToggle.css` layers on. Note `Nepi_IF_Selector.js:193` renders a `<Toggle>` with neither `Toggle` nor `Label` imported — a pre-existing break, left alone by this sweep because it is not a react-toggle call site and needs a real fix, not a rename.

- 2026-08 — AsyncToggle repeat press resends instead of locking out — a press while a request is unconfirmed used to return early, on the reasoning that the thumb already showed the request. On a lossy link that leaves the operator with a dead control for the whole `confirmTimeoutMs` window when the message that got dropped is exactly the one they would want to send again. Now the press falls through to `onClick` a second time and restarts the timer, so pressing repeatedly retries until the color follows. Safe without threading the in-flight value because the caller's `onClick` computes what it publishes from the same `checked` prop that has not moved — a repeat press cannot publish the opposite of what is in flight, and the pending override is held rather than recomputed. Consequence for call sites: an `AsyncToggle` `onClick` must be idempotent, which is already true of the `sendBoolMsg(ns, !value)` shape but would not be of a handler that flips local state. `setState` now runs on every press even when `pending` is unchanged (a `presses` counter that nothing reads) because the render is required: react-toggle keeps its own `state.checked`, flips it on each click, and only resyncs in `componentWillReceiveProps` — skip the render and a resend knocks the thumb to the wrong side until the next status message re-renders the parent.

- 2026-08 — RBX connect controls now require DeviceRBXStatus — pre-split, `Nepi_IF_ConnectRBX.renderControls` read only ConnectIFStatus and so rendered as soon as a device was selected. `Nepi_IF_RBX-Controls.js` gates its `render` on `status_msg` like every other Controls child, so RBX command widgets no longer appear for a selected device that is not publishing status. Deliberate, for uniformity with the IDX shape.

- 2026-09 — Settings renderer treats `Discrete` as `Selection` — `'Discrete'` is an alias of `'Selection'` in `nepi_controls`, not a separate type: the same named list of options, one of which is current, under the older spelling that driver params yaml files and several driver nodes still use. It aliases the **singular**; the multi-select `Selections` is unrelated and must not be aliased to it. Two dispatch sites carry it, both extending an existing condition rather than adding a branch: `Nepi_IF_Control.js` renders it through the Selection options `<Select>` dropdown, and `Nepi_IF_Settings.js` `getSettingValue()` reads `msg.set_string` for it so the selector and the "Current Settings" summary agree. Those two are the RUI's *only* type dispatch on a control or setting type string — the `"Selection"` hits in `NepiDevice{IDX,LSX,NPX}.js` and `NepiDataNavPoseViewer.js` are `<Section title>` strings, and `Store.js`'s type dispatch (~3205) is commented out, `sendUpdateControlValue` being type-agnostic. A type fixed in the engine but unhandled here is still broken from the operator's seat, so both halves ship together.
