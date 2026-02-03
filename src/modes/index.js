export const createModeManager = () => {
  const modes = new Map();
  let active = null;

  const register = (name, mode) => {
    modes.set(name, mode);
  };

  const stopActive = () => {
    if (!active) return;
    const mode = modes.get(active);
    if (mode && mode.stop) mode.stop();
    active = null;
  };

  const start = (name, options = {}) => {
    if (active === name) {
      stopActive();
      return;
    }
    stopActive();
    const mode = modes.get(name);
    if (!mode || !mode.start) return;
    mode.start(options);
    active = name;
  };

  const stop = (name) => {
    if (active !== name) return;
    stopActive();
  };

  const handleNoteOn = (note, velocity) => {
    if (!active) return;
    const mode = modes.get(active);
    if (mode && mode.onNoteOn) mode.onNoteOn(note, velocity);
  };

  return {
    register,
    start,
    stop,
    handleNoteOn,
    getActive: () => active,
  };
};
