import test from "node:test";
import assert from "node:assert/strict";
import { CENAS, aplicarCena } from "../src/cenas.ts";
import { PRONTOS } from "../src/papel.ts";
import { TEMAS, bancoPadrao } from "../src/dados.ts";

test("cenas: ids únicos, temas e papéis existem", () => {
  assert.equal(new Set(CENAS.map((c) => c.id)).size, CENAS.length);
  for (const c of CENAS) {
    assert.ok(TEMAS.some((t) => t.id === c.tema), `tema de ${c.id}`);
    if (c.papel) assert.ok(PRONTOS.some((p) => p.id === c.papel), `papel de ${c.id}`);
  }
});
test("aplicarCena: muda tema, forma, pacote e dock; foto só se o papel foi gerado", () => {
  const c = CENAS.find((x) => x.id === "mar-calmo");
  const com = aplicarCena(bancoPadrao(), c, true);
  assert.equal(com.tema.fundo, "foto"); assert.equal(com.tema.forma, "circulo"); assert.equal(com.tema.pacote, "mono"); assert.equal(com.tema.dock, "transparente");
  const sem = aplicarCena(bancoPadrao(), c, false);
  assert.notEqual(sem.tema.fundo, "foto");
});
