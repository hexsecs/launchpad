import { rowColToNote, noteToRowCol } from "../grid.js";

export const createC4Mode = ({ midi, ui, label, setUiActive }) => {
  let running = false;
  let board = null;
  let turn = 1;
  let winner = null;
  let winLine = null;
  let winTimer = null;
  let winPulsing = false;
  let dropTimer = null;
  let dropping = false;
  let aiEnabled = false;
  let aiPending = false;
  let padColors = new Map();

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
    const p1Color = 5;
    const p2Color = 45;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const value = board[row][col];
        if (!value) continue;
        frame.set(rowColToNote(row, col), value === 1 ? p1Color : p2Color);
      }
    }
    return frame;
  };

  const render = () => {
    applyFrame(buildFrame());
  };

  const renderWithDrop = (row, col, color) => {
    const frame = buildFrame();
    frame.set(rowColToNote(row, col), color);
    applyFrame(frame);
  };

  const checkWinner = (boardState = board) => {
    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 },
    ];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const value = boardState[row][col];
        if (!value) continue;
        for (const { dr, dc } of directions) {
          const line = [{ row, col }];
          for (let step = 1; step < 4; step += 1) {
            const r = row + dr * step;
            const c = col + dc * step;
            if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
            if (boardState[r][c] !== value) break;
            line.push({ row: r, col: c });
          }
          if (line.length === 4) {
            return { winner: value, line };
          }
        }
      }
    }
    const filled = boardState.flat().every((cell) => cell);
    return filled ? { winner: "draw", line: null } : null;
  };

  const runWinAnimation = (winValue) => {
    const winColor = winValue === 1 ? 5 : 45;
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
            highlightFrame.set(rowColToNote(cell.row, cell.col), highlightColor);
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
    const dimColor = 13;
    let step = 0;
    winTimer = setInterval(() => {
      const frame = new Map();
      if (step % 2 === 0) {
        for (let row = 0; row < 8; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            frame.set(rowColToNote(row, col), dimColor);
          }
        }
      }
      applyFrame(frame);
      step += 1;
      if (step >= 8) {
        clearInterval(winTimer);
        winTimer = null;
        winner = null;
        winLine = null;
        winPulsing = false;
        board = Array.from({ length: 8 }, () => Array(8).fill(null));
        turn = 1;
        render();
        midi.setOuterPulseColor(5);
        ui.log("Connect Four reset.");
      }
    }, 220);
  };

  const handlePress = (note) => {
    if (!running) return;
    if (winTimer && !winPulsing) return;
    if (dropping) return;
    if (aiPending) return;
    if (aiEnabled && turn === 2) return;
    if (winner) {
      winner = null;
      winLine = null;
      board = Array.from({ length: 8 }, () => Array(8).fill(null));
      turn = 1;
      if (winTimer) {
        clearInterval(winTimer);
        winTimer = null;
      }
      if (dropTimer) {
        clearInterval(dropTimer);
        dropTimer = null;
      }
      winPulsing = false;
      dropping = false;
      aiPending = false;
      render();
      midi.setOuterPulseColor(5);
      ui.log("Connect Four reset.");
      return;
    }
    const { col } = noteToRowCol(note);
    runDrop(col);
  };

  const runDrop = (col) => {
    let targetRow = -1;
    for (let row = 0; row < 8; row += 1) {
      if (!board[row][col]) {
        targetRow = row;
        break;
      }
    }
    if (targetRow === -1) return;
    const dropColor = turn === 1 ? 5 : 45;
    let dropRow = 7;
    dropping = true;
    if (dropTimer) {
      clearInterval(dropTimer);
      dropTimer = null;
    }
    dropTimer = setInterval(() => {
      renderWithDrop(dropRow, col, dropColor);
      if (dropRow === targetRow) {
        clearInterval(dropTimer);
        dropTimer = null;
        dropping = false;
        board[targetRow][col] = turn;
        const result = checkWinner();
        if (result) {
          winner = result.winner;
          winLine = result.line;
          render();
          midi.clearOuterButtons();
          if (result.winner === "draw") {
            ui.log("Connect Four: draw.");
            runDrawAnimation();
          } else {
            ui.log(`Connect Four: ${result.winner === 1 ? "Red" : "Blue"} wins.`);
            runWinAnimation(result.winner);
          }
          return;
        }
        turn = turn === 1 ? 2 : 1;
        render();
        midi.setOuterPulseColor(turn === 1 ? 5 : 45);
        if (aiEnabled && turn === 2) scheduleAiMove();
        return;
      }
      dropRow -= 1;
    }, 80);
  };

  const scheduleAiMove = () => {
    if (!aiEnabled || !running) return;
    if (winTimer || dropping || aiPending) return;
    aiPending = true;
    setTimeout(() => {
      aiPending = false;
      if (!aiEnabled || !running) return;
      if (turn !== 2 || dropping || winTimer) return;
      const col = pickAiColumn();
      if (col == null) return;
      runDrop(col);
    }, 220);
  };

  const pickAiColumn = () => {
    const available = [];
    for (let col = 0; col < 8; col += 1) {
      if (!board[7][col]) available.push(col);
    }
    if (!available.length) return null;
    const tryColFor = (player) => {
      for (const col of available) {
        let targetRow = -1;
        for (let row = 0; row < 8; row += 1) {
          if (!board[row][col]) {
            targetRow = row;
            break;
          }
        }
        if (targetRow === -1) continue;
        const copy = board.map((r) => r.slice());
        copy[targetRow][col] = player;
        const result = checkWinner(copy);
        if (result && result.winner === player) return col;
      }
      return null;
    };
    const winCol = tryColFor(2);
    if (winCol != null) return winCol;
    const blockCol = tryColFor(1);
    if (blockCol != null) return blockCol;
    const center = [3, 4, 2, 5, 1, 6, 0, 7];
    for (const col of center) {
      if (available.includes(col)) return col;
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const start = ({ ai } = {}) => {
    running = true;
    board = Array.from({ length: 8 }, () => Array(8).fill(null));
    turn = 1;
    winner = null;
    winLine = null;
    winPulsing = false;
    dropping = false;
    aiEnabled = Boolean(ai);
    aiPending = false;
    if (winTimer) {
      clearInterval(winTimer);
      winTimer = null;
    }
    if (dropTimer) {
      clearInterval(dropTimer);
      dropTimer = null;
    }
    padColors = new Map();
    setUiActive(true);
    render();
    midi.setOuterPulseColor(5);
    ui.log(`Started ${label}.`);
  };

  const stop = () => {
    running = false;
    board = null;
    turn = 1;
    winner = null;
    winLine = null;
    if (winTimer) {
      clearInterval(winTimer);
      winTimer = null;
    }
    if (dropTimer) {
      clearInterval(dropTimer);
      dropTimer = null;
    }
    winPulsing = false;
    dropping = false;
    aiEnabled = false;
    aiPending = false;
    applyFrame(new Map());
    padColors.clear();
    midi.clearOuterButtons();
    setUiActive(false);
    ui.log(`Stopped ${label}.`);
  };

  return {
    start,
    stop,
    onNoteOn: (note) => handlePress(note),
  };
};
