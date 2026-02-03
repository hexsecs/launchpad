# Launchpad Pro MK3 Web MIDI Prototype

A single-page Web MIDI demo for the Novation Launchpad Pro MK3. It connects in Programmer Mode, lights pads, logs MIDI messages, and includes a few playful modes (Rainbow Diagonal, Game of Life, Tic Tac Toe, Connect Four, and a 1‑player Connect Four with a simple AI).

## Features
- Connect to MIDI input/output devices and log incoming/outgoing messages.
- Enter/exit Programmer Mode via SysEx.
- Pad demos: gradient fill, diagonal rainbow animation, and clear-all.
- Interactive games on the 8x8 grid: Tic Tac Toe, Connect Four, and Connect Four (1P) with a simple AI.
- Conway’s Game of Life animation.

## Requirements
- A Web MIDI–capable browser (Chrome or Edge recommended).
- A Novation Launchpad Pro MK3 connected via USB.
- Permission for **SysEx** access when prompted by the browser.

## Run It
No build step. Open the file directly in a supported browser:

```bash
open index.html
```

Or serve it from a local HTTP server if your browser blocks file access:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Quick Start
1. Plug in the Launchpad Pro MK3 via USB.
2. Open `index.html` in Chrome or Edge and click **Connect MIDI**.
3. Allow **SysEx** when prompted.
4. Click **Enter Programmer Mode**, then try **Light Demo Pads** or **Rainbow Diagonal**.

## Usage
1. Click **Connect MIDI** and allow SysEx access.
2. Select the Launchpad Pro MK3 for both MIDI input and output if it isn’t auto-selected.
3. Click **Enter Programmer Mode**.
4. Try the demo buttons or games. Use **Clear All** to reset the grid.

## Browser + SysEx Notes
- Web MIDI with SysEx is supported in Chrome and Edge. Other browsers may not work.
- If you deny the SysEx prompt, reload the page and try again, then allow it.
- Some browsers block `file://` MIDI access. If the device list is empty, run a local server.

## Controls Reference
- **Connect MIDI**: Requests Web MIDI + SysEx and enables the controls.
- **Enter Programmer Mode**: Sends the Launchpad Pro MK3 SysEx to enter Programmer Mode.
- **Exit Programmer Mode**: Sends the SysEx to exit Programmer Mode.
- **Light Demo Pads**: Fills the grid with a simple gradient.
- **Rainbow Diagonal**: Animated diagonal color wave (click again to stop).
- **Game of Life**: Conway’s Game of Life on the 8x8 grid (click again to stop).
- **Tic Tac Toe**: 3x3 game mapped onto the 8x8 grid (click again to stop).
- **Connect Four**: Two‑player Connect Four on the 8x8 grid (click again to stop).
- **Connect Four (1P)**: Single‑player Connect Four vs a simple AI (click again to stop).
- **Clear All**: Sends Note Off to the entire 8x8 grid.

## Troubleshooting
- **No devices listed**: Use Chrome/Edge, reconnect the Launchpad, and refresh. If using a `file://` URL, start a local server.
- **Pads not lighting**: Click **Enter Programmer Mode** again, then re‑select the MIDI output.
- **Wrong device selected**: Use the input/output dropdowns to pick the Launchpad Pro MK3.
- **Buttons unresponsive**: Click **Clear All**, then exit/re‑enter Programmer Mode.

## Notes
- The UI auto-selects the Launchpad Pro MK3 when it can find it by name.
- Some modes stop others (e.g., starting Tic Tac Toe stops Rainbow/Life).
- If pads stop responding, try **Exit Programmer Mode** then **Enter Programmer Mode** again.

## MIDI Details
- Programmer Mode SysEx:
  - Enter: `F0 00 20 29 02 0E 0E 01 F7`
  - Exit: `F0 00 20 29 02 0E 0E 00 F7`
- Grid notes: `11`–`88` (row/col encoded as `row * 10 + col`).

## Development
- Source is split into small ES modules for clarity.
- Use a local server if the browser blocks MIDI access for `file://` URLs.
- Feel free to add new modes or color palettes; keep UI labels short and button text clear.

## File Overview
- `index.html` — UI markup and styles, loads `app.js`.
- `app.js` — App bootstrap and event wiring.
- `midi.js` — Web MIDI access, logging, and output helpers.
- `ui.js` — DOM bindings and UI helpers.
- `grid.js` — Note/row/col helpers for the 8x8 grid.
- `modes/` — Mode implementations (Rainbow, Life, Tic Tac Toe, Connect Four).
- `README.md` — This document.
- `LICENSE` — MIT license text.

## License
MIT. See `LICENSE`.
