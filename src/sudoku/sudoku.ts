// Sudoku Game for Self-Respect Extension
// Simplified version for blocking overlay

// Game state interface
interface SudokuGameState {
    board: number[][];
    solution: number[][];
    selectedCell: { row: number; col: number } | null;
    isSolved: boolean;
    startTime: number;
    timerInterval: number | null;
}

// Initialize game state
let sudokuGameState: SudokuGameState = {
    board: Array(9).fill(null).map(() => Array(9).fill(0)),
    solution: Array(9).fill(null).map(() => Array(9).fill(0)),
    selectedCell: null,
    isSolved: false,
    startTime: 0,
    timerInterval: null
};

// Utility functions
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
    const puzzle = board.map(row => [...row]);
    const positions: [number, number][] = [];
    
    // Generate all positions
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            positions.push([i, j]);
        }
    }
    
    // Shuffle positions
    shuffleArray(positions);
    
    // Remove cells - for hard difficulty, remove 55-60 cells
    for (let i = 0; i < cellsToRemove; i++) {
        const [row, col] = positions[i];
        puzzle[row][col] = 0;
    }
    
    return puzzle;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer(timerElement: HTMLElement): void {
    if (!sudokuGameState.startTime) return;
    
    const elapsedSeconds = Math.floor((Date.now() - sudokuGameState.startTime) / 1000);
    timerElement.textContent = formatTime(elapsedSeconds);
}

function startTimer(timerElement: HTMLElement): void {
    if (sudokuGameState.timerInterval) {
        clearInterval(sudokuGameState.timerInterval);
    }
    
    sudokuGameState.startTime = Date.now();
    sudokuGameState.timerInterval = window.setInterval(() => updateTimer(timerElement), 1000);
}

function stopTimer(): void {
    if (sudokuGameState.timerInterval) {
        clearInterval(sudokuGameState.timerInterval);
        sudokuGameState.timerInterval = null;
    }
}

function checkWinCondition(): boolean {
    // Check if board is complete and correct
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudokuGameState.board[row][col] === 0 || 
                sudokuGameState.board[row][col] !== sudokuGameState.solution[row][col]) {
                return false;
            }
        }
    }
    
    return true;
}

function renderSudokuBoard(container: HTMLElement): void {
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
                
                // Check if this was a fixed cell (from original puzzle)
                const isFixed = sudokuGameState.solution[row][col] !== 0 && 
                               sudokuGameState.board[row][col] === sudokuGameState.solution[row][col] &&
                               sudokuGameState.board[row][col] !== 0;
                
                if (isFixed) {
                    cell.classList.add('sudoku-cell-fixed');
                } else {
                    cell.classList.add('sudoku-cell-user');
                    
                    // Check for errors
                    if (value !== sudokuGameState.solution[row][col]) {
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
            if (row % 3 === 0) cell.style.borderTopWidth = '2px';
            if (row === 8) cell.style.borderBottomWidth = '2px';
            if (col % 3 === 0) cell.style.borderLeftWidth = '2px';
            if (col === 8) cell.style.borderRightWidth = '2px';
            
            container.appendChild(cell);
        }
    }
}

function selectSudokuCell(row: number, col: number): void {
    if (sudokuGameState.isSolved) return;
    
    // Don't allow selection of fixed cells
    const isFixed = sudokuGameState.solution[row][col] !== 0 && 
                   sudokuGameState.board[row][col] === sudokuGameState.solution[row][col] &&
                   sudokuGameState.board[row][col] !== 0;
    
    if (isFixed) return;
    
    sudokuGameState.selectedCell = { row, col };
}

function placeSudokuNumber(num: number): void {
    if (!sudokuGameState.selectedCell || sudokuGameState.isSolved) return;
    
    const { row, col } = sudokuGameState.selectedCell;
    
    // Don't allow changing fixed cells
    const isFixed = sudokuGameState.solution[row][col] !== 0 && 
                   sudokuGameState.board[row][col] === sudokuGameState.solution[row][col] &&
                   sudokuGameState.board[row][col] !== 0;
    
    if (isFixed) return;
    
    // Clear cell if num is 0
    if (num === 0) {
        sudokuGameState.board[row][col] = 0;
    } else {
        sudokuGameState.board[row][col] = num;
    }
}

function newSudokuGame(difficulty: 'hard' | 'expert' = 'hard'): void {
    // Reset game state
    sudokuGameState.selectedCell = null;
    sudokuGameState.isSolved = false;
    
    // Generate new puzzle
    const completeBoard = generateCompleteBoard();
    sudokuGameState.solution = completeBoard.map(row => [...row]);
    
    // Remove cells based on difficulty
    const cellsToRemove = difficulty === 'hard' ? 55 : 60; // Hard: 26 clues, Expert: 21 clues
    sudokuGameState.board = removeCells(completeBoard, cellsToRemove);
}

// Export functions for use in content.ts
export {
    sudokuGameState,
    newSudokuGame,
    renderSudokuBoard,
    selectSudokuCell,
    placeSudokuNumber,
    checkWinCondition,
    startTimer,
    stopTimer,
    formatTime
};