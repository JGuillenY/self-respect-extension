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
    ? chrome.i18n.getMessage("redirectDelayMessage", [redirectDelay])
    : chrome.i18n.getMessage("noRedirectDelayMessage");

  const redirectInfo = autoRedirect
    ? `<div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          ${chrome.i18n.getMessage("redirectingTo")} <br>
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
        ${chrome.i18n.getMessage("youWereAboutToVisit")} <strong>${blockedDomain}</strong>.
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        ${countdownMessage}
      </p>
      ${redirectInfo}
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          ${autoRedirect ? chrome.i18n.getMessage("redirectNow") : chrome.i18n.getMessage("healthierAlternative")}
        </button>
        <button id="cancel-redirect" class="overlay-button secondary">
          ${chrome.i18n.getMessage("cancelMessage")}
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>${chrome.i18n.getMessage("phrase1")}</p>
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
        <h1>${chrome.i18n.getMessage("puzzleBlockTitle")}</h1>
        <p>
          ${chrome.i18n.getMessage("youWereAboutToVisit")} <strong>${blockedDomain}</strong>.
          ${chrome.i18n.getMessage("puzzleBlockDescription")}
        </p>
      </div>

      <div class="sudoku-game-area">
        <div class="sudoku-stats">
          <div class="sudoku-stat">
            <div class="sudoku-stat-label">${chrome.i18n.getMessage("sudokuTimeLabel")}</div>
            <div class="sudoku-stat-value" id="sudoku-timer">00:00</div>
          </div>
          <div class="sudoku-stat">
            <div class="sudoku-stat-label">${chrome.i18n.getMessage("sudokuDifficultyLabel")}</div>
            <div class="sudoku-stat-value">${chrome.i18n.getMessage("blockingLevelHard")}</div>
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
              <button class="sudoku-number-btn sudoku-number-btn-clear" data-number="0">${chrome.i18n.getMessage("sudokuClearBtn")}</button>
            </div>

            <div class="sudoku-action-buttons">
              <button id="sudoku-check" class="sudoku-action-btn sudoku-action-btn-secondary">
                ${chrome.i18n.getMessage("sudokuCheckSolution")}
              </button>
            </div>
          </div>
        </div>

        <div class="sudoku-instructions">
          <h3>${chrome.i18n.getMessage("sudokuHowToTitle")}</h3>
          <ul>
            <li>${chrome.i18n.getMessage("sudokuRule1")}</li>
            <li>${chrome.i18n.getMessage("sudokuRule2")}</li>
            <li>${chrome.i18n.getMessage("sudokuRule3")}</li>
            <li>${chrome.i18n.getMessage("sudokuRule4")}</li>
          </ul>
        </div>

        <div class="sudoku-success" id="sudoku-success">
          <h3>${chrome.i18n.getMessage("sudokuSolvedTitle")}</h3>
          <p id="sudoku-solved-msg"></p>
          <div class="sudoku-action-buttons">
            <button id="proceed-to-site" class="sudoku-action-btn sudoku-action-btn-primary">
              ${chrome.i18n.getMessage("buttonProceedToSite", [blockedDomain])}
            </button>
            <button id="choose-alternative" class="sudoku-action-btn sudoku-action-btn-secondary">
              ${autoRedirect ? chrome.i18n.getMessage("buttonChooseAlternative") : chrome.i18n.getMessage("healthierAlternative")}
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

function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateCompleteBoard(): number[][] {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill diagonal 3x3 boxes (they are independent)
  for (let box = 0; box < 3; box++) {
    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const row = box * 3 + i;
        const col = box * 3 + j;
        board[row][col] = numbers[i * 3 + j];
      }
    }
  }
  
  // Solve the rest
  solveSudoku(board);
  return board;
}

function removeCells(board: number[][], cellsToRemove: number): number[][] {
  const puzzle = board.map(row => row.slice());
  
  // First, ensure each 3x3 box has at least 2 clues
  const boxClues: number[][] = Array(3).fill(null).map(() => Array(3).fill(0));
  
  // Count initial clues in each box
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (puzzle[i][j] !== 0) {
        const boxRow = Math.floor(i / 3);
        const boxCol = Math.floor(j / 3);
        boxClues[boxRow][boxCol]++;
      }
    }
  }
  
  // Generate all positions
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  
  // Shuffle positions
  shuffleArray(positions);
  
  let removed = 0;
  let attempts = 0;
  const maxAttempts = positions.length * 2;
  
  // Remove cells with constraints
  while (removed < cellsToRemove && attempts < maxAttempts) {
    for (let idx = 0; idx < positions.length && removed < cellsToRemove; idx++) {
      const position = positions[idx];
      const row = position[0];
      const col = position[1];
      
      // Skip if already empty
      if (puzzle[row][col] === 0) continue;
      
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);
      
      // Check if removing this cell would leave the box with less than 2 clues
      if (boxClues[boxRow][boxCol] <= 2) {
        attempts++;
        continue;
      }
      
      // Temporarily remove to check uniqueness
      puzzle[row][col] = 0;
      
      // Check if puzzle still has unique solution (simplified check)
      // For hard Sudoku, we want it to remain solvable
      // Note: We're using a simplified approach that ensures each box has enough clues
      
      // Count remaining clues in the box
      boxClues[boxRow][boxCol]--;
      
      // Accept removal
      removed++;
      attempts = 0; // Reset attempts counter on successful removal
    }
    
    // If we didn't remove enough, reshuffle and try again
    if (removed < cellsToRemove) {
      shuffleArray(positions);
      attempts++;
    }
  }
  
  // Final check: ensure no box is empty
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      let cluesInBox = 0;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          if (puzzle[row][col] !== 0) cluesInBox++;
        }
      }
      
      // If a box has less than 2 clues, add some back
      if (cluesInBox < 2) {
        // Find positions in this box that were removed
        const boxPositions: [number, number][] = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            if (puzzle[row][col] === 0) {
              boxPositions.push([row, col]);
            }
          }
        }
        
        // Add back clues to reach minimum
        const cluesToAdd = 2 - cluesInBox;
        shuffleArray(boxPositions);
        for (let i = 0; i < Math.min(cluesToAdd, boxPositions.length); i++) {
          const position = boxPositions[i];
          const r = position[0];
          const c = position[1];
          puzzle[r][c] = board[r][c]; // Restore original value
        }
      }
    }
  }
  
  return puzzle;
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
        solvedMsgElement.textContent = chrome.i18n.getMessage("sudokuSolvedMessage", [formatTime(elapsed)]);
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

  const cellsToRemove = 55;
  sudokuGameState.board = removeCells(completeBoard, cellsToRemove);

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
        solvedMsgElement.textContent = chrome.i18n.getMessage("sudokuSolvedMessage", [formatTime(elapsed)]);
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
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">Self Respect ✊ - ${chrome.i18n.getMessage("hardBlockTitle")}</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; line-height: 1.6;">
        ${chrome.i18n.getMessage("hardBlockMessage", [blockedDomain])}
      </p>
      <p style="font-size: 1.1em; margin-bottom: 40px; line-height: 1.6;">
        ${chrome.i18n.getMessage("hardBlockDescription")}
        ${autoRedirect ? chrome.i18n.getMessage("redirectDelayMessage", [redirectDelay]) : ""}
      </p>
      <div style="background: rgba(244, 67, 54, 0.2); padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 2px solid rgba(244, 67, 54, 0.5);">
        <p style="font-size: 1.3em; margin: 0; color: #f44336; text-align: center;">
          ⚠️ ${chrome.i18n.getMessage("hardBlockWarning")} ⚠️
        </p>
        <p style="margin: 15px 0 0 0; font-size: 1.1em; opacity: 0.9;">
          ${chrome.i18n.getMessage("hardBlockWarningDesc")}
        </p>
      </div>
      ${
        autoRedirect
          ? `
      <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 1em;">
          ${chrome.i18n.getMessage("redirectingTo")} <br>
          <a href="${redirectUrl}" style="color: #a3e4d7; text-decoration: underline; word-break: break-all;">
            ${redirectUrl}
          </a>
        </p>
      </div>`
          : ""
      }
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="redirect-now" class="overlay-button primary">
          ${chrome.i18n.getMessage("healthierAlternative")}
        </button>
      </div>
      <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
        <p>${chrome.i18n.getMessage("hardBlockFooter")}</p>
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
