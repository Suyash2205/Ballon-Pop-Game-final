/* ========================================
   Math Question Generator
   ======================================== */

import { generateQuestionByGrade } from './difficultyConfig';
import { buildQuestionKey, getUsedKeySet, resetQuestionSession } from './questionSessionStore';

// Get random integer between min and max (inclusive)
export const randInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Shuffle array
export const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Round to same decimal places as a reference number
const roundToSamePrecision = (value, reference) => {
  if (Number.isInteger(reference)) return Math.round(value);
  const decimals = (reference.toString().split('.')[1] || '').length;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Generate distractors (wrong answers close to correct) - supports integers, decimals, negatives
const generateDistractors = (correct, count = 3) => {
  const isDecimal = !Number.isInteger(correct);
  const allowNegative = correct < 0 || correct < 10;
  const round = (v) => roundToSamePrecision(v, correct);

  const distractors = new Set();
  const strategies = [
    () => round(correct + 1),
    () => round(correct - 1),
    () => round(correct + 2),
    () => round(correct - 2),
    () => round(correct + 10),
    () => round(correct - 10),
    () => round(correct * 2),
    () => round(correct / 2),
    () => round(correct + randInt(-5, 5)),
    () => round(correct + randInt(1, 3)),
    () => round(correct - randInt(1, 3)),
    ...(isDecimal ? [
      () => round(correct + 0.5),
      () => round(correct - 0.5),
      () => round(correct + 1.5),
      () => round(correct - 1.5)
    ] : []),
    () => {
      const str = Math.abs(Math.round(correct)).toString();
      if (str.length >= 2) {
        const swapped = str[1] + str[0] + str.slice(2);
        const val = parseInt(swapped) * (correct < 0 ? -1 : 1);
        return round(val);
      }
      return round(correct + randInt(1, 5));
    }
  ];

  let attempts = 0;
  while (distractors.size < count && attempts < 80) {
    const strategy = strategies[randInt(0, strategies.length - 1)];
    const distractor = strategy();

    const valid = distractor !== correct &&
      Number.isFinite(distractor) &&
      !distractors.has(distractor) &&
      (allowNegative || distractor > 0);

    if (valid) {
      distractors.add(distractor);
    }
    attempts++;
  }

  while (distractors.size < count) {
    const d = round(correct + randInt(-15, 15));
    if (d !== correct && Number.isFinite(d) && (allowNegative || d > 0) && !distractors.has(d)) {
      distractors.add(d);
    }
  }

  return Array.from(distractors);
};

// Question type generators
const generators = {
  // Addition (2-3 digit numbers)
  addition(difficulty) {
    let a, b;
    if (difficulty <= 2) {
      a = randInt(10, 50);
      b = randInt(10, 50);
    } else if (difficulty <= 4) {
      a = randInt(20, 100);
      b = randInt(10, 50);
    } else {
      a = randInt(50, 200);
      b = randInt(20, 100);
    }
    return {
      question: `${a} + ${b} = ?`,
      answer: a + b
    };
  },

  // Subtraction (2-3 digit numbers)
  subtraction(difficulty) {
    let a, b;
    if (difficulty <= 2) {
      a = randInt(20, 50);
      b = randInt(5, 20);
    } else if (difficulty <= 4) {
      a = randInt(50, 150);
      b = randInt(10, 50);
    } else {
      a = randInt(100, 300);
      b = randInt(20, 100);
    }
    if (b > a) [a, b] = [b, a];
    return {
      question: `${a} - ${b} = ?`,
      answer: a - b
    };
  },

  // Multiplication (single × single/double digit)
  multiplication(difficulty) {
    let a, b;
    if (difficulty <= 2) {
      a = randInt(2, 9);
      b = randInt(2, 9);
    } else if (difficulty <= 4) {
      a = randInt(3, 9);
      b = randInt(6, 12);
    } else {
      a = randInt(6, 12);
      b = randInt(7, 15);
    }
    return {
      question: `${a} × ${b} = ?`,
      answer: a * b
    };
  },

  // Division (whole number answers only)
  division(difficulty) {
    let divisor, quotient;
    if (difficulty <= 2) {
      divisor = randInt(2, 6);
      quotient = randInt(2, 10);
    } else if (difficulty <= 4) {
      divisor = randInt(3, 9);
      quotient = randInt(5, 12);
    } else {
      divisor = randInt(4, 12);
      quotient = randInt(6, 15);
    }
    const dividend = divisor * quotient;
    return {
      question: `${dividend} ÷ ${divisor} = ?`,
      answer: quotient
    };
  },

  // Order of operations
  orderOfOps(difficulty) {
    const a = randInt(2, 8);
    const b = randInt(2, 6);
    const c = randInt(1, 10);
    const mult = randInt(2, 4);

    const templates = [
      { q: `${a} × ${b} + ${c} = ?`, a: a * b + c },
      { q: `${a} + ${b} × ${c} = ?`, a: a + b * c },
      { q: `(${a} + ${b}) × ${mult} = ?`, a: (a + b) * mult }
    ];

    const selected = templates[randInt(0, difficulty <= 3 ? 1 : templates.length - 1)];
    return {
      question: selected.q,
      answer: selected.a
    };
  },

  // Doubling
  doubling(difficulty) {
    let n;
    if (difficulty <= 2) {
      n = randInt(5, 25);
    } else if (difficulty <= 4) {
      n = randInt(15, 50);
    } else {
      n = randInt(25, 100);
    }
    return {
      question: `Double ${n} = ?`,
      answer: n * 2
    };
  },

  // Halving
  halving(difficulty) {
    let n;
    if (difficulty <= 2) {
      n = randInt(4, 20) * 2;
    } else if (difficulty <= 4) {
      n = randInt(10, 50) * 2;
    } else {
      n = randInt(25, 100) * 2;
    }
    return {
      question: `Half of ${n} = ?`,
      answer: n / 2
    };
  },

  // Multiply/divide by 10 or 100
  byTenHundred(difficulty) {
    const ops = difficulty <= 3 ? [10] : [10, 100];
    const op = ops[randInt(0, ops.length - 1)];
    const isMultiply = Math.random() > 0.5;

    let n;
    if (isMultiply) {
      n = op === 10 ? randInt(3, 50) : randInt(2, 20);
      return {
        question: `${n} × ${op} = ?`,
        answer: n * op
      };
    } else {
      const base = op === 10 ? randInt(10, 500) : randInt(100, 2000);
      n = Math.round(base / op) * op;
      return {
        question: `${n} ÷ ${op} = ?`,
        answer: n / op
      };
    }
  },

  // Simple percentages (10%, 20%, 25%, 50%)
  percentage(difficulty) {
    const percents = [10, 20, 25, 50];
    const percent = percents[randInt(0, percents.length - 1)];

    let base;
    if (percent === 10) {
      base = randInt(2, 20) * 10;
    } else if (percent === 20) {
      base = randInt(2, 10) * 5;
    } else if (percent === 25) {
      base = randInt(2, 10) * 4;
    } else {
      base = randInt(4, 40) * 2;
    }

    return {
      question: `${percent}% of ${base} = ?`,
      answer: (percent / 100) * base
    };
  },

  // Small squares (up to 15²)
  squares(difficulty) {
    let n;
    if (difficulty <= 2) {
      n = randInt(2, 8);
    } else if (difficulty <= 4) {
      n = randInt(5, 12);
    } else {
      n = randInt(8, 15);
    }
    return {
      question: `${n}² = ?`,
      answer: n * n
    };
  }
};

// Generate a question based on difficulty
export const generateQuestion = (difficulty) => {
  // Weight certain types based on difficulty
  let weights;
  if (difficulty <= 2) {
    weights = {
      addition: 3,
      subtraction: 3,
      multiplication: 2,
      division: 1,
      doubling: 2,
      halving: 2,
      byTenHundred: 1,
      squares: 1,
      percentage: 0,
      orderOfOps: 0
    };
  } else if (difficulty <= 4) {
    weights = {
      addition: 2,
      subtraction: 2,
      multiplication: 3,
      division: 2,
      doubling: 1,
      halving: 1,
      byTenHundred: 2,
      squares: 2,
      percentage: 1,
      orderOfOps: 1
    };
  } else {
    weights = {
      addition: 1,
      subtraction: 1,
      multiplication: 2,
      division: 2,
      doubling: 1,
      halving: 1,
      byTenHundred: 2,
      squares: 2,
      percentage: 2,
      orderOfOps: 2
    };
  }

  // Build weighted array
  const weightedTypes = [];
  for (const [type, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) {
      weightedTypes.push(type);
    }
  }

  // Select random type
  const selectedType = weightedTypes[randInt(0, weightedTypes.length - 1)];
  const result = generators[selectedType](difficulty);

  // Generate answers (1 correct + 3 distractors)
  const distractors = generateDistractors(result.answer);
  const answers = shuffle([result.answer, ...distractors]);

  return {
    question: result.question,
    correctAnswer: result.answer,
    answers: answers
  };
};

// Generate a question based on selected grade (Brain Racers grade selection)
export const generateQuestionForGrade = (grade) => {
  const usedKeys = getUsedKeySet(grade);
  const maxAttempts = 12;
  let result = null;

  // Retry a few times to prevent repeats within this play session.
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateQuestionByGrade(grade);
    const key = buildQuestionKey(candidate.question, candidate.answer);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      result = candidate;
      break;
    }
    // If we keep colliding, allow the last one to avoid infinite loops.
    if (attempt === maxAttempts - 1) {
      usedKeys.add(key);
      result = candidate;
    }
  }

  const distractors = generateDistractors(result.answer);
  const answers = shuffle([result.answer, ...distractors]);
  return {
    question: result.question,
    correctAnswer: result.answer,
    answers: answers
  };
};

// Expose for UI to start a fresh "play session" without storing state in components.
export { resetQuestionSession };
