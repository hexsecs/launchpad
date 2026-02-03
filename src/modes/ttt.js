import { rowColToNote, noteToRowCol } from "../shared/grid.js";

export const createTttMode = ({ midi, ui }) => {
  let running = false;
  let board = null;
  let turn = "X";
  let winner = null;
  let winLine = null;
  let winTimer = null;
  let winPulsing = false;
  let padColors = new Map();

  const bands = [
    [0, 1],
    [3, 4],
    [6, 7],
  ];
  const gridLines = [2, 5];

  const bandIndex = (value) => {
    if (value <= 1) return 0;
    if (value <= 4) return 1;
    return 2;
  };

  const map = new Map();
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      map.set(rowColToNote(row, col), { row: bandIndex(row), col: bandIndex(col) });
    }
  }

  const applyFrame = (frame) => {
    const allNotes = new Set([...padColors.keys(), ...frame.keys()]);
    for (const note of allNotes) {
      const prev = padColors.get(note);
      const next = frame.get(note);
      if (prev === next) continue;
      if (next == null) {
        midi.sendNoteOff(note);
        padColors.delete(note);
      } else {
        midi.sendNoteOn(note, next);
        padColors.set(note, next);
      }
    }
  };

  const buildFrame = () => {
    const frame = new Map();
    const xColor = 5;
    const oColor = 45;
    const gridColor = 3;

    for (let cellRow = 0; cellRow < 3; cellRow += 1) {
      for (let cellCol = 0; cellCol < 3; cellCol += 1) {
        const value = board[cellRow][cellCol];
        if (!value) continue;
        const [rowStart, rowEnd] = bands[cellRow];
        const [colStart, colEnd] = bands[cellCol];
        const color = value === "X" ? xColor : oColor;
        for (let row = rowStart; row <= rowEnd; row += 1) {
          for (let col = colStart; col <= colEnd; col += 1) {
            frame.set(rowColToNote(row, col), color);
          }
        }
      }
    }

    for (const line of gridLines) {
      for (let col = 0; col < 8; col += 1) {
        frame.set(rowColToNote(line, col), gridColor);
      }
      for (let row = 0; row < 8; row += 1) {
        frame.set(rowColToNote(row, line), gridColor);
      }
    }
    return frame;
  };

  const render = () => {
    applyFrame(buildFrame());
  };

  const checkWinner = () => {
    const lines = [
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
      [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ],
      [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ],
      [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
      ],
      [
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ],
      [
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
      ],
      [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ],
      [
        { row: 0, col: 2 },
        { row: 1, col: 1 },
        { row: 2, col: 0 },
      ],
    ];
    for (const line of lines) {
      const [a, bCell, c] = line;
      const value = board[a.row][a.col];
      if (value && value === board[bCell.row][bCell.col] && value === board[c.row][c.col]) {
        return { winner: value, line };
      }
    }
    const filled = board.flat().every((cell) => cell);
    return filled ? { winner: "draw", line: null } : null;
  };

  const runWinAnimation = (winValue) => {
    const winColor = winValue === "X" ? 5 : 45;
    midi.setOuterPulseColor(winColor);
    const fillHeights = Array.from({ length: 8 }, () => 0);
    const dropPositions = Array.from({ length: 8 }, () => -Math.floor(Math.random() * 4));
    winTimer = setInterval(() => {
      const frame = new Map();
      for (let col = 0; col < 8; col += 1) {
        const height = fillHeights[col];
        if (height < 8) {
          let drop = dropPositions[col] + 1;
          const targetRow = 7 - height;
          if (drop >= targetRow) {
            fillHeights[col] = Math.min(8, height + 1);
            drop = -Math.floor(Math.random() * 3);
          } else {
            dropPositions[col] = drop;
            if (drop >= 0) {
              frame.set(rowColToNote(drop, col), winColor);
            }
          }
        }
        for (let i = 0; i < fillHeights[col]; i += 1) {
          const row = 7 - i;
          frame.set(rowColToNote(row, col), winColor);
        }
      }
      applyFrame(frame);
      if (fillHeights.every((height) => height >= 8)) {
        const fullFrame = new Map();
        for (let row = 0; row < 8; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            fullFrame.set(rowColToNote(row, col), winColor);
          }
        }
        applyFrame(fullFrame);
        clearInterval(winTimer);
        winTimer = null;
        if (winLine) {
          const highlightColor = 3;
          const highlightFrame = new Map(fullFrame);
          for (const cell of winLine) {
            const [rowStart, rowEnd] = bands[cell.row];
            const [colStart, colEnd] = bands[cell.col];
            for (let row = rowStart; row <= rowEnd; row += 1) {
              for (let col = colStart; col <= colEnd; col += 1) {
                highlightFrame.set(rowColToNote(row, col), highlightColor);
              }
            }
          }
          let pulseOn = true;
          winTimer = setInterval(() => {
            applyFrame(pulseOn ? highlightFrame : fullFrame);
            pulseOn = !pulseOn;
          }, 260);
          winPulsing = true;
        }
      }
    }, 140);
  };

  const runDrawAnimation = () => {
    if (winTimer) {
      clearInterval(winTimer);
      winTimer = null;
    }
    const baseColor = 13;
    const accentColor = 45;
    const toFrame = (coords, color) => {
      const frame = new Map();
      for (const [row, col] of coords) {
        frame.set(rowColToNote(row, col), color);
      }
      return frame;
    };
    const catFace = [
      [1, 1], [1, 6],
      [2, 2], [2, 5],
      [3, 1], [3, 6],
      [4, 2], [4, 5],
      [5, 1], [5, 6],
      [6, 2], [6, 3], [6, 4], [6, 5],
    ];
    const catBlink = [
      [2, 2], [2, 5],
      [4, 1], [4, 6],
      [5, 2], [5, 5],
      [6, 2], [6, 3], [6, 4], [6, 5],
    ];
    const whiskers = [
      [3, 0], [3, 1], [3, 2],
      [3, 5], [3, 6], [3, 7],
    ];
    const frameA = toFrame([...catFace, ...whiskers], baseColor);
    const frameB = toFrame([...catBlink, ...whiskers], accentColor);
    const frames = [frameA, frameB];

    let step = 0;
    winTimer = setInterval(() => {
      applyFrame(frames[step % 2]);
      step += 1;
      if (step >= 10) {
        clearInterval(winTimer);
        winTimer = null;
        winner = null;
        winLine = null;
        winPulsing = false;
        board = Array.from({ length: 3 }, () => Array(3).fill(null));
        turn = "X";
        render();
        midi.setOuterPulseColor(5);
        ui.log("Tic Tac Toe reset.");
      }
    }, 220);
  };

  const handlePress = (note) => {
    if (!running) return;
    if (winner) {
      winner = null;
      winLine = null;
      board = Array.from({ length: 3 }, () => Array(3).fill(null));
      turn = "X";
      if (winTimer) {
        clearInterval(winTimer);
        winTimer = null;
      }
      winPulsing = false;
      render();
      midi.setOuterPulseColor(5);
      ui.log("Tic Tac Toe reset.");
      return;
    }
    if (winTimer && !winPulsing) return;
    const { row, col } = noteToRowCol(note);
    if (gridLines.includes(row) || gridLines.includes(col)) return;
    const cell = map.get(note);
    if (!cell) return;
    if (board[cell.row][cell.col]) return;
    board[cell.row][cell.col] = turn;
    const result = checkWinner();
    if (result) {
      winner = result.winner;
      winLine = result.line;
      render();
      if (result.winner === "draw") {
        midi.clearOuterButtons();
        ui.log("Tic Tac Toe: draw.");
        runDrawAnimation();
      } else {
        midi.clearOuterButtons();
        ui.log(`Tic Tac Toe: ${result.winner} wins.`);
        runWinAnimation(result.winner);
      }
      return;
    }
    turn = turn === "X" ? "O" : "X";
    render();
    midi.setOuterPulseColor(turn === "X" ? 5 : 45);
  };

  const start = () => {
    running = true;
    board = Array.from({ length: 3 }, () => Array(3).fill(null));
    turn = "X";
    winner = null;
    winLine = null;
    winPulsing = false;
    if (winTimer) {
      clearInterval(winTimer);
      winTimer = null;
    }
    padColors = new Map();
    ui.setTttUI(true);
    render();
    midi.setOuterPulseColor(5);
    ui.log("Started Tic Tac Toe.");
  };

  const stop = () => {
    running = false;
    board = null;
    turn = "X";
    winner = null;
    winLine = null;
    if (winTimer) {
      clearInterval(winTimer);
      winTimer = null;
    }
    winPulsing = false;
    applyFrame(new Map());
    padColors.clear();
    midi.clearOuterButtons();
    ui.setTttUI(false);
    ui.log("Stopped Tic Tac Toe.");
  };

  return {
    start,
    stop,
    onNoteOn: (note) => handlePress(note),
  };
};
