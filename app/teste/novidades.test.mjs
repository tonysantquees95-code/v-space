import test from "node:test";
import assert from "node:assert/strict";
import { NOVIDADES } from "../src/novidades.ts";

test("novidades: ids crescentes, tipos válidos e textos preenchidos", () => {
  assert.ok(NOVIDADES.length > 0);
  let ant = 0;
  for (const n of NOVIDADES) {
    assert.ok(n.id > ant, `id ${n.id} fora de ordem`); ant = n.id;
    assert.ok(["novo", "melhoria", "correcao"].includes(n.tipo));
    assert.ok(n.titulo.trim().length > 0 && n.texto.trim().length > 10);
  }
});
