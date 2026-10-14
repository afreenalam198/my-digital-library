const KEY = "afreen-library-books";

export function loadBooks() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isBook) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books) {
  localStorage.setItem(KEY, JSON.stringify(books));
}

function isBook(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.title === "string");
}

const SPINE_COLORS = [
  "#e23b3b",
  "#f2c14e",
  "#7ec8e3",
  "#3d6b4f",
  "#f4a261",
  "#2f3e73",
  "#d96c8a",
  "#e07a5f",
  "#8fbf6a",
  "#c73e66",
  "#f6e27a",
  "#5c4d7a",
];

export function spineColor(title) {
  let index = 0;
  const name = title || "Book";
  for (let i = 0; i < name.length; i += 1) {
    index = (index + name.charCodeAt(i)) % SPINE_COLORS.length;
  }
  return SPINE_COLORS[index];
}
