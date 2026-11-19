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

import { ordenarPor, limparTema, TEMAS } from "../src/dados.ts";
import { limparIcones } from "../src/iconesApp.ts";
import { ehNovo } from "../src/selos.ts";
import test2 from "node:test";
import assert2 from "node:assert/strict";
test2("ordem da gaveta", () => {
  const apps = [{ pacote: "a.b", nome: "Beta", instalado: 20 }, { pacote: "a.a", nome: "Alfa", instalado: 10 }, { pacote: "a.c", nome: "Gama", instalado: 30 }];
  assert2.deepEqual(ordenarPor(apps, "az").map((a) => a.nome), ["Alfa", "Beta", "Gama"]);
  assert2.deepEqual(ordenarPor(apps, "za").map((a) => a.nome), ["Gama", "Beta", "Alfa"]);
  assert2.deepEqual(ordenarPor(apps, "novos").map((a) => a.nome), ["Gama", "Beta", "Alfa"]);
  assert2.deepEqual(ordenarPor(apps, "antigos").map((a) => a.nome), ["Alfa", "Beta", "Gama"]);
  assert2.deepEqual(ordenarPor(apps, "usados", { "a.c": 5, "a.b": 2 }).map((a) => a.nome), ["Gama", "Beta", "Alfa"]);
});
test2("ícones por app e app novo", () => {
  assert2.deepEqual(limparIcones({ "a.b": "data:image/png;base64,xx", "ruim!": "data:image/png;base64,xx", "c.d": "http://x" }), { "a.b": "data:image/png;base64,xx" });
  const agora = Date.now();
  assert2.equal(ehNovo(agora - 3600_000, 0, agora), true);
  assert2.equal(ehNovo(agora - 3600_000, 1, agora), false);
  assert2.equal(ehNovo(agora - 10 * 24 * 3600_000, 0, agora), false);
  const t = limparTema({ ...TEMAS[0], ordem: "xx", selos: false, pontoNovo: true });
  assert2.equal(t.ordem, "az"); assert2.equal(t.selos, false); assert2.equal(t.pontoNovo, true);
});

import { juntarSalvo, tirarSalvo, codigoDoTema, temaDoCodigo, limparSalvos, MAX_SALVOS } from "../src/temasSalvos.ts";
test2("temas salvos e código", () => {
  const t = limparTema({ ...TEMAS[0], cor: "#112233", superficie: "acrilico", intensidade: 140, pastaAbre: "janela", animBloqueio: "pulso" });
  assert2.equal(t.intensidade, 100);
  let l = juntarSalvo([], "  Meu  ", t, "a1");
  assert2.equal(l.length, 1); assert2.equal(l[0].nome, "Meu");
  assert2.equal(juntarSalvo(l, "   ", t), null);
  assert2.equal(tirarSalvo(l, "a1").length, 0);
  const cheio = Array.from({ length: MAX_SALVOS }, (_, i) => ({ id: `x${i}`, nome: `n${i}`, tema: t }));
  assert2.equal(juntarSalvo(cheio, "mais", t), null);
  assert2.equal(limparSalvos([{ id: "ruim!", nome: "x", tema: t }, { id: "ok", nome: "ok", tema: { superficie: "zz" } }]).length, 1);
  const volta = temaDoCodigo(codigoDoTema(t));
  assert2.equal(volta.superficie, "acrilico"); assert2.equal(volta.pastaAbre, "janela"); assert2.equal(volta.animBloqueio, "pulso"); assert2.equal(volta.id, "personalizado");
  assert2.equal(temaDoCodigo("lixo"), null);
  assert2.equal(temaDoCodigo("VSPACE1:@@@"), null);
});
