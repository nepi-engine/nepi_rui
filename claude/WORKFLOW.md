# RUI Overhaul Planning — Workflow

Date: 2026-06-09
Produced by: Claude Code session in nepi_engine_ws, working in the nepi_rui submodule.

This document records how the files in this folder were produced, how to review them,
and how to request the next iteration.

---

## What is in this folder

- `RUI-ANALYSIS-AND-OVERHAUL-PLAN.md` — current-state analysis, technical debt
  inventory, three overhaul approaches with a recommendation, MVP boundary, and a
  security/risk section.
- `mockup-01-dark-ops-console.html` — dark operations console: sticky health strip,
  large detection feed, monospace telemetry.
- `mockup-02-light-minimal.html` — light minimal: large stat blocks, plain-language
  health summary line, low visual chrome.
- `mockup-03-data-dense-industrial.html` — data-dense industrial: all-monospace SCADA
  style, numeric readout strip, threshold ticks on meters.
- `mockup-04-card-modular.html` — card-based modular: sidebar navigation, one card per
  domain with its own actions; the layout that maps most directly onto a per-domain
  store split.
- `mockup-05-field-high-contrast.html` — field high-contrast: pure black background,
  large numerals and touch targets, warning banner first. Built for sunlight and
  gloves.
- `WORKFLOW.md` — this file.

## Framework documents read before any work

Read in full at session start, in this order:

1. `src/nepi_claude/NEPI-LORE.md` — voice guidelines (plain labels, no buzzwords),
   MVP discipline, security-by-design, simplification as north star.
2. `src/nepi_claude/NEPI-CODEX.md` — platform identity, EDGE ONLY and BROWSER-BASED UI
   design decisions, target users (field operators, ocean/subsea vertical).
3. Top-level `CLAUDE.md` — submodule workflow, naming conventions, session summary
   instructions.
4. `src/nepi_rui/CLAUDE.md` — RUI architecture, build constraints, known fragile
   areas, the editable input box pattern.

## How the analysis was performed

Read-only exploration of the nepi_rui source before writing anything:

- Backend: `src/rui_webserver/server.py`, `config.py`, `scripts/run_webserver.py`,
  `requirements.txt` — route handlers, configuration, startup flags.
- Frontend structure: full file listing of `src/rui_webserver/rui-app/src/` (~84
  files), line counts to find the largest components.
- Core files in full or in large part: `App.js`, `Nav.js`, `Store.js` (head plus
  targeted sections), `NepiDashboard.js`, `MainMenuDevelop.js`, `Page.js`, `Theme.js`,
  `Styles.js`, `Section.js`, `index.js`, `ComponentRegistry.js`, and the heads of
  `NepiMgrAiDetector.js` and `Nepi_IF_ImageViewer.js`.
- Targeted greps: media queries (none found), React hooks (none — impossible on
  React 16.5), crypto/password handling in `Store.js`, committed key material (none
  found), `package.json` dependency versions, README Node version notes.

Every claim in the analysis document carries a file (and where useful, line)
reference so it can be verified directly.

## How the mockups were derived from the analysis

The mockup content is the union of what the current dashboard and panels actually
display, reorganized — not invented features:

- Device identity, firmware, serial — from `NepiDashboard.js` renderDeviceInfo.
- Heartbeat, CPU temperature, disk capacity/used, internet state — from
  `NepiDashboard.js` renderMgrSystemStatus and the system_mgr fields in `Store.js`.
- Clock/NTP sync — from renderSystemClock.
- AI detector state, model, classes, detection image topics — from
  `NepiMgrAiDetector.js` and `NepiSystemAiModels.js`.
- Device type rows (IDX camera, PTX pan-tilt, LSX light, NPX nav/pose, RBX robot) —
  from the `NepiDevice*.js` panel set.
- Image feed with quality selection and MJPEG source — from `Nepi_IF_ImageViewer.js`
  (web_video_server on port 9091, JPEG quality 95/50/10).
- System messages log — from the messages selector on the current dashboard.

Each mockup applies the same fixes for the UX issues in the analysis: telemetry shown
as readouts instead of disabled form inputs, warnings surfaced prominently
(`systemStatusWarnings` exists in the store today but never reaches the dashboard),
clear hierarchy (health first, detail second), responsive breakpoints, and no
external assets (system font stacks — no Google Fonts, matching the EDGE ONLY
decision). All labels follow the LORE voice rules: plain and specific.

The placeholder data is static and self-consistent across all five mockups
(same device, same warning, same detections) so reviews compare design, not content.

## How to open and review the mockups

Each file is a single self-contained HTML page — embedded CSS, inline SVG, no build
step, no network access required.

- Open directly: double-click the file, or `xdg-open mockup-01-dark-ops-console.html`.
- Compare side by side: open all five in browser tabs and cycle through them.
- Check responsiveness: resize the window below ~1100px and ~700px; each mockup
  reflows at those breakpoints.
- Review questions worth answering: Which direction reads fastest at a glance? Which
  works on the screens your operators actually carry? Which warning presentation
  fits how your deployments fail?

## How to request iterations

In a Claude Code session in this workspace, name the file and the change. Examples:

- "Iterate on mockup-05: move the device list above the feed and add a battery tile."
- "Combine the health strip from mockup-01 with the card layout of mockup-04."
- "Produce mockup-06 using the mockup-03 density but a light palette."

Once a direction is chosen, the next step per the plan is to extract its design
tokens (colors, spacing, type scale, breakpoints) into the token layer defined as
MVP item 3 in `RUI-ANALYSIS-AND-OVERHAUL-PLAN.md` — not to start implementing
components. Implementation does not begin until the plan's Phase 1 (foundation
upgrade) is specced and approved.
