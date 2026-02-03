# Launchpad Pro MK3 Web MIDI Prototype

A single-page Web MIDI demo for the Novation Launchpad Pro MK3. It connects in Programmer Mode, lights pads, logs MIDI messages, and includes a few playful modes (Rainbow, Game of Life, Tic Tac Toe, Connect Four, and a 1‑player Connect Four).

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

## Usage
1. Click **Connect MIDI** and allow SysEx access.
2. Select the Launchpad Pro MK3 for both MIDI input and output if it isn’t auto-selected.
3. Click **Enter Programmer Mode**.
4. Try the demo buttons or games. Use **Clear All** to reset the grid.

## Notes
- The UI auto-selects the Launchpad Pro MK3 when it can find it by name.
- Some modes stop others (e.g., starting Tic Tac Toe stops Rainbow/Life).
- If pads stop responding, try **Exit Programmer Mode** then **Enter Programmer Mode** again.

## File Overview
- `index.html` — All HTML/CSS/JS in a single file.
- `README.md` — This document.

## License
MIT (add a LICENSE file if you want to formalize this).
