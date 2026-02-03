export const createLifeMode = ({ midi, ui }) => {
  let timer = null;
  let grid = null;

  const start = () => {
    const size = 8;
    grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.random() > 0.7)
    );

    const render = () => {
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          const note = (row + 1) * 10 + (col + 1);
          if (grid[row][col]) {
            midi.sendNoteOn(note, 60);
          } else {
            midi.sendNoteOff(note);
          }
        }
      }
    };

    const stepLife = () => {
      const next = Array.from({ length: size }, () => Array(size).fill(false));
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          let neighbors = 0;
          for (let dr = -1; dr <= 1; dr += 1) {
            for (let dc = -1; dc <= 1; dc += 1) {
              if (dr === 0 && dc === 0) continue;
              const r = row + dr;
              const c = col + dc;
              if (r >= 0 && r < size && c >= 0 && c < size && grid[r][c]) {
                neighbors += 1;
              }
            }
          }
          const alive = grid[row][col];
          next[row][col] = alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
        }
      }
      grid = next;
      render();
    };

    render();
    timer = setInterval(stepLife, 250);
    ui.setLifeUI(true);
    ui.log("Started Game of Life.");
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    grid = null;
    midi.clearGrid();
    ui.setLifeUI(false);
    ui.log("Stopped Game of Life.");
  };

  return { start, stop };
};
