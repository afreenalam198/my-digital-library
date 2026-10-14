import assert from "node:assert/strict";
import test from "node:test";
import { bookSize, wrapSpineTitle } from "../src/spineTitle.js";

const measure = (text) => text.length * 10;

test("a short title stays on one spine line", () => {
  assert.deepEqual(wrapSpineTitle("Circe", measure, { maxLine: 80, maxColumns: 3 }), ["Circe"]);
});

test("a long title wraps onto the next spine line", () => {
  const lines = wrapSpineTitle("The Night Circus Story", measure, { maxLine: 100, maxColumns: 3 });
  assert.deepEqual(lines, ["The Night", "Circus", "Story"]);
});

test("text past the spine width ends with an ellipsis", () => {
  const lines = wrapSpineTitle("One Two Three Four", measure, { maxLine: 80, maxColumns: 2 });
  assert.equal(lines.length, 2);
  assert.equal(lines[1].endsWith("…"), true);
  assert.equal(lines.join(" ").includes("Four"), false);
});

test("book height stays within the old cap", () => {
  const sized = bookSize("A".repeat(40), measure);
  assert.ok(sized.height <= 280 + 22 + 25);
  assert.equal(sized.font, 17);
  assert.ok(sized.lines.length > 1);
});
