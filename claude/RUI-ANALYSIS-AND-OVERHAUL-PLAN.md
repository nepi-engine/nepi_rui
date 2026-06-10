# RUI Analysis and Overhaul Plan

Date: 2026-06-09
Scope: nepi_rui submodule — Resident User Interface (Flask backend + React frontend)
Status: Planning document. No implementation has started.

---

## 1. Current State

The RUI is a browser-based control and monitoring interface served directly from the
device on port 5003. The architecture has three layers:

1. **Flask backend** (`src/rui_webserver/server.py`) — serves the compiled React build,
   provides a `/files/` directory browser, and a `/api/networkinfo` endpoint. It does
   not talk to ROS.
2. **React frontend** (`src/rui_webserver/rui-app/`) — a single-page app that connects
   to ROS through the rosbridge WebSocket on port 9090 (roslib 0.20.0) and pulls MJPEG
   image streams from web_video_server on port 9091.
3. **MobX store** (`src/Store.js`) — one `ROSConnectionStore` class that owns every ROS
   subscriber, publisher, and service proxy, injected into components as `ros`.

The frontend stack is React 16.5.2, react-scripts 1.1.5 (via react-app-rewired 1.6.2),
react-router-dom 4.3.1, and MobX 5.6.0 with legacy decorators. The build targets
Node.js 8.11.1. All components are class components — React 16.5 predates hooks, so the
codebase cannot use any library released in the last several years without a framework
upgrade first.

Styling is JS objects passed through `Styles.Create()` (`src/Styles.js`) with
inline-style-prefixer. There are only two real CSS files (`ListBox.css`, `Scripts.css`).
The theme is hard-coded: black background, white text, fixed 1920px page width
(`src/Page.js`). There are no media queries anywhere in the source — the layout does
not adapt to tablets or phones. Roboto is fetched from Google Fonts at runtime
(`src/Page.js`), which fails silently on connectivity-denied devices and leaves the
fallback font.

Navigation (`src/App.js`, `src/MainMenuDevelop.js`, `src/MainMenuDeploy.js`) gates on
the rosbridge connection, then renders one of two menu shells. Develop mode exposes six
top-level routes — Dashboard, Devices, Data, Process, Automation, System — where the
five category pages are the same `Nepi_IF_AppSelector` component parameterized by an
`app_id` prop. App-specific UI components from `nepi_apps/*/rui/` are registered at
build time through `src/ComponentRegistry.js`; adding an app requires a frontend
rebuild.

The dashboard (`src/NepiDashboard.js`) shows three sections — Device Info, System
Status, and System Clock — rendered as labels next to disabled text inputs, plus a
system messages panel. Device panels (`NepiDeviceIDX/PTX/LSX/NPX/RBX.js` with paired
`-Controls.js` files) and system panels (`NepiSystemDevice.js` and siblings) follow the
same Section/Label/Input pattern. The image viewer (`src/Nepi_IF_ImageViewer.js`,
1,828 lines) handles stream selection, quality, overlays, and mouse events.

Total frontend size: ~84 source files, ~31,400 lines.

---

## 2. Technical Debt and UX Issues

### Backend defects

- `server.py:52` — the path-traversal rejection branch returns `Response(status=400)`,
  but `Response` is never imported from Flask. A traversal attempt raises a NameError
  (HTTP 500) instead of a clean 400. The guard logic itself works; the failure response
  is broken.
- `server.py:108-109` — `app.run(use_reloader=True, ..., debug=True)` in the production
  entry point. Flask debug mode exposes the Werkzeug interactive debugger on errors.
- `config.py:21` — `DATA_PATH` points at the rui-app source directory, so the `/files/`
  browser serves the frontend source tree rather than a dedicated data directory.

### Frontend structural debt

- `src/Store.js` — 3,815 lines, one class, 354 observable/action declarations, 119 ROS
  subscribe/publish/service call sites. Every domain (system manager, devices, AI,
  apps, time, network, license) lives in one object. Any change risks unrelated
  breakage, and code review of store diffs is impractical.
- `src/Store.js:120` — monkey-patches `Array.prototype.equals`, a global mutation that
  can collide with libraries and confuses iteration.
- `src/Store.js:2449,2478` — `stringEncript`/`stringDecript` (both misspelled) implement
  AES-GCM with a key from `REACT_APP_RUI_KEY`, which is compiled into the public JS
  bundle. Anything served to the browser is readable by the browser; this provides
  obfuscation, not protection. See section 6.
- `src/Nav.js:150` — `NavItem` is a function component that executes
  `this.subMenu = new SubNavMenu()`: manual instantiation of a React component class
  inside render, referencing `this` in a function component. The instance is created,
  assigned to an accidental global-ish `this`, and never used.
- `src/Nav.js:129` — submenu `<li>` elements rendered in a `.map()` without keys.
- `src/NepiDashboard.js:77,104` — two methods differing only by case
  (`renderDeviceInfo` vs `renderdeviceInfo`); the second appears unused. Easy to edit
  the wrong one.
- Store field typo `hearbeatNepi` (consumed at `src/NepiDashboard.js:213`) — harmless
  today, but typo'd identifiers invite silent `undefined` bugs given that roslib field
  access is by string name and never fails at build time.
- Dead code throughout: commented-out imports and blocks in `App.js`, `Store.js`,
  `NepiMgrAiDetector.js`, `Nepi_IF_ImageViewer.js`; a stray `Dropped Text.txt` and
  `EmptyClass.js` in `src/`.
- `src/NepiDashboard.js:96-98,253-255` — empty `<pre>` blocks used as vertical spacers.

### Dependency and platform debt

- Node 8.11.1 (EOL December 2019) is the documented build target; the README itself
  flags known vulnerabilities. react-scripts 1.1.5 pulls in a large tree of
  unpatchable transitive dependencies.
- React 16.5.2 blocks hooks (introduced in 16.8), concurrent features, and effectively
  every current third-party component library.
- MobX 5 decorators rely on a legacy Babel transform; MobX 6 removed decorator
  requirements and changed reactivity defaults — an upgrade is a rewrite of store
  wiring, not a version bump.
- `react-beautiful-dnd`, `react-file-manager`, `typography`/`react-typography`, and
  `cannon` (a 3D physics engine — usage unclear) are abandoned or near-abandoned
  upstream.

### UX issues

- **No responsive layout.** Fixed 1920px page width, no media queries. Field operators
  using tablets or laptops with small screens get horizontal scrolling and tiny
  controls.
- **Status presented as disabled form inputs.** Temperature, disk usage, and clock
  state render as grayed-out text boxes (`NepiDashboard.js`), which read as "broken
  form" rather than "live telemetry." There is no at-a-glance health state, no trend
  or history display, and warnings (`systemStatusWarnings` exists in the store) are
  not surfaced on the dashboard.
- **No load/error states beyond the connection gate.** `App.js` shows "Connecting"
  until rosbridge responds; after that, individual panels show empty fields rather
  than distinguishing "no data yet" from "zero."
- **Inconsistent visual rhythm.** Spacing is applied ad hoc (empty `<pre>` spacers,
  inline margins per component), so vertical alignment varies between panels.
- **Online-only assets.** Google Fonts at runtime contradicts the platform's
  EDGE ONLY design decision (NEPI-CODEX.md) — the UI should carry its assets.
- **Contrast and hierarchy.** White-on-black with a single accent blue (`#00a5ed`) and
  uppercase section titles gives every panel equal visual weight; nothing directs the
  eye to what matters first (is the system healthy, is data flowing, is AI running).

---

## 3. Overhaul Approaches Considered

### Approach A — In-place incremental cleanup (keep React 16 / Node 8)

Fix the concrete defects (server.py import, debug mode, Nav.js, dashboard
duplication), restructure the dashboard presentation, and add a responsive layer
within the existing stack.

- Pros: lowest immediate effort; no build-system risk; every change is small and
  testable on hardware.
- Cons: the foundation stays EOL. No modern libraries, no hooks, unpatchable
  dependency tree. Every hour spent styling React 16 class components is rework the
  day the platform upgrade finally happens. The store god object remains.
- Verdict: right for bug fixes, wrong as an overhaul strategy. It defers the real
  problem without reducing its cost.

### Approach B — Full rewrite on a current stack (Vite + React 18 + new store)

Start a parallel `rui-app-v2`, build the shell, dashboard, and one device panel on
Vite + React 18, TypeScript, a per-domain store (Zustand or MobX 6), and roslibjs
current. Port panels incrementally; cut over when coverage is sufficient.

- Pros: clean foundation; hooks and current libraries; per-domain stores kill the god
  object; TypeScript catches the string-field-rename class of bug that currently
  fails silently; CSS layer with design tokens and media queries from day one.
- Cons: largest scope. The RUI has ~31k lines and dozens of panels wired to ROS topics
  that only exist on hardware — a long parallel period with two UIs to maintain, and
  app components in `nepi_apps/*/rui/` are compiled against the old registry, so every
  downstream app UI must migrate too. High risk of a half-finished migration becoming
  permanent.

### Approach C — Two-phase: modernize the foundation, then redesign panel-by-panel (recommended)

Phase 1 (foundation): upgrade the toolchain under the existing component code with
minimal component rewrites — current Node LTS, Vite (or react-scripts 5) build,
React 18 in legacy-compatible mode, MobX 6 with `makeObservable` shims. Fix the known
backend defects. Vendor the Roboto font. Establish a small CSS token layer (colors,
spacing, type scale) that coexists with `Styles.js`.

Phase 2 (redesign): with a maintainable foundation, redesign screen-by-screen starting
with the dashboard, using the mockup direction chosen from this task. Split Store.js
one domain at a time as each screen is touched (system, devices, AI, apps). New
screens are function components with hooks; old screens keep working until their turn.

- Pros: one build-system migration instead of a parallel app; downstream app UI
  components keep loading throughout; each phase delivers value on its own (Phase 1
  alone restores patchability); panel-by-panel redesign maps cleanly onto hardware
  validation cycles, which matches how this platform is actually tested.
- Cons: Phase 1 is unglamorous and touches fragile build config (react-app-rewired
  overrides, decorator transforms); React 18 + MobX 5-style decorators requires care;
  some throwaway shim work.

### Recommendation

**Approach C.** A is maintenance dressed as an overhaul; B is the right destination
with an unrealistic transition for a field platform where every panel must be
re-validated on hardware. C sequences the same destination into steps that can each be
tested on a bench device before moving on, and it never leaves the platform without a
working UI. Simplification is the north star: one app, one build, migrated in place.

---

## 4. MVP Boundary

MVP (in scope, in order):

1. **Foundation upgrade** — Node LTS + modern build tooling + React 18 compatibility
   pass, with the existing UI rendering and verified against a bench device.
2. **Backend fixes** — import `Response` in `server.py`, disable Flask debug/reloader
   in production, point `DATA_PATH` at the real data directory, vendor the Roboto font
   locally.
3. **Design token layer** — colors, spacing, type scale, and breakpoints as CSS custom
   properties; documented; adopted by the new dashboard only.
4. **Dashboard redesign** — implement the chosen mockup direction: health-first status,
   live telemetry presentation (not disabled inputs), warning surfacing, responsive
   down to tablet width.
5. **Store split, first slice** — extract the system-manager domain from `Store.js`
   into its own store as part of the dashboard work; pattern documented for later
   slices.

Deferred (out of scope until MVP is validated on hardware):

- Redesign of device panels (IDX/PTX/LSX/NPX/RBX), system panels, and the AI manager
  screens.
- Full Store.js decomposition beyond the system domain.
- TypeScript adoption.
- ComponentRegistry rework / runtime app-UI loading.
- Authentication and rosbridge access control (tracked in section 6 — needs its own
  spec).
- Dark/light theme switching; the MVP ships one theme.
- Replacing abandoned dependencies that still function (react-beautiful-dnd, etc.).

---

## 5. How the Mockups Relate

Five self-contained HTML mockups accompany this document (`mockup-01` through
`mockup-05`). All use real RUI content: device identity, system temperature and disk
readouts from the system manager status, the clock/NTP sync state, AI detector and
model state, device-type counts (IDX/PTX/LSX/NPX/RBX), image feed placeholders, and
system messages. They differ only in design direction. The chosen direction becomes
the reference for MVP item 4; the token layer (MVP item 3) is extracted from it.

---

## 6. Security and Risk

Trust boundaries today: the browser is fully trusted by every backend surface. The
Flask server (5003), rosbridge WebSocket (9090), and web_video_server (9091) all bind
network-wide with no authentication or origin checks. The RUI's user-login and admin
features are enforced in the frontend (`userRestricted` checks in components, e.g.
`NepiDashboard.js:265`) — anyone who can reach port 9090 can publish to any ROS topic
and call any service directly, bypassing the UI entirely. On a field-deployed device
this is the dominant risk: UI-level restrictions are advisory, not a boundary.

Specific exposures:

- **rosbridge is the real attack surface.** Full ROS control (drive actuators, change
  configuration, stop nodes) to any client on the network. Mitigation direction:
  rosbridge authentication or a reverse proxy in front of 9090/9091, designed in the
  deferred auth spec. Until then, deployment guidance must state that the device
  network is the security boundary.
- **Flask debug mode** (`server.py:109`) — Werkzeug debugger can allow code execution
  on unhandled errors. Fix in MVP item 2.
- **Broken traversal response** (`server.py:52`) — guard works, response path crashes.
  Fix in MVP item 2, and add a test that requests `../`.
- **`/files/` scope** (`config.py:21`) — serves the app source tree today. Should serve
  only the operator data directory. Anything under `DATA_PATH` is exposed unauthenticated;
  if collected sensor data is sensitive, that exposure needs to be stated in deployment docs.
- **Bundle-embedded crypto key** (`Store.js:2449`) — `REACT_APP_RUI_KEY` ships in the
  served JS; any browser client can extract it and decrypt/forge anything it protects.
  Treat the strings it protects (login/admin credentials in transit to ROS topics) as
  effectively plaintext on the wire. Real protection requires TLS on the WebSocket and
  server-side secret handling — deferred auth spec.
- **Global CORS** (`server.py:29`) — any origin can call the Flask API from a victim's
  browser on the same network. Low marginal risk while rosbridge is open, but tighten
  when auth lands.
- **No TLS anywhere** — credentials, telemetry, and imagery cross the network in clear.
  Acceptable on an isolated vehicle network; not acceptable on shared infrastructure.
  Deployment docs should say which one the device is on.

Risk register for the overhaul itself:

- Build-toolchain migration can break the `nepi_apps/*/rui/` component imports —
  verify the registry build path early in Phase 1.
- React 18 rendering changes (automatic batching) can alter MobX reaction timing —
  test panels that assume synchronous updates after `setState`/store writes.
- roslib field access is stringly-typed; the upgrade itself won't catch renames.
  Keep the existing rule: grep the JS source whenever `nepi_interfaces` fields change.
- Hardware validation is the bottleneck. Every phase gate is "verified on a bench
  device," not "compiles."
