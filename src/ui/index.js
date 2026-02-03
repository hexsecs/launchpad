export const createUi = () => {
  const connectBtn = document.getElementById("connect");
  const enterProgBtn = document.getElementById("enterProg");
  const exitProgBtn = document.getElementById("exitProg");
  const lightDemoBtn = document.getElementById("lightDemo");
  const rainbowDiagBtn = document.getElementById("rainbowDiag");
  const lifeModeBtn = document.getElementById("lifeMode");
  const ticTacToeBtn = document.getElementById("ticTacToe");
  const connectFourBtn = document.getElementById("connectFour");
  const connectFourAiBtn = document.getElementById("connectFourAi");
  const clearBtn = document.getElementById("clear");
  const midiInSelect = document.getElementById("midiIn");
  const midiOutSelect = document.getElementById("midiOut");
  const logEl = document.getElementById("log");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  const log = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    logEl.textContent += `[${timestamp}] ${message}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  };

  const setStatus = (connected, label) => {
    statusDot.classList.toggle("ok", connected);
    statusText.textContent = label;
  };

  const setRainbowUI = (on) => {
    rainbowDiagBtn.classList.toggle("active", on);
    rainbowDiagBtn.textContent = on ? "Stop Rainbow" : "Rainbow Diagonal";
  };

  const setLifeUI = (on) => {
    lifeModeBtn.classList.toggle("active", on);
    lifeModeBtn.textContent = on ? "Stop Game of Life" : "Game of Life";
  };

  const setTttUI = (on) => {
    ticTacToeBtn.classList.toggle("active", on);
    ticTacToeBtn.textContent = on ? "Stop Tic Tac Toe" : "Tic Tac Toe";
  };

  const setC4UI = (on) => {
    connectFourBtn.classList.toggle("active", on);
    connectFourBtn.textContent = on ? "Stop Connect Four" : "Connect Four";
  };

  const setC4AiUI = (on) => {
    connectFourAiBtn.classList.toggle("active", on);
    connectFourAiBtn.textContent = on ? "Stop Connect Four (1P)" : "Connect Four (1P)";
  };

  const setControlsEnabled = (enabled) => {
    enterProgBtn.disabled = !enabled;
    exitProgBtn.disabled = !enabled;
    lightDemoBtn.disabled = !enabled;
    rainbowDiagBtn.disabled = !enabled;
    lifeModeBtn.disabled = !enabled;
    ticTacToeBtn.disabled = !enabled;
    connectFourBtn.disabled = !enabled;
    connectFourAiBtn.disabled = !enabled;
    clearBtn.disabled = !enabled;
  };

  return {
    elements: {
      connectBtn,
      enterProgBtn,
      exitProgBtn,
      lightDemoBtn,
      rainbowDiagBtn,
      lifeModeBtn,
      ticTacToeBtn,
      connectFourBtn,
      connectFourAiBtn,
      clearBtn,
      midiInSelect,
      midiOutSelect,
    },
    log,
    setStatus,
    setRainbowUI,
    setLifeUI,
    setTttUI,
    setC4UI,
    setC4AiUI,
    setControlsEnabled,
  };
};
