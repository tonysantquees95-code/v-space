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
