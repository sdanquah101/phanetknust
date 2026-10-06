/** "Title: description | Reference" → { title, body, ref }. Missing parts are empty strings. */
export function splitLine(line: string): { title: string; body: string; ref: string } {
  const [main, ref = ""] = line.split("|");
  const i = main.indexOf(":");
  if (i === -1) return { title: main.trim(), body: "", ref: ref.trim() };
  return { title: main.slice(0, i).trim(), body: main.slice(i + 1).trim(), ref: ref.trim() };
}
