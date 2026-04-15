// Puzzle generator for hard blocking level
// Creates difficult puzzles that users must solve to access blocked sites

export interface Puzzle {
  id: string;
  type: 'math' | 'logic' | 'pattern' | 'memory';
  question: string;
  answer: string;
  hint?: string;
  difficulty: number; // 1-10
  createdAt: number;
}

export interface PuzzleAttempt {
  puzzleId: string;
  attempts: number;
  solved: boolean;
  lastAttempt: number;
}

// Math puzzles - complex arithmetic problems
const MATH_PUZZLES = [
  {
    type: 'math' as const,
    question: "Solve for x: 3^(2x+1) = 81",
    answer: "1.5",
    hint: "Rewrite 81 as a power of 3",
    difficulty: 7,
  },
  {
    type: 'math' as const,
    question: "What is the sum of all prime numbers between 1 and 100?",
    answer: "1060",
    hint: "There are 25 prime numbers in that range",
    difficulty: 8,
  },
  {
    type: 'math' as const,
    question: "If log₂(x) + log₂(x-2) = 3, what is x?",
    answer: "4",
    hint: "Combine the logs using product rule",
    difficulty: 8,
  },
  {
    type: 'math' as const,
    question: "What is the 10th digit of π after the decimal point?",
    answer: "5",
    hint: "π = 3.1415926535...",
    difficulty: 6,
  },
  {
    type: 'math' as const,
    question: "Solve: ∫(0 to 1) of x² dx",
    answer: "1/3",
    hint: "Use the power rule for integration",
    difficulty: 7,
  },
];

// Logic puzzles - reasoning problems
const LOGIC_PUZZLES = [
  {
    type: 'logic' as const,
    question: "You have 12 identical balls. One is slightly heavier. Using a balance scale only 3 times, find the heavy ball.",
    answer: "Divide into 3 groups of 4, weigh 2 groups, then narrow down",
    hint: "First weigh 4 vs 4",
    difficulty: 9,
  },
  {
    type: 'logic' as const,
    question: "A man says: 'Brothers and sisters have I none, but that man's father is my father's son.' Who is he pointing at?",
    answer: "His son",
    hint: "Trace the family relationships",
    difficulty: 8,
  },
  {
    type: 'logic' as const,
    question: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
    answer: "5",
    hint: "Each machine makes 1 widget in 5 minutes",
    difficulty: 7,
  },
  {
    type: 'logic' as const,
    question: "What comes next: 1, 11, 21, 1211, 111221, ...?",
    answer: "312211",
    hint: "Look and say sequence",
    difficulty: 9,
  },
];

// Pattern recognition puzzles
const PATTERN_PUZZLES = [
  {
    type: 'pattern' as const,
    question: "Complete the sequence: 2, 3, 5, 7, 11, 13, 17, 19, ?",
    answer: "23",
    hint: "Prime numbers",
    difficulty: 6,
  },
  {
    type: 'pattern' as const,
    question: "What letter comes next: O, T, T, F, F, S, S, ?",
    answer: "E",
    hint: "First letters of numbers",
    difficulty: 8,
  },
  {
    type: 'pattern' as const,
    question: "Find the missing number: 1, 1, 2, 3, 5, 8, 13, 21, ?",
    answer: "34",
    hint: "Fibonacci sequence",
    difficulty: 6,
  },
];

// Memory puzzles
const MEMORY_PUZZLES = [
  {
    type: 'memory' as const,
    question: "Memorize this sequence for 10 seconds: 7 4 2 9 1 5 8 3 6. What was the 5th number?",
    answer: "1",
    hint: "Count from the beginning",
    difficulty: 7,
  },
  {
    type: 'memory' as const,
    question: "Remember these colors in order: Red, Blue, Green, Yellow, Purple. What was the 3rd color?",
    answer: "Green",
    hint: "ROYGBIV order might help",
    difficulty: 6,
  },
];

// All puzzles combined
const ALL_PUZZLES = [
  ...MATH_PUZZLES,
  ...LOGIC_PUZZLES,
  ...PATTERN_PUZZLES,
  ...MEMORY_PUZZLES,
];

// Generate a random puzzle
export function generatePuzzle(difficultyMin: number = 7): Puzzle {
  // Filter puzzles by difficulty
  const difficultPuzzles = ALL_PUZZLES.filter(p => p.difficulty >= difficultyMin);
  
  if (difficultPuzzles.length === 0) {
    // Fallback to any puzzle if none meet the difficulty
    const randomPuzzle = ALL_PUZZLES[Math.floor(Math.random() * ALL_PUZZLES.length)];
    return {
      id: generateId(),
      ...randomPuzzle,
      createdAt: Date.now(),
    };
  }
  
  const randomPuzzle = difficultPuzzles[Math.floor(Math.random() * difficultPuzzles.length)];
  return {
    id: generateId(),
    ...randomPuzzle,
    createdAt: Date.now(),
  };
}

// Validate puzzle answer (case-insensitive, allows some variation)
export function validateAnswer(puzzle: Puzzle, userAnswer: string): boolean {
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  const normalizedCorrectAnswer = puzzle.answer.toLowerCase().trim();
  
  // Exact match
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return true;
  }
  
  // For math answers, allow different formats
  if (puzzle.type === 'math') {
    // Allow 1/3 vs 0.333, etc.
    try {
      const userNum = eval(normalizedUserAnswer.replace(/[^0-9\.\/\-]/g, ''));
      const correctNum = eval(normalizedCorrectAnswer.replace(/[^0-9\.\/\-]/g, ''));
      
      if (Math.abs(userNum - correctNum) < 0.001) {
        return true;
      }
    } catch (e) {
      // If eval fails, fall through to false
    }
  }
  
  return false;
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get hint for puzzle (reveals gradually)
export function getHint(puzzle: Puzzle, attemptCount: number): string {
  if (!puzzle.hint) {
    return "No hint available for this puzzle.";
  }
  
  if (attemptCount >= 3) {
    return puzzle.hint;
  } else if (attemptCount >= 2) {
    return "Think carefully about the problem. " + (puzzle.hint.length > 50 ? puzzle.hint.substring(0, 50) + "..." : puzzle.hint);
  } else {
    return "Try again. You'll get a hint after 3 attempts.";
  }
}

// Calculate puzzle timeout based on difficulty
export function getPuzzleTimeout(puzzle: Puzzle): number {
  // Returns timeout in minutes
  return Math.max(5, puzzle.difficulty * 2);
}

// Export for testing
export default {
  generatePuzzle,
  validateAnswer,
  getHint,
  getPuzzleTimeout,
};