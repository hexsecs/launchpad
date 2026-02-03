export const createRainbowMode = ({ midi, ui }) => {
  let timer = null;

  const start = () => {
    const palette = [5, 13, 21, 29, 45, 53, 61, 69];
    let step = 0;
    timer = setInterval(() => {
      for (let row = 1; row <= 8; row += 1) {
        for (let col = 1; col <= 8; col += 1) {
          const note = row * 10 + col;
          const diag = (8 - row) + (8 - col);
          const color = palette[(diag + step) % palette.length];
          midi.sendNoteOn(note, color);
        }
      }
      step = (step + 1) % palette.length;
    }, 120);
    ui.setRainbowUI(true);
    ui.log("Started diagonal rainbow animation.");
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    midi.clearGrid();
    ui.setRainbowUI(false);
    ui.log("Stopped diagonal rainbow animation.");
  };

  return { start, stop };
};
