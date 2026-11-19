import test from "node:test";
import assert from "node:assert/strict";
import { limparWidgets, adicionarWidget, bancoPadrao, moverWidget, ajustarWidget, estiloDoWidget, acharLugar, sobrepoe, alturaDosWidgets, TAMANHO_WIDGET, COLUNAS_WIDGET } from "../src/dados.ts";

const mk = (extra = []) => limparWidgets(extra);

test("widget antigo (sem posição) ganha lugar sem sobrepor", () => {
  const ws = mk([{ id: "a", tipo: "relogio-digital" }, { id: "b", tipo: "bateria" }, { id: "c", tipo: "agenda" }]);
  assert.equal(ws.length, 3);
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) assert.equal(sobrepoe(ws[i], ws[j]), false);
  assert.ok(ws.every((w) => w.estilo === "vidro" && w.x + w.w <= COLUNAS_WIDGET));
});

test("limparWidgets conserta posição ruim, estilo inválido e sobreposição", () => {
  const ws = mk([{ id: "a", tipo: "bateria", x: 0, y: 0, w: 2, h: 2, estilo: "solido" }, { id: "b", tipo: "bateria", x: 1, y: 1, w: 2, h: 2, estilo: "xx" }, { id: "c", tipo: "bateria", x: 9, y: -3, w: 99, h: 0 }]);
  assert.equal(ws[0].estilo, "solido"); assert.equal(ws[1].estilo, "vidro");
  assert.equal(sobrepoe(ws[0], ws[1]), false); assert.equal(sobrepoe(ws[1], ws[2]), false); assert.equal(sobrepoe(ws[0], ws[2]), false);
  assert.ok(ws.every((w) => w.w >= 1 && w.w <= 4 && w.h >= 1 && w.x >= 0 && w.y >= 0 && w.x + w.w <= 4));
});

test("adicionar põe no primeiro espaço livre", () => {
  let b = bancoPadrao();
  b = adicionarWidget(b, { tipo: "relogio-analogico" }).banco; // 2x2 em (0,0)
  b = adicionarWidget(b, { tipo: "bateria" }).banco;           // 2x2 ao lado
  b = adicionarWidget(b, { tipo: "clima", cidade: "Porto Alegre", lat: -30, lon: -51 }).banco; // 4x2 embaixo
  assert.deepEqual(b.widgets.map((w) => [w.x, w.y]), [[0, 0], [2, 0], [0, 2]]);
  assert.equal(alturaDosWidgets(b.widgets), 4);
});

test("mover: limita à grade e desce se o lugar estiver ocupado", () => {
  const ws = mk([{ id: "a", tipo: "relogio-analogico", x: 0, y: 0, w: 2, h: 2 }, { id: "b", tipo: "bateria", x: 2, y: 0, w: 2, h: 2 }]);
  assert.deepEqual(moverWidget(ws, "b", 9, 0).find((w) => w.id === "b"), { ...ws[1], x: 2, y: 0 });
  const m = moverWidget(ws, "b", 0, 0).find((w) => w.id === "b");
  assert.deepEqual([m.x, m.y], [0, 2]);
  assert.equal(moverWidget(ws, "zz", 1, 1), ws);
});

test("ajustar (redimensionar): ok, fora da grade e batida", () => {
  const ws = mk([{ id: "a", tipo: "bateria", x: 0, y: 0, w: 2, h: 2 }, { id: "b", tipo: "bateria", x: 2, y: 0, w: 2, h: 2 }]);
  assert.equal(ajustarWidget(ws, "a", { x: 0, y: 0, w: 3, h: 2 }), null); // bate em b
  assert.equal(ajustarWidget(ws, "a", { x: 3, y: 0, w: 2, h: 2 }), null); // sai da grade
  assert.equal(ajustarWidget(ws, "a", { x: 0, y: 0, w: 2, h: 0 }), null);
  const r = ajustarWidget(ws, "a", { x: 0, y: 0, w: 2, h: 4 });
  assert.equal(r.find((w) => w.id === "a").h, 4);
});

test("estilo só aceita os quatro", () => {
  const ws = mk([{ id: "a", tipo: "bateria" }]);
  assert.equal(estiloDoWidget(ws, "a", "fosco")[0].estilo, "fosco");
  assert.equal(estiloDoWidget(ws, "a", "feio")[0].estilo, "vidro");
  assert.equal(acharLugar([], 4, 3).y, 0);
  assert.ok(Object.values(TAMANHO_WIDGET).every((t) => t.w >= 1 && t.w <= 4));
});
