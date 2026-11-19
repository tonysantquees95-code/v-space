import test from "node:test";
import assert from "node:assert/strict";
import { haNovaVersao, precisaConferir, versaoValida } from "../src/atualizacao.ts";

test("haNovaVersao: só avisa quando a nova é maior e o app tem número de build", () => {
  assert.equal(haNovaVersao(5, 6), true);
  assert.equal(haNovaVersao(6, 6), false);
  assert.equal(haNovaVersao(0, 9), false);
  assert.equal(haNovaVersao(5, undefined), false);
});
test("precisaConferir: a cada 6 horas e se o relógio voltou", () => {
  assert.equal(precisaConferir(0, 1000), true);
  assert.equal(precisaConferir(1000, 1000 + 3_600_000), false);
  assert.equal(precisaConferir(1000, 1000 + 7 * 3_600_000), true);
  assert.equal(precisaConferir(5000, 1000), true);
});
test("versaoValida: só https do GitHub", () => {
  const ok = { numero: 3, tag: "1.3", url: "https://github.com/x/y/releases/download/1.3/V-Space.apk", sha256: "A".repeat(64) };
  assert.equal(versaoValida(ok)?.numero, 3);
  assert.equal(versaoValida(ok)?.sha256, "a".repeat(64));
  assert.equal(versaoValida({ ...ok, url: "http://github.com/a.apk" }), null);
  assert.equal(versaoValida({ ...ok, url: "https://exemplo.com/a.apk" }), null);
  assert.equal(versaoValida({ ...ok, numero: "3" }), null);
  assert.equal(versaoValida(null), null);
});
