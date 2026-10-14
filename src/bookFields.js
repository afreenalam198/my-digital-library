const COVER = /^https:\/\/covers\.openlibrary\.org\/b\/id\/\d+-L\.jpg$/;
const WORK = /^\/works\/OL\d+W$/;

const LIMITS = {
  title: 400,
  author: 400,
  genre: 500,
  blurb: 20000,
  review: 8000,
  note: 4000,
};

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export function safeCover(value) {
  const cover = String(value ?? "").trim();
  return COVER.test(cover) ? cover : "";
}

export function safeWorkKey(value) {
  const key = String(value ?? "").trim();
  return WORK.test(key) ? key : "";
}

export function normalizeBook(book) {
  const title = clip(book.title, LIMITS.title);
  if (!title) throw new Error("A book needs a title.");
  const status = book.status === "tbr" ? "tbr" : book.status === "read" ? "read" : "";
  if (!status) throw new Error("That shelf isn't available.");
  let rating = book.rating ?? null;
  if (rating != null) {
    rating = Number(rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Choose a heart rating from 1 to 5.");
    }
  }
  return {
    ...book,
    title,
    author: clip(book.author, LIMITS.author),
    genre: clip(book.genre, LIMITS.genre),
    blurb: clip(book.blurb, LIMITS.blurb),
    note: clip(book.note, LIMITS.note),
    coverUrl: safeCover(book.coverUrl),
    olKey: safeWorkKey(book.olKey),
    status,
    rating: status === "tbr" ? null : rating,
    review: status === "tbr" ? "" : clip(book.review, LIMITS.review),
  };
}

export function normalizePatch(patch) {
  const next = { ...patch };
  if ("title" in next) {
    next.title = clip(next.title, LIMITS.title);
    if (!next.title) throw new Error("A book needs a title.");
  }
  if ("author" in next) next.author = clip(next.author, LIMITS.author);
  if ("genre" in next) next.genre = clip(next.genre, LIMITS.genre);
  if ("blurb" in next) next.blurb = clip(next.blurb, LIMITS.blurb);
  if ("review" in next) next.review = clip(next.review, LIMITS.review);
  if ("note" in next) next.note = clip(next.note, LIMITS.note);
  if ("coverUrl" in next) next.coverUrl = safeCover(next.coverUrl);
  if ("olKey" in next) next.olKey = safeWorkKey(next.olKey);
  if ("status" in next && next.status !== "read" && next.status !== "tbr") {
    throw new Error("That shelf isn't available.");
  }
  if ("rating" in next && next.rating != null) {
    const rating = Number(next.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Choose a heart rating from 1 to 5.");
    }
    next.rating = rating;
  }
  if (next.status === "tbr") {
    next.rating = null;
    next.review = "";
  }
  return next;
}
