import {
  isDomainBlocked as isPredefinedDomainBlocked,
  getRedirectUrlForDomain,
  getDomainCategory,
} from "./constants";
import {
  isDomainBlocked as isCustomDomainBlocked,
  incrementBlockCounter,
  getSettings,
} from "./storage";

declare const chrome: any;

// Check current domain on page load
async function checkAndRedirect() {
  console.log("Running check and redirect");
  const currentDomain = window.location.hostname;

  console.log({ currentDomain });

  const settings = await getSettings();
  if (!settings?.enabled) return;

  // For predefined domains, also check whether the matching category is enabled
  const predefinedBlocked = (() => {
    if (!isPredefinedDomainBlocked(currentDomain)) return false;
    const category = getDomainCategory(currentDomain);
    if (category === null) return true;
    return (settings.blockedCategories ?? []).includes(category);
  })();

  const isBlocked = predefinedBlocked || (await isCustomDomainBlocked(currentDomain));

  if (isBlocked) {
    console.log(`[Self Respect] Blocking domain: ${currentDomain}`);

    await incrementBlockCounter();

    const blockingLevel = settings.blockingLevel || "soft";
    const autoRedirect = settings.autoRedirect !== false;
    const redirectDelay = settings.redirectDelay || 3;
    const redirectUrl = getRedirectUrlForDomain(currentDomain);

    switch (blockingLevel) {
      case "soft":
        showSoftBlockOverlay(currentDomain, redirectUrl, autoRedirect, redirectDelay);
        break;
      case "puzzle":
        showPuzzleBlockOverlay(currentDomain, redirectUrl, autoRedirect, redirectDelay);
        break;
      case "hard":
        showHardBlockOverlay(currentDomain, redirectUrl, autoRedirect, redirectDelay);
        break;
      default:
        showSoftBlockOverlay(currentDomain, redirectUrl, autoRedirect, redirectDelay);
    }
  }
}

// Helper function to remove existing overlay
function removeExistingOverlay() {
  const existingOverlay = document.getElementById("self-respect-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
}

// Helper function to create base overlay
function createBaseOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "self-respect-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1b1b1b;
    color: white;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    text-align: center;
    padding: 20px;
    overflow-y: auto;
  `;

  // Add CSS for buttons
  const style = document.createElement("style");
  style.textContent = `
    .overlay-button {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
      font-weight: 500;
    }
    .overlay-button.primary {
      background: #4CAF50;
      color: white;
    }
    .overlay-button.primary:hover {
      background: #45a049;
      transform: translateY(-2px);
    }
    .overlay-button.secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .overlay-button.secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .overlay-button.small {
      padding: 8px 16px;
      font-size: 0.9em;
    }
    .overlay-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);

  return overlay;
}

// Soft Block - Current implementation with redirect option
function showSoftBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running soft block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const countdownMessage = autoRedirect
    ? `You'll be redirected to a healthier alternative in ${redirectDelay} seconds.`
    : "This site may not align with your goals for self-respect and wellbeing.";

  const redirectInfo = autoRedirect
    ? `<div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          Redirecting to: <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>`
    : "";

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        You were about to visit <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        ${countdownMessage}
      </p>
      ${redirectInfo}
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          ${autoRedirect ? "Redirect Now" : "Go to Healthier Alternative"}
        </button>
        <button id="cancel-redirect" class="overlay-button secondary">
          Cancel (Temporarily Allow)
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>Remember: Every choice you make shapes who you become.</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Start auto-redirect timer if enabled
  let redirectTimer: number | null = null;
  if (autoRedirect) {
    redirectTimer = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, redirectDelay * 1000);

    // Update countdown display every second
    let timeLeft = redirectDelay;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    window.location.href = redirectUrl;
  });

  document.getElementById("cancel-redirect")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    overlay.remove();
  });
}

// Sudoku Block - Requires solving a hard Sudoku puzzle
function showPuzzleBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running Sudoku block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const overlay = createBaseOverlay();
  
  // Add Sudoku CSS
  const style = document.createElement('style');
  style.textContent = `
    .sudoku-container {
      max-width: 800px;
      background: rgba(255, 255, 255, 0.1);
      padding: 30px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
      margin: 0 auto;
    }
    
    .sudoku-header {
      text-align: center;
      margin-bottom: 25px;
    }
    
    .sudoku-header h1 {
      font-size: 2.2em;
      margin-bottom: 10px;
      color: white;
    }
    
    .sudoku-header p {
      font-size: 1.1em;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
    }
    
    .sudoku-game-area {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }
    
    .sudoku-stats {
      display: flex;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 10px;
      font-size: 1.1em;
    }
    
    .sudoku-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .sudoku-stat-label {
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 5px;
    }
    
    .sudoku-stat-value {
      font-size: 1.3em;
      font-weight: bold;
      color: white;
    }
    
    .sudoku-board-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    .sudoku-grid {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(9, 1fr);
      gap: 0;
      background: #2d3436;
      border: 3px solid #2d3436;
      border-radius: 5px;
      aspect-ratio: 1/1;
      max-width: 500px;
      width: 100%;
      position: relative;
    }
    
    .sudoku-cell {
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      border: 1px solid #ddd;
      min-height: 40px;
      position: relative;
      box-sizing: border-box;
    }
    
    /* Make section borders thicker */
    .sudoku-cell {
      border-top-width: 1px;
      border-right-width: 1px;
      border-bottom-width: 1px;
      border-left-width: 1px;
      border-style: solid;
      border-color: #ddd;
    }
    
    .sudoku-cell:hover {
      background: #f1f3f4;
    }
    
    .sudoku-cell-selected {
      background: #e3f2fd !important;
      box-shadow: inset 0 0 0 2px #2196F3;
    }
    
    .sudoku-cell-fixed {
      color: #2d3436;
      font-weight: 800;
      background: #f8f9fa;
      cursor: default;
    }
    
    .sudoku-cell-user {
      color: #2196F3;
    }
    
    .sudoku-cell-error {
      color: #f44336;
      background: #ffebee;
    }
    
    .sudoku-controls {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 500px;
    }
    
    .sudoku-number-pad {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    
    .sudoku-number-btn {
      padding: 15px;
      border: none;
      border-radius: 8px;
      font-size: 1.3em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    .sudoku-number-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .sudoku-number-btn-clear {
      background: rgba(244, 67, 54, 0.2);
      color: #ffcdd2;
      border-color: rgba(244, 67, 54, 0.3);
    }
    
    .sudoku-number-btn-clear:hover {
      background: rgba(244, 67, 54, 0.3);
    }
    
    .sudoku-action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
    }
    
    .sudoku-action-btn {
      padding: 15px 25px;
      border: none;
      border-radius: 10px;
      font-size: 1.1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .sudoku-action-btn-primary {
      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
      color: white;
    }
    
    .sudoku-action-btn-primary:hover {
      background: linear-gradient(135deg, #45a049 0%, #1b5e20 100%);
      transform: translateY(-2px);
    }
    
    .sudoku-action-btn-secondary {
      background: #2196F3;
      color: white;
    }
    
    .sudoku-action-btn-secondary:hover {
      background: #1976D2;
      transform: translateY(-2px);
    }
    
    .sudoku-instructions {
      background: rgba(0, 0, 0, 0.2);
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    
    .sudoku-instructions h3 {
      font-size: 1.2em;
      margin-bottom: 10px;
      color: #a3e4d7;
    }
    
    .sudoku-instructions ul {
      list-style: none;
      padding-left: 0;
    }
    
    .sudoku-instructions li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .sudoku-instructions li:before {
      content: "•";
      color: #a3e4d7;
      font-size: 1.2em;
      position: absolute;
      left: 0;
    }
    
    .sudoku-success {
      background: rgba(76, 175, 80, 0.2);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      margin-top: 20px;
      display: none;
    }
    
    .sudoku-success.show {
      display: block;
      animation: fadeIn 0.5s ease;
    }
    
    .sudoku-success h3 {
      color: #4CAF50;
      font-size: 1.5em;
      margin-bottom: 10px;
    }
    
    .sudoku-success p {
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 15px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .sudoku-error {
      background: rgba(244, 67, 54, 0.2);
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin-top: 10px;
      color: #ffcdd2;
      display: none;
    }
    
    .sudoku-error.show {
      display: block;
    }
    
    @media (max-width: 600px) {
      .sudoku-container {
        padding: 20px;
      }
      
      .sudoku-header h1 {
        font-size: 1.8em;
      }
      
      .sudoku-grid {
        max-width: 100%;
      }
      
      .sudoku-cell {
        font-size: 1.2em;
        min-height: 35px;
      }
      
      .sudoku-number-btn {
        padding: 12px;
        font-size: 1.1em;
      }
      
      .sudoku-action-btn {
        padding: 12px 20px;
        font-size: 1em;
      }
      
      .sudoku-stats {
        flex-direction: column;
        gap: 10px;
      }
      
      .sudoku-stat {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  `;
  overlay.appendChild(style);
  
  overlay.innerHTML += `
    <div class="sudoku-container">
      <div class="sudoku-header">
        <h1>Self Respect ✊ - Sudoku Challenge</h1>
        <p>
          You were about to visit <strong>${blockedDomain}</strong>.
          To access this site, you must solve a hard Sudoku puzzle. This is to ensure you truly want to proceed.
        </p>
      </div>

      <div class="sudoku-game-area">
        <div class="sudoku-stats">
          <div class="sudoku-stat">
            <div class="sudoku-stat-label">Time</div>
            <div class="sudoku-stat-value" id="sudoku-timer">00:00</div>
          </div>
          <div class="sudoku-stat">
            <div class="sudoku-stat-label">Difficulty</div>
            <div class="sudoku-stat-value">Hard</div>
          </div>
        </div>

        <div class="sudoku-board-container">
          <div class="sudoku-grid" id="sudoku-grid"></div>

          <div class="sudoku-controls">
            <div class="sudoku-number-pad">
              <button class="sudoku-number-btn" data-number="1">1</button>
              <button class="sudoku-number-btn" data-number="2">2</button>
              <button class="sudoku-number-btn" data-number="3">3</button>
              <button class="sudoku-number-btn" data-number="4">4</button>
              <button class="sudoku-number-btn" data-number="5">5</button>
              <button class="sudoku-number-btn" data-number="6">6</button>
              <button class="sudoku-number-btn" data-number="7">7</button>
              <button class="sudoku-number-btn" data-number="8">8</button>
              <button class="sudoku-number-btn" data-number="9">9</button>
              <button class="sudoku-number-btn sudoku-number-btn-clear" data-number="0">Clear</button>
            </div>

            <div class="sudoku-action-buttons">
              <button id="sudoku-check" class="sudoku-action-btn sudoku-action-btn-secondary">
                Check Solution
              </button>
            </div>
          </div>
        </div>

        <div class="sudoku-instructions">
          <h3>How to Solve Sudoku</h3>
          <ul>
            <li>Fill the grid so every row, column, and 3×3 box contains digits 1–9</li>
            <li>Click a cell to select it, then choose a number from the pad</li>
            <li>Use Check Solution to validate your progress</li>
            <li>Complete the puzzle to proceed to the website</li>
          </ul>
        </div>

        <div class="sudoku-success" id="sudoku-success">
          <h3>🎉 Puzzle Solved!</h3>
          <p id="sudoku-solved-msg"></p>
          <div class="sudoku-action-buttons">
            <button id="proceed-to-site" class="sudoku-action-btn sudoku-action-btn-primary">
              Proceed to ${blockedDomain}
            </button>
            <button id="choose-alternative" class="sudoku-action-btn sudoku-action-btn-secondary">
              ${autoRedirect ? "Choose Healthier Alternative" : "Go to Healthier Alternative"}
            </button>
          </div>
        </div>

        <div class="sudoku-error" id="sudoku-error"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Initialize Sudoku game
  initializeSudokuGame();
  
  // Set up event listeners
  setupSudokuEventListeners(blockedDomain, redirectUrl, autoRedirect, overlay);
}

// Sudoku game logic
let sudokuGameState = {
  board: Array(9).fill(null).map(() => Array(9).fill(0)),
  solution: Array(9).fill(null).map(() => Array(9).fill(0)),
  fixedCells: Array(9).fill(null).map(() => Array(9).fill(false)) as boolean[][],
  selectedCell: null as { row: number; col: number } | null,
  isSolved: false,
  startTime: 0,
  timerInterval: null as number | null,
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

// Canonical valid Sudoku grid used as a transformation seed.
// Generated with the "shift-3" Latin square pattern — every row, column and box holds 1-9.
const SUDOKU_SEED: readonly (readonly number[])[] = [
  [1,2,3,4,5,6,7,8,9],
  [4,5,6,7,8,9,1,2,3],
  [7,8,9,1,2,3,4,5,6],
  [2,3,4,5,6,7,8,9,1],
  [5,6,7,8,9,1,2,3,4],
  [8,9,1,2,3,4,5,6,7],
  [3,4,5,6,7,8,9,1,2],
  [6,7,8,9,1,2,3,4,5],
  [9,1,2,3,4,5,6,7,8],
];

function generateCompleteBoard(): number[][] {
  // 1. Relabel digits with a random permutation of 1-9
  const digitMap = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let board: number[][] = SUDOKU_SEED.map(row => row.map(d => digitMap[d - 1]));

  // 2. Shuffle the 3 rows inside each row-band  (bands: rows 0-2, 3-5, 6-8)
  for (let band = 0; band < 3; band++) {
    const order = shuffleArray([0, 1, 2]);
    const base = band * 3;
    const saved = [board[base].slice(), board[base + 1].slice(), board[base + 2].slice()];
    for (let i = 0; i < 3; i++) board[base + i] = saved[order[i]];
  }

  // 3. Shuffle the 3 columns inside each col-stack  (stacks: cols 0-2, 3-5, 6-8)
  for (let stack = 0; stack < 3; stack++) {
    const order = shuffleArray([0, 1, 2]);
    const base = stack * 3;
    for (let r = 0; r < 9; r++) {
      const saved = [board[r][base], board[r][base + 1], board[r][base + 2]];
      for (let i = 0; i < 3; i++) board[r][base + i] = saved[order[i]];
    }
  }

  // 4. Shuffle the 3 row-bands as whole units
  const bandOrder = shuffleArray([0, 1, 2]);
  const reorderedRows: number[][] = [];
  for (const b of bandOrder) reorderedRows.push(board[b * 3], board[b * 3 + 1], board[b * 3 + 2]);
  board = reorderedRows;

  // 5. Shuffle the 3 col-stacks as whole units
  const stackOrder = shuffleArray([0, 1, 2]);
  board = board.map(row => {
    const newRow: number[] = [];
    for (const s of stackOrder) newRow.push(row[s * 3], row[s * 3 + 1], row[s * 3 + 2]);
    return newRow;
  });

  // 6. Randomly transpose (reflects along the main diagonal)
  if (Math.random() < 0.5) {
    board = Array.from({ length: 9 }, (_, i) => board.map(row => row[i]));
  }

  return board;
}

// Count solutions up to maxCount, stopping early for performance.
// Modifies board in-place (caller must pass a copy).
function countSolutions(board: number[][], maxCount: number): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        let count = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            count += countSolutions(board, maxCount - count);
            board[row][col] = 0;
            if (count >= maxCount) return count;
          }
        }
        return count;
      }
    }
  }
  return 1; // No empty cells — one complete solution found
}

function removeCells(solution: number[][], cellsToRemove: number): number[][] {
  const board = solution.map(row => row.slice());

  // Visit cells in random order
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      positions.push([i, j]);
  shuffleArray(positions);

  let removed = 0;
  for (const pos of positions) {
    const row = pos[0];
    const col = pos[1];
    if (removed >= cellsToRemove) break;
    const saved = board[row][col];
    board[row][col] = 0;
    // Only keep the removal if the puzzle still has exactly one solution
    if (countSolutions(board.map(r => r.slice()), 2) === 1) {
      removed++;
    } else {
      board[row][col] = saved;
    }
  }

  return board;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer(): void {
  if (!sudokuGameState.startTime) return;
  
  const timerElement = document.getElementById('sudoku-timer');
  if (!timerElement) return;
  
  const elapsedSeconds = Math.floor((Date.now() - sudokuGameState.startTime) / 1000);
  timerElement.textContent = formatTime(elapsedSeconds);
}

function startTimer(): void {
  if (sudokuGameState.timerInterval) {
    clearInterval(sudokuGameState.timerInterval);
  }
  
  sudokuGameState.startTime = Date.now();
  sudokuGameState.timerInterval = window.setInterval(updateTimer, 1000);
}

function stopTimer(): void {
  if (sudokuGameState.timerInterval) {
    clearInterval(sudokuGameState.timerInterval);
    sudokuGameState.timerInterval = null;
  }
}

// Returns true if the value at (row, col) conflicts with another cell in the same row/col/box
function isConflicting(board: number[][], row: number, col: number): boolean {
  const val = board[row][col];
  if (val === 0) return false;
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === val) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === val) return true;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const r = startRow + i;
      const c = startCol + j;
      if ((r !== row || c !== col) && board[r][c] === val) return true;
    }
  }
  return false;
}

function checkSudokuWinCondition(): boolean {
  // Accept any valid Sudoku solution, not just the generated one
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (sudokuGameState.board[i][j] === 0) return false;
    }
  }
  for (let i = 0; i < 9; i++) {
    const rowVals = new Set(sudokuGameState.board[i]);
    if (rowVals.size !== 9) return false;
    const colVals = new Set(sudokuGameState.board.map(r => r[i]));
    if (colVals.size !== 9) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxVals = new Set<number>();
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          boxVals.add(sudokuGameState.board[br * 3 + i][bc * 3 + j]);
      if (boxVals.size !== 9) return false;
    }
  }
  return true;
}

function renderSudokuBoard(): void {
  const container = document.getElementById('sudoku-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.className = 'sudoku-cell';
      cell.dataset.row = row.toString();
      cell.dataset.col = col.toString();
      
      const value = sudokuGameState.board[row][col];
      if (value !== 0) {
        cell.textContent = value.toString();

        if (sudokuGameState.fixedCells[row][col]) {
          cell.classList.add('sudoku-cell-fixed');
        } else {
          cell.classList.add('sudoku-cell-user');
          if (isConflicting(sudokuGameState.board, row, col)) {
            cell.classList.add('sudoku-cell-error');
          }
        }
      }
      
      // Highlight selected cell
      if (sudokuGameState.selectedCell && 
          sudokuGameState.selectedCell.row === row && 
          sudokuGameState.selectedCell.col === col) {
        cell.classList.add('sudoku-cell-selected');
      }
      
      // Add thick borders for 3x3 boxes
      // Top border for cells at the top of each 3x3 section
      if (row % 3 === 0) {
        cell.style.borderTopWidth = '3px';
        cell.style.borderTopColor = '#2d3436';
      }
      
      // Bottom border for cells at the bottom of each 3x3 section
      if (row % 3 === 2 || row === 8) {
        cell.style.borderBottomWidth = '3px';
        cell.style.borderBottomColor = '#2d3436';
      }
      
      // Left border for cells at the left of each 3x3 section
      if (col % 3 === 0) {
        cell.style.borderLeftWidth = '3px';
        cell.style.borderLeftColor = '#2d3436';
      }
      
      // Right border for cells at the right of each 3x3 section
      if (col % 3 === 2 || col === 8) {
        cell.style.borderRightWidth = '3px';
        cell.style.borderRightColor = '#2d3436';
      }
      
      // Make outer border even thicker
      if (row === 0) {
        cell.style.borderTopWidth = '4px';
      }
      if (row === 8) {
        cell.style.borderBottomWidth = '4px';
      }
      if (col === 0) {
        cell.style.borderLeftWidth = '4px';
      }
      if (col === 8) {
        cell.style.borderRightWidth = '4px';
      }
      
      container.appendChild(cell);
    }
  }
}

function selectSudokuCell(row: number, col: number): void {
  if (sudokuGameState.isSolved) return;
  if (sudokuGameState.fixedCells[row][col]) return;
  sudokuGameState.selectedCell = { row, col };
  renderSudokuBoard();
}

function placeSudokuNumber(num: number): void {
  if (!sudokuGameState.selectedCell || sudokuGameState.isSolved) return;

  const row = sudokuGameState.selectedCell.row;
  const col = sudokuGameState.selectedCell.col;

  if (sudokuGameState.fixedCells[row][col]) return;
  
  // Clear cell if num is 0
  if (num === 0) {
    sudokuGameState.board[row][col] = 0;
  } else {
    sudokuGameState.board[row][col] = num;
  }
  
  renderSudokuBoard();

  if (checkSudokuWinCondition()) {
    sudokuGameState.isSolved = true;
    stopTimer();
    const successElement = document.getElementById('sudoku-success');
    const solvedMsgElement = document.getElementById('sudoku-solved-msg');
    if (successElement) {
      if (solvedMsgElement) {
        const elapsed = Math.floor((Date.now() - sudokuGameState.startTime) / 1000);
        solvedMsgElement.textContent = `You successfully completed the Sudoku puzzle in ${formatTime(elapsed)}.`;
      }
      successElement.classList.add('show');
    }
  }
}

function initializeSudokuGame(): void {
  sudokuGameState = {
    board: Array(9).fill(null).map(() => Array(9).fill(0)),
    solution: Array(9).fill(null).map(() => Array(9).fill(0)),
    fixedCells: Array(9).fill(null).map(() => Array(9).fill(false)) as boolean[][],
    selectedCell: null,
    isSolved: false,
    startTime: 0,
    timerInterval: null,
  };

  const completeBoard = generateCompleteBoard();
  sudokuGameState.solution = completeBoard.map(row => row.slice());

  // 50 cells removed → 31 clues (hard difficulty).
  // Uniqueness checking makes going much lower very slow.
  sudokuGameState.board = removeCells(completeBoard, 50);

  // Record which cells are pre-filled clues so user answers never become unselectable
  sudokuGameState.fixedCells = sudokuGameState.board.map(row => row.map(cell => cell !== 0));

  renderSudokuBoard();
  startTimer();
}

function checkSudokuSolution(): void {
  if (sudokuGameState.isSolved) return;

  const errorElement = document.getElementById('sudoku-error');
  if (!errorElement) return;

  let hasConflicts = false;
  let emptyCells = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = sudokuGameState.board[row][col];
      if (value === 0) {
        emptyCells++;
      } else if (isConflicting(sudokuGameState.board, row, col)) {
        hasConflicts = true;
      }
    }
  }

  const showError = (msg: string) => {
    errorElement.textContent = msg;
    errorElement.classList.add('show');
    setTimeout(() => errorElement.classList.remove('show'), 3000);
  };

  if (hasConflicts) {
    showError('There are conflicting numbers in the puzzle. Keep trying!');
  } else if (emptyCells > 0) {
    showError(`All filled numbers are valid! ${emptyCells} cells remaining.`);
  } else {
    sudokuGameState.isSolved = true;
    stopTimer();
    const successElement = document.getElementById('sudoku-success');
    const solvedMsgElement = document.getElementById('sudoku-solved-msg');
    if (successElement) {
      if (solvedMsgElement) {
        const elapsed = Math.floor((Date.now() - sudokuGameState.startTime) / 1000);
        solvedMsgElement.textContent = `You successfully completed the Sudoku puzzle in ${formatTime(elapsed)}.`;
      }
      successElement.classList.add('show');
    }
  }
}

function setupSudokuEventListeners(
  blockedDomain: string,
  redirectUrl: string,
  _autoRedirect: boolean, // Prefix with underscore to indicate it's not used
  overlay: HTMLElement
): void {
  // Cell click events
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('sudoku-cell')) {
      const row = parseInt(target.dataset.row || '0');
      const col = parseInt(target.dataset.col || '0');
      selectSudokuCell(row, col);
    }
  });
  
  // Number pad events
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('sudoku-number-btn')) {
      const number = parseInt(target.dataset.number || '0');
      placeSudokuNumber(number);
    }
  });
  
  // Check solution button
  const checkButton = document.getElementById('sudoku-check');
  if (checkButton) {
    checkButton.addEventListener('click', checkSudokuSolution);
  }
  
  // Proceed to site button
  const proceedButton = document.getElementById('proceed-to-site');
  if (proceedButton) {
    proceedButton.addEventListener('click', () => {
      if (overlay) {
        overlay.remove();
      }
      window.location.href = `http://${blockedDomain}`;
    });
  }
  
  // Choose alternative button
  const alternativeButton = document.getElementById('choose-alternative');
  if (alternativeButton) {
    alternativeButton.addEventListener('click', () => {
      if (overlay) {
        overlay.remove();
      }
      window.location.href = redirectUrl;
    });
  }
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (sudokuGameState.isSolved) return;

    const key = e.key;

    if (key >= '1' && key <= '9') {
      placeSudokuNumber(parseInt(key));
    }

    if (key === 'Backspace' || key === 'Delete' || key === '0') {
      placeSudokuNumber(0);
    }

    if (sudokuGameState.selectedCell) {
      let row = sudokuGameState.selectedCell.row;
      let col = sudokuGameState.selectedCell.col;

      switch (key) {
        case 'ArrowUp':    row = Math.max(0, row - 1); break;
        case 'ArrowDown':  row = Math.min(8, row + 1); break;
        case 'ArrowLeft':  col = Math.max(0, col - 1); break;
        case 'ArrowRight': col = Math.min(8, col + 1); break;
      }

      if (!sudokuGameState.fixedCells[row][col]) {
        selectSudokuCell(row, col);
      }
    }
  });
}

// Hard Block - No access allowed
function showHardBlockOverlay(
  blockedDomain: string,
  redirectUrl: string,
  autoRedirect: boolean = true,
  redirectDelay: number = 3,
) {
  console.log("Running hard block overlay", { autoRedirect, redirectDelay });
  removeExistingOverlay();

  const overlay = createBaseOverlay();
  overlay.innerHTML = `
    <div style="max-width: 600px; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - Hard Block</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        Access to ${blockedDomain} is permanently blocked.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        This site is incompatible with your self-respect goals. Access is not permitted under any circumstances.
        ${autoRedirect ? `You'll be redirected to a healthier alternative in ${redirectDelay} seconds.` : ""}
      </p>
      <div style="background: rgba(244, 67, 54, 0.2); padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 2px solid rgba(244, 67, 54, 0.5);">
        <p style="font-size: 1.3em; margin: 0; color: #f44336; text-align: center;">
          ⚠️ HARD BLOCK ACTIVATED ⚠️
        </p>
        <p style="margin: 15px 0 0 0; font-size: 1.1em; opacity: 0.9;">
          This is your highest level of protection. No bypass options are available.
        </p>
      </div>
      ${
        autoRedirect
          ? `
      <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          Redirecting to: <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>`
          : ""
      }
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          Go to Healthier Alternative
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>This hard block protects you from sites that conflict with your core values.</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Start auto-redirect timer if enabled
  let redirectTimer: number | null = null;
  if (autoRedirect) {
    redirectTimer = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, redirectDelay * 1000);

    // Update countdown display every second
    let timeLeft = redirectDelay;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  document.getElementById("redirect-now")?.addEventListener("click", () => {
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    window.location.href = redirectUrl;
  });
}

checkAndRedirect();

// Export for testing
export {
  checkAndRedirect,
  showSoftBlockOverlay,
  showPuzzleBlockOverlay,
  showHardBlockOverlay,
};
