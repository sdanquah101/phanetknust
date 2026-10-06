/**
 * Parse quiz questions for many lessons at once.
 * One question per line/row, columns in this order:
 *   lesson number, question, option A, option B, [option C … H], correct answer, [explanation]
 * The correct answer is a letter (A–H) or the option number (1–8). Rows can be CSV (from Excel / Google Sheets)
 * or separated by "|". With a header row (Lesson, Question, Option A…, Answer, Explanation) columns are matched by name
 * and any other columns are ignored; without one, the order above is used. Blank rows are skipped.
 */
export type ImportedQuestion = { lesson: number; prompt: string; options: string[]; correct_index: number; explanation: string | null; line: number };
export type ImportResult = { questions: ImportedQuestion[]; errors: string[] };

const LETTERS = "ABCDEFGH";

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", i = 0, quoted = false;
  const s = text.replace(/^﻿/, "");
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { quoted = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === "," || c === "\t") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function answerIndex(v: string, optionCount: number): number | null {
  const t = v.trim().replace(/[.)]$/, "").toUpperCase();
  if (/^[A-H]$/.test(t)) { const i = LETTERS.indexOf(t); return i < optionCount ? i : null; }
  if (/^[1-8]$/.test(t)) { const i = Number(t) - 1; return i < optionCount ? i : null; }
  return null;
}
const looksLikeAnswer = (v: string) => /^\s*([A-Ha-h]|[1-8])[.)]?\s*$/.test(v);

export function parseQuestions(text: string): ImportResult {
  const raw = text.trim();
  if (!raw) return { questions: [], errors: ["Nothing to import."] };
  const firstLine = raw.split(/\r?\n/)[0];
  const rows = firstLine.includes("|")
    ? raw.split(/\r?\n/).map((l) => l.split("|"))
    : parseCsv(raw);

  const questions: ImportedQuestion[] = [];
  const errors: string[] = [];

  // A header row (e.g. from our template/export) maps columns by name; extra columns are ignored.
  const head = rows[0]?.map((c) => c.trim().toLowerCase()) ?? [];
  const hasHeader = head.length > 0 && !/^\d+$/.test(head[0] ?? "") && head.some((h) => /^(answer|correct)/.test(h));
  const col = hasHeader ? {
    lesson: head.findIndex((h) => h.startsWith("lesson") && !h.includes("title")),
    question: head.findIndex((h) => h.startsWith("question")),
    options: head.map((h, i) => (/^option\b|^choice\b/.test(h) ? i : -1)).filter((i) => i >= 0),
    answer: head.findIndex((h) => /^(answer|correct)/.test(h)),
    explanation: head.findIndex((h) => /^(explanation|why|reason)/.test(h)),
  } : null;
  if (col && (col.lesson < 0 || col.question < 0 || col.options.length < 2 || col.answer < 0)) {
    return { questions: [], errors: ["The header row needs columns named Lesson, Question, Option A, Option B (…) and Answer."] };
  }

  rows.forEach((cells, idx) => {
    if (col && idx === 0) return;
    const line = idx + 1;
    const f = cells.map((c) => c.trim());
    if (col) {
      if (f.every((c) => c === "")) return;
      const lesson = Number(f[col.lesson]);
      const prompt = f[col.question] ?? "";
      if (!prompt) return; // blank template rows
      if (!Number.isInteger(lesson) || lesson < 1) { errors.push(`Row ${line}: the Lesson column must be a number.`); return; }
      const options = col.options.map((i) => f[i] ?? "").filter((o) => o !== "");
      if (options.length < 2) { errors.push(`Row ${line}: give at least two options.`); return; }
      const correct = answerIndex(f[col.answer] ?? "", options.length);
      if (correct === null) { errors.push(`Row ${line}: the answer "${f[col.answer] ?? ""}" must be a letter A–${LETTERS[options.length - 1]} (or 1–${options.length}).`); return; }
      const explanation = col.explanation >= 0 ? (f[col.explanation] || null) : null;
      questions.push({ lesson, prompt, options, correct_index: correct, explanation, line });
      return;
    }
    while (f.length && f[f.length - 1] === "") f.pop();
    if (!f.length) return;
    const lesson = Number(f[0]);
    if (!Number.isInteger(lesson) || lesson < 1) { if (idx === 0) return; errors.push(`Row ${line}: the first column must be the lesson number.`); return; }
    if (f.length < 5) { errors.push(`Row ${line}: needs lesson, question, at least two options and the answer.`); return; }
    // without a header: the answer is the last column, or the second-to-last when an explanation follows it
    let ai = f.length - 1;
    let explanation: string | null = null;
    if (!looksLikeAnswer(f[ai]) && looksLikeAnswer(f[ai - 1] ?? "")) { explanation = f[ai] || null; ai -= 1; }
    const prompt = f[1];
    const options = f.slice(2, ai).filter((o) => o !== "");
    if (!prompt) { errors.push(`Row ${line}: the question is empty.`); return; }
    if (options.length < 2) { errors.push(`Row ${line}: give at least two options.`); return; }
    if (options.length > 8) { errors.push(`Row ${line}: at most eight options.`); return; }
    const correct = answerIndex(f[ai], options.length);
    if (correct === null) { errors.push(`Row ${line}: the answer "${f[ai]}" must be a letter A–${LETTERS[options.length - 1]} (or 1–${options.length}).`); return; }
    questions.push({ lesson, prompt, options, correct_index: correct, explanation, line });
  });
  return { questions, errors };
}

/** Parse "Title | YouTube link | minutes" lines for bulk lesson creation. */
export function parseLessonLines(text: string): { lessons: { title: string; youtube_url: string | null; duration: number | null }[]; errors: string[] } {
  const lessons: { title: string; youtube_url: string | null; duration: number | null }[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (!l.trim()) return;
    const parts = (l.includes("|") ? l.split("|") : l.split("\t")).map((p) => p.trim());
    const title = parts[0];
    const url = parts.find((p) => /^https?:\/\//i.test(p)) ?? null;
    const minPart = parts.slice(1).find((p) => /^\d+(\.\d+)?$/.test(p));
    if (!title || /^https?:\/\//i.test(title)) { errors.push(`Line ${i + 1}: start with the lesson title.`); return; }
    lessons.push({ title, youtube_url: url, duration: minPart ? Math.round(Number(minPart)) : null });
  });
  return { lessons, errors };
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map((v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\r\n") + "\r\n";
}
