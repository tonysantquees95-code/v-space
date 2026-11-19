import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AJUSTES, pontuar, buscarApps, buscarAjustes, linksWeb, registrarRecente } from "../src/busca.ts";

const app = (nome, pacote) => ({ nome, pacote });
const APPS = [app("Gmail", "com.google.android.gm"), app("Google", "com.google.android.googlequicksearchbox"), app("Google One", "com.google.android.apps.subscriptions.red"), app("Câmera", "cam"), app("GameSir", "com.gamesir")];

test("pontuar: começo, começo de palavra, contém, sem acento", () => {
  assert.equal(pontuar("Gmail", "gma"), 3); assert.equal(pontuar("Google One", "one"), 2); assert.equal(pontuar("Câmera", "mera"), 1);
  assert.equal(pontuar("Câmera", "camera"), 3); assert.equal(pontuar("Gmail", "xyz"), 0); assert.equal(pontuar("Gmail", ""), 0);
});

test("buscarApps: melhor primeiro; recentes desempatam", () => {
  assert.deepEqual(buscarApps(APPS, "gm").map((a) => a.nome), ["Gmail", "GameSir"].filter((n) => n === "Gmail"));
  assert.deepEqual(buscarApps(APPS, "g").map((a) => a.nome), ["GameSir", "Gmail", "Google", "Google One"]);
  assert.equal(buscarApps(APPS, "g", ["com.google.android.apps.subscriptions.red"])[0].nome, "Google One");
  assert.deepEqual(buscarApps(APPS, "zzzz"), []);
});

test("buscarAjustes acha por título, lugar e palavra-chave", () => {
  assert.ok(buscarAjustes("cor").some((a) => a.titulo === "Cor do ícone"));
  assert.ok(buscarAjustes("colunas")[0].destino === "inicio/grade");
  assert.ok(buscarAjustes("inteligencia").some((a) => a.destino === "@organizar"));
  assert.deepEqual(buscarAjustes("   "), []);
  assert.deepEqual(buscarAjustes("qwertyuiop"), []);
});

test("todo destino de configuração existe no Estúdio", () => {
  const estudio = readFileSync(new URL("../src/telas/Estudio.tsx", import.meta.url), "utf8");
  const existentes = new Set([...estudio.matchAll(/case "([a-z]+\/[a-z]+)"/g)].map((m) => m[1]));
  for (const a of AJUSTES) if (a.destino !== "@organizar") assert.ok(existentes.has(a.destino), `sem painel para ${a.destino}`);
});

test("linksWeb codifica a busca e só usa https", () => {
  const l = linksWeb("a&b c");
  assert.ok(l.length >= 3 && l.every((x) => x.url.startsWith("https://")));
  assert.match(l[0].url, /q=a%26b%20c$/);
  assert.deepEqual(linksWeb("  "), []);
});

test("registrarRecente: sem repetir, mais novo primeiro, com limite", () => {
  assert.deepEqual(registrarRecente(["a", "b"], "b"), ["b", "a"]);
  assert.equal(registrarRecente(Array.from({ length: 8 }, (_, i) => `x${i}`), "novo").length, 8);
  assert.deepEqual(registrarRecente(["a"], "  "), ["a"]);
});
