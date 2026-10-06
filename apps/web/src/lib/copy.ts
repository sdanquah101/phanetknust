/** "Title: description" → { title, body }. Lines without a colon become a title only. */
export function splitLine(line: string): { title: string; body: string } {
  const i = line.indexOf(":");
  if (i === -1) return { title: line.trim(), body: "" };
  return { title: line.slice(0, i).trim(), body: line.slice(i + 1).trim() };
}
