const cells = [...document.querySelectorAll('.cell')];
const statusLine = document.querySelector('#status');
const statusText = statusLine.lastElementChild;
const modeTwo = document.querySelector('#mode-two');
const modeComputer = document.querySelector('#mode-computer');
const newGameButton = document.querySelector('#new-game');
const resetScoreButton = document.querySelector('#reset-score');
const scoreX = document.querySelector('#wins-x');
const scoreO = document.querySelector('#wins-o');
const cardX = document.querySelector('#score-x');
const cardO = document.querySelector('#score-o');
const nameO = document.querySelector('#name-o');
const soundButton = document.querySelector('#sound-button');
const winLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

let board = Array(9).fill('');
let turn = 'X';
let mode = 'two';
let scores = { X: 0, O: 0 };
let finished = false;
let soundEnabled = false;
let audioContext;

function announce(message, state = '') {
  statusText.textContent = message;
  statusLine.classList.toggle('won', state === 'won');
  statusLine.classList.toggle('drawn', state === 'drawn');
}

function paint() {
  cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value === 'X' ? '×' : value === 'O' ? '○' : '';
    cell.classList.toggle('mark-o', value === 'O');
    cell.disabled = Boolean(value) || finished;
    const row = Math.floor(index / 3) + 1;
    const column = index % 3 + 1;
    cell.setAttribute('aria-label', `Row ${row}, column ${column}, ${value ? value : 'empty'}`);
  });
  cardX.classList.toggle('active', !finished && turn === 'X');
  cardO.classList.toggle('active', !finished && turn === 'O');
  scoreX.textContent = String(scores.X);
  scoreO.textContent = String(scores.O);
}

function winner(cellsToCheck = board) {
  for (const line of winLines) {
    const [a, b, c] = line;
    if (cellsToCheck[a] && cellsToCheck[a] === cellsToCheck[b] && cellsToCheck[b] === cellsToCheck[c]) {
      return { player: cellsToCheck[a], line };
    }
  }
  return null;
}

function playSound(frequency = 560) {
  if (!soundEnabled) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.035, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .09);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .09);
}

function finishTurn() {
  const result = winner();
  if (result) {
    finished = true;
    scores[result.player] += 1;
    result.line.forEach(index => cells[index].classList.add('winning'));
    const winnerName = result.player === 'X' ? 'Player X' : mode === 'computer' ? 'The computer' : 'Player O';
    announce(`${winnerName} wins this round!`, 'won');
    playSound(880);
  } else if (board.every(Boolean)) {
    finished = true;
    announce('A draw. Nicely played.', 'drawn');
    playSound(420);
  } else {
    turn = turn === 'X' ? 'O' : 'X';
    const next = turn === 'X' ? 'Player X' : mode === 'computer' ? 'The computer' : 'Player O';
    announce(`${next}'s turn`);
  }
  paint();
}

function place(index, player) {
  if (finished || board[index]) return;
  board[index] = player;
  playSound(player === 'X' ? 610 : 510);
  finishTurn();
}

function minimax(state, player, depth = 0) {
  const result = winner(state);
  if (result?.player === 'O') return { score: 10 - depth };
  if (result?.player === 'X') return { score: depth - 10 };
  const available = state.map((value, index) => value ? -1 : index).filter(index => index >= 0);
  if (!available.length) return { score: 0 };
  const moves = [];
  for (const index of available) {
    state[index] = player;
    const next = minimax(state, player === 'O' ? 'X' : 'O', depth + 1);
    state[index] = '';
    moves.push({ index, score: next.score });
  }
  return player === 'O' ? moves.reduce((best, move) => move.score > best.score ? move : best) : moves.reduce((best, move) => move.score < best.score ? move : best);
}

function computerMove() {
  if (mode !== 'computer' || turn !== 'O' || finished) return;
  announce('The computer is thinking…');
  window.setTimeout(() => {
    if (finished || turn !== 'O') return;
    place(minimax([...board], 'O').index, 'O');
  }, 340);
}

cells.forEach(cell => cell.addEventListener('click', () => {
  if (mode === 'computer' && turn === 'O') return;
  place(Number(cell.dataset.index), turn);
  if (!finished) computerMove();
}));

function startRound() {
  board = Array(9).fill('');
  turn = 'X';
  finished = false;
  cells.forEach(cell => cell.classList.remove('winning'));
  announce("Player X's turn");
  paint();
}

function setMode(nextMode) {
  mode = nextMode;
  modeTwo.setAttribute('aria-pressed', String(mode === 'two'));
  modeComputer.setAttribute('aria-pressed', String(mode === 'computer'));
  nameO.textContent = mode === 'computer' ? 'COMPUTER' : 'PLAYER O';
  scores = { X: 0, O: 0 };
  startRound();
}

modeTwo.addEventListener('click', () => setMode('two'));
modeComputer.addEventListener('click', () => setMode('computer'));
newGameButton.addEventListener('click', startRound);
resetScoreButton.addEventListener('click', () => {
  scores = { X: 0, O: 0 };
  startRound();
});
soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.setAttribute('aria-label', soundEnabled ? 'Disable sound' : 'Enable sound');
  if (soundEnabled) playSound();
});

paint();
