/* ========================================
   Question Session Store
   - Keeps per-session memory of questions/templates
   - Isolated from UI components
   ======================================== */

const createSession = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  usedKeysByGrade: new Map(),
  templateOrderByGrade: new Map(),
  templateCursorByGrade: new Map()
});

let activeSession = createSession();

const normalizeGradeKey = (grade) => String(grade ?? 'default');

const shuffleInPlace = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const resetQuestionSession = () => {
  // New session = new dedupe set + new template order
  activeSession = createSession();
};

export const buildQuestionKey = (question, answer) => `${question}|${String(answer)}`;

export const getUsedKeySet = (grade) => {
  const key = normalizeGradeKey(grade);
  if (!activeSession.usedKeysByGrade.has(key)) {
    activeSession.usedKeysByGrade.set(key, new Set());
  }
  return activeSession.usedKeysByGrade.get(key);
};

export const getTemplateOrder = (grade, templateCount) => {
  const key = normalizeGradeKey(grade);
  const existing = activeSession.templateOrderByGrade.get(key);
  if (existing && existing.length === templateCount) return existing;

  const order = shuffleInPlace(Array.from({ length: templateCount }, (_, i) => i));
  activeSession.templateOrderByGrade.set(key, order);
  activeSession.templateCursorByGrade.set(key, 0);
  return order;
};

export const nextTemplateIndex = (grade, templateCount) => {
  const key = normalizeGradeKey(grade);
  const order = getTemplateOrder(grade, templateCount);
  const cursor = activeSession.templateCursorByGrade.get(key) ?? 0;
  const index = order[cursor % order.length];
  activeSession.templateCursorByGrade.set(key, cursor + 1);
  return index;
};
