export const SPINE_FONT = 17;
export const SPINE_LINE_MAX = 280;
export const SPINE_WIDTH_MAX = 74;

export function maxSpineColumns(font = SPINE_FONT) {
  const column = Math.ceil(font * 1.15);
  return Math.max(1, Math.floor((SPINE_WIDTH_MAX - 14) / column));
}

export function wrapSpineTitle(title, measure, options = {}) {
  const text = String(title || "").trim() || "Book";
  const maxLine = options.maxLine ?? SPINE_LINE_MAX;
  const maxColumns = options.maxColumns ?? maxSpineColumns();
  const lines = [];
  let rest = text;

  while (rest && lines.length < maxColumns) {
    const last = lines.length === maxColumns - 1;
    const taken = takeLine(rest, measure, maxLine, last);
    lines.push(taken.line);
    rest = taken.rest;
  }

  return lines;
}

export function bookSize(title, measure) {
  const name = String(title || "Book");
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 33 + name.charCodeAt(index)) >>> 0;
  }
  const font = SPINE_FONT;
  const lines = wrapSpineTitle(name, (text) => measure(text, font));
  const longest = Math.max(...lines.map((line) => measure(line, font)));
  const column = Math.ceil(font * 1.15);
  const spine =
    lines.length === 1
      ? Math.ceil(font * 1.2) + 14 + (hash % 8)
      : Math.min(SPINE_WIDTH_MAX, 14 + lines.length * column);
  return {
    spine,
    height: Math.ceil(longest) + 22 + (hash % 26),
    font,
    lines,
  };
}

function takeLine(text, measure, maxLine, last) {
  if (measure(text) <= maxLine) return { line: text, rest: "" };
  if (!last) {
    let cut = fitCount(text, measure, maxLine, false);
    const space = text.lastIndexOf(" ", cut);
    if (space > 0) cut = space;
    const line = text.slice(0, cut).trimEnd();
    if (!line) {
      const hard = Math.max(1, fitCount(text, measure, maxLine, false));
      return { line: text.slice(0, hard), rest: text.slice(hard) };
    }
    return { line, rest: text.slice(cut).trimStart() };
  }

  let cut = fitCount(text, measure, maxLine, true);
  let shown = text.slice(0, cut).trimEnd();
  const space = shown.lastIndexOf(" ");
  if (space > 0 && measure(`${shown.slice(0, space)}…`) <= maxLine) shown = shown.slice(0, space);
  while (shown.length > 1 && measure(`${shown}…`) > maxLine) shown = shown.slice(0, -1).trimEnd();
  if (!shown) shown = text.slice(0, 1);
  return { line: `${shown}…`, rest: "" };
}

function fitCount(text, measure, maxLine, withEllipsis) {
  let low = 1;
  let high = text.length;
  let best = 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sample = withEllipsis ? `${text.slice(0, mid).trimEnd()}…` : text.slice(0, mid);
    if (sample && measure(sample) <= maxLine) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}
