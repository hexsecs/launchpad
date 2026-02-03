const OUTER_CCS = [
  1, 2, 3, 4, 5, 6, 7, 8,
  10, 20, 30, 40, 50, 60, 70, 80,
  90, 91, 92, 93, 94, 95, 96, 97, 98,
  89, 79, 69, 59, 49, 39, 29, 19,
  101, 102, 103, 104, 105, 106, 107, 108,
  99,
];

export const createMidi = ({ log, onNoteOn }) => {
  let midiAccess;
  let midiIn;
  let midiOut;

  const refreshPorts = (midiInSelect, midiOutSelect) => {
    midiInSelect.innerHTML = "";
    midiOutSelect.innerHTML = "";

    if (!midiAccess) return;

    for (const input of midiAccess.inputs.values()) {
      const option = document.createElement("option");
      option.value = input.id;
      option.textContent = input.name || input.id;
      midiInSelect.appendChild(option);
    }
    for (const output of midiAccess.outputs.values()) {
      const option = document.createElement("option");
      option.value = output.id;
      option.textContent = output.name || output.id;
      midiOutSelect.appendChild(option);
    }
  };

  const selectLaunchpadDefaults = (midiInSelect, midiOutSelect) => {
    const preferNames = [/launchpad\s+pro/i, /launchpad/i, /lpp3/i];
    const excludeNames = [/network/i, /live\s+session/i];
    const pick = (selectEl) => {
      const options = Array.from(selectEl.options);
      const filtered = options.filter(
        (opt) => !excludeNames.some((rx) => rx.test(opt.textContent || ""))
      );
      for (const rx of preferNames) {
        const match = filtered.find((opt) => rx.test(opt.textContent || ""));
        if (match) {
          selectEl.value = match.value;
          return;
        }
      }
    };
    pick(midiInSelect);
    pick(midiOutSelect);
  };

  const attachInput = (midiInSelect) => {
    if (midiIn) midiIn.onmidimessage = null;
    midiIn = midiAccess.inputs.get(midiInSelect.value) || null;
    if (!midiIn) return;

    midiIn.onmidimessage = (event) => {
      const data = Array.from(event.data).map((b) => b.toString(16).padStart(2, "0"));
      log(`IN  ${data.join(" ")}`);
      const status = event.data[0] & 0xf0;
      const note = event.data[1];
      const velocity = event.data[2];
      if (status === 0x90 && velocity > 0) {
        onNoteOn(note, velocity);
      }
    };
    log(`Listening to input: ${midiIn.name}`);
  };

  const attachOutput = (midiOutSelect) => {
    midiOut = midiAccess.outputs.get(midiOutSelect.value) || null;
    if (midiOut) log(`Using output: ${midiOut.name}`);
  };

  const requestAccess = async (midiInSelect, midiOutSelect, onStateChange) => {
    midiAccess = await navigator.requestMIDIAccess({ sysex: true });
    refreshPorts(midiInSelect, midiOutSelect);
    if (midiInSelect.options.length) midiInSelect.selectedIndex = 0;
    if (midiOutSelect.options.length) midiOutSelect.selectedIndex = 0;
    selectLaunchpadDefaults(midiInSelect, midiOutSelect);
    attachInput(midiInSelect);
    attachOutput(midiOutSelect);

    midiAccess.onstatechange = () => {
      refreshPorts(midiInSelect, midiOutSelect);
      selectLaunchpadDefaults(midiInSelect, midiOutSelect);
      attachInput(midiInSelect);
      attachOutput(midiOutSelect);
      if (onStateChange) onStateChange();
    };
  };

  const sendSysEx = (bytes) => {
    if (!midiOut) return;
    midiOut.send(bytes);
    const printable = bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");
    log(`OUT ${printable}`);
  };

  const sendCC = (status, cc, value) => {
    if (!midiOut) return;
    midiOut.send([status, cc, value]);
  };

  const sendNoteOn = (note, velocity) => {
    if (!midiOut) return;
    midiOut.send([0x90, note, velocity]);
    log(`OUT 90 ${note.toString(16).padStart(2, "0")} ${velocity.toString(16).padStart(2, "0")}`);
  };

  const sendNoteOff = (note) => {
    if (!midiOut) return;
    midiOut.send([0x80, note, 0x00]);
  };

  const clearGrid = () => {
    for (let row = 1; row <= 8; row += 1) {
      for (let col = 1; col <= 8; col += 1) {
        const note = row * 10 + col;
        sendNoteOff(note);
      }
    }
  };

  const setOuterPulseColor = (color) => {
    for (const cc of OUTER_CCS) {
      sendCC(0xb2, cc, color);
    }
  };

  const clearOuterButtons = () => {
    for (const cc of OUTER_CCS) {
      sendCC(0xb0, cc, 0);
    }
  };

  return {
    requestAccess,
    refreshPorts,
    selectLaunchpadDefaults,
    attachInput,
    attachOutput,
    sendSysEx,
    sendCC,
    sendNoteOn,
    sendNoteOff,
    clearGrid,
    setOuterPulseColor,
    clearOuterButtons,
  };
};
