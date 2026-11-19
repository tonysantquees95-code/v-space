import test from "node:test";
import assert from "node:assert/strict";
import { definirSelos, textoDoSelo } from "../src/selos.ts";
test("textoDoSelo limita em 99+", () => { assert.equal(textoDoSelo(3), "3"); assert.equal(textoDoSelo(150), "99+"); });
test("definirSelos aceita objeto vazio sem erro", () => { definirSelos({}); definirSelos({ "a.b": 2 }); definirSelos({}); });

import { limparBanco as _lb, bancoPadrao as _bp } from "../src/dados.ts";
test("seguro: só pacotes válidos, sem repetir", () => {
  const b = _lb({ ..._bp(), seguro: ["com.banco.app", "com.banco.app", "x y!", 5, "gov.br.app"] });
  assert.deepEqual(b.seguro, ["com.banco.app", "gov.br.app"]);
  assert.deepEqual(_lb({ ..._bp() }).seguro, []);
});

import { juntarFavorito, luzDoPapel, MAX_FAVORITOS } from "../src/papel.ts";
test("favoritos: sem repetir, novo primeiro, no máximo", () => {
  assert.deepEqual(juntarFavorito(["data:image/a", "data:image/b"], "data:image/b"), ["data:image/b", "data:image/a"]);
  const cheia = Array.from({ length: MAX_FAVORITOS }, (_, i) => `data:image/${i}`);
  assert.equal(juntarFavorito(cheia, "data:image/novo").length, MAX_FAVORITOS);
});
test("luz do dia segue a hora", () => {
  assert.equal(luzDoPapel("nenhuma", 12).alfa, 0);
  assert.ok(luzDoPapel("sol", 23).alfa > luzDoPapel("sol", 12).alfa);
  assert.equal(luzDoPapel("sol", 12).cor, luzDoPapel("dia", 12).cor);
});
test("tema novo traz luz, papelDiario e aplicarEm válidos", async () => {
  const { limparTema, TEMAS } = await import("../src/dados.ts");
  const t = limparTema({ ...TEMAS[0], luz: "x", papelDiario: 1, aplicarEm: "y" });
  assert.equal(t.luz, "nenhuma"); assert.equal(t.papelDiario, false); assert.equal(t.aplicarEm, "pergunta");
});
