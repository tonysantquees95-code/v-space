import test from "node:test";
import assert from "node:assert/strict";
import { escalaPara, PRONTOS, LADO_MAX } from "../src/papel.ts";

test("escalaPara: só reduz, nunca amplia", () => {
  assert.equal(escalaPara(800, 600), 1);
  assert.equal(escalaPara(LADO_MAX * 2, 100), 0.5);
  assert.equal(escalaPara(0, 0), 1);
});
test("papéis prontos têm 3 cores válidas e ids únicos", () => {
  assert.equal(new Set(PRONTOS.map((p) => p.id)).size, PRONTOS.length);
  for (const p of PRONTOS) for (const c of p.cores) assert.match(c, /^#[0-9a-f]{6}$/i);
});
