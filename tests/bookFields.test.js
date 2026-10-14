import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBook, normalizePatch, safeCover, safeWorkKey } from "../src/bookFields.js";

test("keeps Open Library covers and drops anything else", () => {
  const cover = "https://covers.openlibrary.org/b/id/12-L.jpg";
  assert.equal(safeCover(cover), cover);
  assert.equal(safeCover("javascript:alert(1)"), "");
  assert.equal(safeCover("https://example.com/cover.jpg"), "");
});

test("keeps work keys and drops other paths", () => {
  assert.equal(safeWorkKey("/works/OL18012166W"), "/works/OL18012166W");
  assert.equal(safeWorkKey("https://evil.example/works/OL1W"), "");
  assert.equal(safeWorkKey("/works/OL1W/../../secret"), "");
});

test("requires a title and a known shelf", () => {
  assert.throws(() => normalizeBook({ title: "  ", status: "tbr" }), /title/);
  assert.throws(() => normalizeBook({ title: "Circe", status: "archive" }), /shelf/);
});

test("a to-be-read book cannot carry a rating or review", () => {
  const book = normalizeBook({
    title: "Circe",
    status: "tbr",
    rating: 5,
    review: "Loved it",
    coverUrl: "https://evil.example/a.jpg",
  });
  assert.equal(book.rating, null);
  assert.equal(book.review, "");
  assert.equal(book.coverUrl, "");
});

test("a read book keeps a valid heart rating", () => {
  const book = normalizeBook({ title: "Circe", status: "read", rating: 4, review: "Yes" });
  assert.equal(book.rating, 4);
  assert.throws(() => normalizeBook({ title: "Circe", status: "read", rating: 9 }), /heart/);
});

test("patches cannot smuggle a bad cover or shelf", () => {
  const patch = normalizePatch({ coverUrl: "https://evil.example/a.jpg", note: "  later  " });
  assert.equal(patch.coverUrl, "");
  assert.equal(patch.note, "later");
  assert.throws(() => normalizePatch({ status: "nope" }), /shelf/);
});
