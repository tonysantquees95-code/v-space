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

import { diasAte, gradeDoMes, fraseDoDia, minutosSegundos, FRASES } from "../src/widgets.ts";
import { dataValida, editarWidget as editarW, adicionarWidget as addW, limparWidgets as limparW } from "../src/dados.ts";
import { test as t2 } from "node:test";
t2("novos widgets: calendário, contagem, frase, tempo", () => {
  assert.equal(diasAte("2026-11-25", new Date(2026, 10, 19)), 6);
  assert.equal(diasAte("2026-11-19", new Date(2026, 10, 19, 23, 59)), 0);
  assert.equal(diasAte("2026-11-18", new Date(2026, 10, 19)), -1);
  const g = gradeDoMes(2026, 10); // novembro/2026 começa num domingo
  assert.equal(g[0][0], 1); assert.ok(g.every((l) => l.length === 7)); assert.equal(g.flat().filter(Boolean).length, 30);
  assert.equal(fraseDoDia(new Date(2026, 10, 19)), fraseDoDia(new Date(2026, 10, 19, 23, 0)));
  assert.ok(FRASES.includes(fraseDoDia()));
  assert.equal(minutosSegundos(1500), "25:00"); assert.equal(minutosSegundos(61.2), "01:02"); assert.equal(minutosSegundos(-5), "00:00");
  assert.ok(dataValida("2026-02-28")); assert.ok(!dataValida("2026-02-31")); assert.ok(!dataValida("ontem"));
});
t2("widgets de texto: nota, contagem e limpeza", () => {
  const b = { widgets: [] };
  const r = addW(b, { tipo: "contagem" }).banco;
  assert.equal(r.widgets[0].titulo, "Meu evento"); assert.ok(dataValida(r.widgets[0].data));
  const n = addW(r, { tipo: "notas" }).banco;
  const id = n.widgets[1].id;
  const e = editarW(n.widgets, id, { texto: "comprar <b>pão</b>" });
  assert.equal(e[1].texto, "comprar bpão/b");
  const ruim = limparW([{ tipo: "contagem", titulo: "x", data: "2026-13-40" }]);
  assert.equal(ruim[0].data, undefined);
  assert.equal(limparW([{ tipo: "notas", texto: "a".repeat(999) }])[0].texto.length, 300);
});

import { lerPrevisao, saudacao, progressoDoDia, diasDaSemana } from "../src/widgets.ts";
import { CATALOGO_WIDGET, TIPOS_WIDGET, TAMANHO_WIDGET as TAM2, ALTURA_MAX_WIDGET as ALT2 } from "../src/dados.ts";
t2("previsão, saudação, progresso, semana e catálogo", () => {
  const time = ["2026-11-19T10:00", "2026-11-19T11:00", "2026-11-19T12:00", "2026-11-19T13:00"];
  const p = lerPrevisao({ hourly: { time, temperature_2m: [20, 21, 22, 23.4], weather_code: [0, 1, 2, 3] }, daily: { time: ["2026-11-19", "2026-11-20"], temperature_2m_max: [28, 27], temperature_2m_min: [18, 17], weather_code: [0, 61] } }, "2026-11-19T11");
  assert.equal(p.horas[0].h, 11); assert.equal(p.horas.length, 3); assert.equal(p.horas[2].temp, 23); assert.equal(p.dias[1].codigo, 61);
  assert.equal(lerPrevisao({ hourly: {}, daily: {} }, "x"), null); assert.equal(lerPrevisao(null, "x"), null);
  assert.equal(saudacao(new Date(2026, 0, 1, 9)), "Bom dia"); assert.equal(saudacao(new Date(2026, 0, 1, 15)), "Boa tarde"); assert.equal(saudacao(new Date(2026, 0, 1, 20)), "Boa noite");
  assert.equal(progressoDoDia(new Date(2026, 0, 1, 12, 0)), 50);
  const s = diasDaSemana(new Date(2026, 10, 19)); assert.equal(s.length, 7); assert.equal(s.filter((x) => x.hoje).length, 1); assert.equal(s[0].dia, 15);
  assert.equal(new Set(TIPOS_WIDGET).size, CATALOGO_WIDGET.length);
  for (const t of TIPOS_WIDGET) { assert.ok(TAM2[t].w >= 1 && TAM2[t].w <= 4 && TAM2[t].h <= ALT2); }
});
