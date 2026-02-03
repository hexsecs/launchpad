import { createUi } from "./ui.js";
import { createMidi } from "./midi.js";
import { createModeManager } from "./modes.js";
import { createRainbowMode } from "./modes/rainbow.js";
import { createLifeMode } from "./modes/life.js";
import { createTttMode } from "./modes/ttt.js";
import { createC4Mode } from "./modes/c4.js";

const ui = createUi();
const { elements } = ui;
const modeManager = createModeManager();

const midi = createMidi({
  log: ui.log,
  onNoteOn: (note, velocity) => modeManager.handleNoteOn(note, velocity),
});

const enableControls = (enabled) => {
  ui.setControlsEnabled(enabled);
};

const toggleMode = (name, options) => {
  if (modeManager.getActive() === name) {
    modeManager.stop(name);
    return;
  }
  modeManager.start(name, options);
};

modeManager.register("rainbow", createRainbowMode({ midi, ui }));
modeManager.register("life", createLifeMode({ midi, ui }));
modeManager.register("ttt", createTttMode({ midi, ui }));
modeManager.register(
  "c4",
  createC4Mode({
    midi,
    ui,
    label: "Connect Four",
    setUiActive: ui.setC4UI,
  })
);
modeManager.register(
  "c4ai",
  createC4Mode({
    midi,
    ui,
    label: "Connect Four (1P)",
    setUiActive: ui.setC4AiUI,
  })
);

const { connectBtn, enterProgBtn, exitProgBtn, lightDemoBtn, rainbowDiagBtn, lifeModeBtn, ticTacToeBtn, connectFourBtn, connectFourAiBtn, clearBtn, midiInSelect, midiOutSelect } = elements;

connectBtn.addEventListener("click", async () => {
  try {
    await midi.requestAccess(midiInSelect, midiOutSelect, () => {
      ui.log("MIDI ports changed.");
    });
    ui.log("MIDI access granted.");
    ui.setStatus(true, "Connected");
    enableControls(true);
  } catch (error) {
    ui.log(`Failed to get MIDI access: ${error.message}`);
  }
});

midiInSelect.addEventListener("change", () => midi.attachInput(midiInSelect));
midiOutSelect.addEventListener("change", () => midi.attachOutput(midiOutSelect));

enterProgBtn.addEventListener("click", () => {
  midi.sendSysEx([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0e, 0x0e, 0x01, 0xf7]);
  ui.log("Entered Programmer Mode.");
});

exitProgBtn.addEventListener("click", () => {
  midi.sendSysEx([0xf0, 0x00, 0x20, 0x29, 0x02, 0x0e, 0x0e, 0x00, 0xf7]);
  ui.log("Exited Programmer Mode.");
});

lightDemoBtn.addEventListener("click", () => {
  for (let row = 1; row <= 8; row += 1) {
    for (let col = 1; col <= 8; col += 1) {
      const note = row * 10 + col;
      const velocity = Math.min(127, 8 + row * 8 + col * 2);
      midi.sendNoteOn(note, velocity);
    }
  }
});

clearBtn.addEventListener("click", () => {
  midi.clearGrid();
  ui.log("Cleared grid.");
});

rainbowDiagBtn.addEventListener("click", () => {
  toggleMode("rainbow");
});

lifeModeBtn.addEventListener("click", () => {
  toggleMode("life");
});

ticTacToeBtn.addEventListener("click", () => {
  midi.clearGrid();
  toggleMode("ttt");
});

connectFourBtn.addEventListener("click", () => {
  midi.clearGrid();
  toggleMode("c4", { ai: false });
  ui.setC4AiUI(false);
});

connectFourAiBtn.addEventListener("click", () => {
  midi.clearGrid();
  toggleMode("c4ai", { ai: true });
  ui.setC4UI(false);
});

if (!navigator.requestMIDIAccess) {
  ui.log("Web MIDI is not supported in this browser.");
}
