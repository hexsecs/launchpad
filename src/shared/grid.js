export const noteToRowCol = (note) => {
  const row = Math.floor(note / 10) - 1;
  const col = (note % 10) - 1;
  return { row, col };
};

export const rowColToNote = (row, col) => (row + 1) * 10 + (col + 1);
