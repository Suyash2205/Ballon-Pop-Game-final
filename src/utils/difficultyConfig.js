/* ========================================
   Advanced Grade-Based Difficulty
   Brain Racers - Complexity scaling by grade
   ======================================== */

import { randInt } from './mathGenerator';

// ---- Difficulty config per grade ----
export function getDifficultyConfig(grade) {
  switch (grade) {
    case 3:
      return { max: 100, ops: 1, allowNegative: false, allowDecimal: false, allowExponent: false, allowFractions: false };
    case 4:
      return { max: 500, ops: 2, allowNegative: false, allowDecimal: false, allowExponent: false, allowFractions: false };
    case 5:
      return { max: 1000, ops: 3, allowNegative: false, allowDecimal: false, allowExponent: false, allowFractions: false };
    case 6:
      return { max: 1000, ops: 3, allowNegative: true, allowDecimal: true, allowExponent: false, allowFractions: false };
    case 7:
      return { max: 5000, ops: 4, allowNegative: true, allowDecimal: true, allowExponent: true, allowFractions: true };
    default:
      return { max: 100, ops: 1, allowNegative: false, allowDecimal: false, allowExponent: false, allowFractions: false };
  }
}

// ---- Safe PEMDAS expression evaluator ----
const OP_ADD = '+';
const OP_SUB = '-';
const OP_MUL = '*';
const OP_DIV = '/';
const OP_POW = '^';

function tokenize(expr) {
  const s = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '(' || s[i] === ')') {
      tokens.push({ type: s[i] === '(' ? 'LPAREN' : 'RPAREN', raw: s[i] });
      i++;
      continue;
    }
    if ('+-*/^'.includes(s[i])) {
      tokens.push({ type: 'OP', value: s[i] });
      i++;
      continue;
    }
    // Fraction a/b (only when it looks like one number)
    const frac = /^\d+\/\d+/.exec(s.slice(i));
    if (frac) {
      const [num, den] = frac[0].split('/').map(Number);
      tokens.push({ type: 'NUMBER', value: num / den, raw: frac[0] });
      i += frac[0].length;
      continue;
    }
    // Number: integer or decimal
    const num = /^-?\d+(\.\d+)?/.exec(s.slice(i));
    if (num) {
      tokens.push({ type: 'NUMBER', value: parseFloat(num[0]), raw: num[0] });
      i += num[0].length;
      continue;
    }
    // Positive number after operator
    const numPos = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (numPos) {
      tokens.push({ type: 'NUMBER', value: parseFloat(numPos[0]), raw: numPos[0] });
      i += numPos[0].length;
      continue;
    }
    i++;
  }
  return tokens;
}

function parsePrimary(tokens, idx) {
  if (idx >= tokens.length) return { value: 0, next: idx };
  const t = tokens[idx];
  if (t.type === 'NUMBER') return { value: t.value, next: idx + 1 };
  if (t.type === 'LPAREN') {
    const inner = parseExpr(tokens, idx + 1);
    if (tokens[inner.next]?.type === 'RPAREN') return { value: inner.value, next: inner.next + 1 };
    return { value: inner.value, next: inner.next };
  }
  if (t.type === 'OP' && (t.value === '-' || t.value === '+')) {
    const unary = t.value === '-' ? -1 : 1;
    const next = parsePrimary(tokens, idx + 1);
    return { value: unary * next.value, next: next.next };
  }
  return { value: 0, next: idx + 1 };
}

function parsePow(tokens, idx) {
  let left = parsePrimary(tokens, idx);
  idx = left.next;
  while (idx < tokens.length && tokens[idx]?.type === 'OP' && tokens[idx].value === OP_POW) {
    const right = parsePrimary(tokens, idx + 1);
    left = { value: Math.pow(left.value, right.value), next: right.next };
    idx = left.next;
  }
  return left;
}

function parseTerm(tokens, idx) {
  let left = parsePow(tokens, idx);
  idx = left.next;
  while (idx < tokens.length && tokens[idx]?.type === 'OP' && (tokens[idx].value === OP_MUL || tokens[idx].value === OP_DIV)) {
    const op = tokens[idx].value;
    const right = parsePow(tokens, idx + 1);
    left = {
      value: op === OP_MUL ? left.value * right.value : left.value / right.value,
      next: right.next
    };
    idx = left.next;
  }
  return left;
}

function parseExpr(tokens, idx) {
  let left = parseTerm(tokens, idx);
  idx = left.next;
  while (idx < tokens.length && tokens[idx]?.type === 'OP' && (tokens[idx].value === OP_ADD || tokens[idx].value === OP_SUB)) {
    const op = tokens[idx].value;
    const right = parseTerm(tokens, idx + 1);
    left = {
      value: op === OP_ADD ? left.value + right.value : left.value - right.value,
      next: right.next
    };
    idx = left.next;
  }
  return left;
}

function evaluateExpression(expr) {
  const tokens = tokenize(expr);
  if (tokens.length === 0) return 0;
  const result = parseExpr(tokens, 0);
  return result.value;
}

// ---- Random value generators ----
function randInRange(config, allowZero = false) {
  const max = config.max;
  if (config.allowNegative) {
    const min = -max;
    return randInt(min, max);
  }
  return randInt(allowZero ? 0 : 1, max);
}

function randDecimal(config) {
  const max = Math.min(config.max, 100);
  const a = randInt(1, max);
  const b = randInt(1, 9);
  return Math.round((a + b / 10) * 10) / 10;
}

function randomFraction() {
  const num = randInt(1, 9);
  const den = randInt(2, 10);
  const g = (a, b) => (b ? g(b, a % b) : a);
  const gcd = g(num, den);
  return { num: num / gcd, den: den / gcd, str: `${num / gcd}/${den / gcd}`, value: (num / gcd) / (den / gcd) };
}

function randomExponentNumber(maxBase = 12, maxExp = 3) {
  const base = randInt(2, maxBase);
  const exp = randInt(2, maxExp);
  const value = Math.pow(base, exp);
  const display = exp === 2 ? `${base}²` : exp === 3 ? `${base}³` : `${base}^${exp}`;
  return { str: display, value };
}

// ---- Build expression from config ----
function pickOperator(config, canUseDiv = true) {
  const ops = ['+', '-', '*'];
  if (canUseDiv) ops.push('/');
  return ops[randInt(0, ops.length - 1)];
}

function formatNumber(n, config) {
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

function buildOperand(config, preferInteger = true) {
  if (config.allowFractions && randInt(1, 3) === 1) {
    const f = randomFraction();
    return { str: f.str, value: f.value };
  }
  if (config.allowExponent && randInt(1, 3) === 1) {
    const e = randomExponentNumber(12, 3);
    return { str: e.str, value: e.value };
  }
  if (config.allowDecimal && !preferInteger && randInt(1, 2) === 1) {
    const d = randDecimal(config);
    return { str: String(d), value: d };
  }
  if (config.allowNegative && randInt(1, 3) === 1) {
    const n = randInRange(config);
    return { str: n < 0 ? `(${n})` : String(n), value: n };
  }
  const n = randInRange(config);
  return { str: String(n), value: n };
}

// Build a single-step or multi-step expression; return { question, answer }.
function buildMathExpression(config) {
  const grade = config.grade ?? 3;
  const ops = Math.max(1, Math.min(4, config.ops));

  // Grade 3: single operation only
  if (grade === 3) {
    const type = randInt(1, 3);
    const a = randInt(1, 50);
    const b = randInt(1, 50);
    if (type === 1) return { question: `${a} + ${b} = ?`, answer: a + b };
    if (type === 2) {
      const x = randInt(20, 100);
      const y = randInt(1, Math.min(x, 50));
      return { question: `${x} − ${y} = ?`, answer: x - y };
    }
    const m = randInt(2, 9);
    const n = randInt(2, 9);
    return { question: `${m} × ${n} = ?`, answer: m * n };
  }

  // Grade 4: 2 operations, optionally parentheses
  if (grade === 4) {
    const templates = [
      () => {
        const a = randInt(20, 120);
        const b = randInt(2, 12);
        const c = randInt(5, 50);
        return { q: `${a} + ${b} × ${c} = ?`, a: a + b * c };
      },
      () => {
        const a = randInt(30, 200);
        const b = randInt(2, 10);
        const c = randInt(5, 40);
        return { q: `(${a} ÷ ${b}) + ${c} = ?`, a: Math.floor(a / b) + c };
      },
      () => {
        const a = randInt(50, 200);
        const b = randInt(20, 80);
        const c = randInt(10, 50);
        return { q: `${a} − ${b} + ${c} = ?`, a: a - b + c };
      }
    ];
    const t = templates[randInt(0, templates.length - 1)]();
    return { question: t.q, answer: t.a };
  }

  // Grade 5: 2–3 operations, larger numbers
  if (grade === 5) {
    const templates = [
      () => {
        const a = randInt(50, 300);
        const b = randInt(2, 8);
        const c = randInt(50, 200);
        return { q: `${a} × ${b} − ${c} = ?`, a: a * b - c };
      },
      () => {
        const a = randInt(100, 400);
        const b = randInt(3, 12);
        const c = randInt(2, 8);
        const d = randInt(10, 80);
        return { q: `(${a} ÷ ${b}) + ${c} × ${d} = ?`, a: Math.floor(a / b) + c * d };
      },
      () => {
        const a = randInt(100, 400);
        const b = randInt(20, 100);
        const c = randInt(10, 60);
        const d = randInt(20, 80);
        return { q: `${a} − ${b} × ${c} + ${d} = ?`, a: a - b * c + d };
      }
    ];
    const t = templates[randInt(0, templates.length - 1)]();
    const ans = typeof t.a === 'number' ? t.a : evaluateExpression(t.q.replace(' = ?', ''));
    return { question: t.q, answer: ans };
  }

  // Grade 6: negatives, decimals, 3 operations
  if (grade === 6) {
    const templates = [
      () => {
        const a = randInt(-30, 30);
        const b = randInt(2, 10);
        const c = randInt(2, 8);
        const expr = `${a} + ${b} × ${c}`;
        return { q: expr + ' = ?', a: evaluateExpression(expr) };
      },
      () => {
        const a = randDecimal(config);
        const b = randDecimal(config);
        const c = randInt(2, 5);
        const expr = `${a} + ${b} × ${c}`;
        const val = evaluateExpression(expr);
        return { q: expr + ' = ?', a: Math.round(val * 10) / 10 };
      },
      () => {
        const a = randInt(-20, 20);
        const b = randInt(2, 8);
        const c = randDecimal(config);
        const expr = `(${a} ÷ ${b}) + ${c}`;
        const val = Math.floor(a / b) + c;
        return { q: expr + ' = ?', a: Math.round(val * 10) / 10 };
      }
    ];
    const t = templates[randInt(0, templates.length - 1)]();
    return { question: t.q, answer: t.a };
  }

  // Grade 7: exponents, fractions, PEMDAS, 3–4 operations
  if (grade === 7) {
    const templates = [
      () => {
        const b1 = randInt(2, 10);
        const b2 = randInt(2, 8);
        const e1 = randInt(2, 3);
        const e2 = randInt(2, 3);
        const v1 = Math.pow(b1, e1);
        const v2 = Math.pow(b2, e2);
        const s1 = e1 === 2 ? `${b1}²` : `${b1}^${e1}`;
        const s2 = e2 === 2 ? `${b2}²` : `${b2}^${e2}`;
        const op = randInt(1, 2) === 1 ? '+' : '-';
        const c = randInt(2, 20);
        const expr = `${s1} ${op} ${s2} × ${c}`;
        const val = op === '+' ? v1 + v2 * c : v1 - v2 * c;
        return { q: expr + ' = ?', a: val };
      },
      () => {
        const f1 = randomFraction();
        const f2 = randomFraction();
        const mult = randInt(6, 24);
        const val = (f1.value + f2.value) * mult;
        const q = `(${f1.str} + ${f2.str}) × ${mult} = ?`;
        return { q, a: Math.round(val * 100) / 100 };
      },
      () => {
        const base = randInt(3, 8);
        const exp = 2;
        const sub = randInt(1, base * base - 2);
        const den = randInt(2, 6);
        const add = randInt(1, 15);
        const expr = `${add} ÷ (${base}² − ${sub}) + ${den}`;
        const val = add / (Math.pow(base, exp) - sub) + den;
        const display = `${add} ÷ (${base}² − ${sub}) + ${den} = ?`;
        return { q: display, a: Math.round(val * 100) / 100 };
      },
      () => {
        const b1 = randInt(2, 8);
        const b2 = randInt(2, 6);
        const s1 = `${b1}²`;
        const s2 = `${b2}²`;
        const v1 = b1 * b1;
        const v2 = b2 * b2;
        const div = randInt(2, 6);
        const add = randInt(1, 20);
        const inner = randInt(4, 16);
        const val = (v1 - v2) * (inner / div) + add;
        return { q: `(${s1} − ${s2}) × (${inner} ÷ ${div}) + ${add} = ?`, a: Math.round(val) };
      }
    ];
    const t = templates[randInt(0, templates.length - 1)]();
    return { question: t.q, answer: t.a };
  }

  // Fallback: single op
  const a = randInt(1, 50);
  const b = randInt(1, 50);
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

// ---- Public API ----
export function generateQuestion(grade) {
  const config = { ...getDifficultyConfig(grade), grade };
  return buildMathExpression(config);
}

export function generateQuestionByGrade(grade) {
  return generateQuestion(grade);
}
