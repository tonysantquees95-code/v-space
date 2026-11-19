import test from "node:test";
import assert from "node:assert/strict";
import { bancoPadrao, limparBanco, limparCategorias, CATEGORIAS_PADRAO, MAX_FAVORITOS, reconciliar } from "../src/dados.ts";
import {
  classificarLocal, categoriaDe, appsDaCategoria, moverParaCategoria, favoritar, desfavoritar, criarCategoria, apagarCategoria, reordenarCategoria,
  aplicarOrganizacao, previaOrganizacao, organizarNoAparelho, contagens, editarCategoria,
} from "../src/categorias.ts";

const app = (nome, pacote) => ({ nome, pacote });
const APPS = [app("Chrome", "com.android.chrome"), app("Roblox", "com.roblox.client"), app("Nubank", "com.nu.production"), app("Play Store", "com.android.vending"), app("Fotos", "com.google.android.apps.photos")];

test("classificarLocal: casos comuns e reserva", () => {
  assert.equal(classificarLocal(APPS[0]), "social");
  assert.equal(classificarLocal(APPS[1]), "jogos");
  assert.equal(classificarLocal(APPS[2]), "financas");
  assert.equal(classificarLocal(APPS[3]), "ferramentas");
  assert.equal(classificarLocal(APPS[4]), "midia");
  assert.equal(classificarLocal(app("Play Games", "com.google.android.play.games")), "jogos");
  assert.equal(classificarLocal(app("Vetogoshi", "tech.vetorial.vetogoshi")), "jogos");
  assert.equal(classificarLocal(app("Vênus", "com.tonimarques.sextafeira")), "ferramentas");
  assert.equal(classificarLocal(app("Corrida Neon", "demo.jogo1")), "jogos");
  // palavra curta só vale inteira: "Xadrez" não é "xp"
  assert.notEqual(classificarLocal(app("Xpto", "br.xpto")), "financas");
});

test("categoriaDe: escolha guardada vence; categoria apagada volta ao aparelho", () => {
  let b = bancoPadrao();
  assert.equal(categoriaDe(b, APPS[0]), "social");
  b = moverParaCategoria(b, APPS[0].pacote, "jogos");
  assert.equal(categoriaDe(b, APPS[0]), "jogos");
  assert.deepEqual(b.manuais, [APPS[0].pacote]);
  b = apagarCategoria(b, "jogos");
  assert.equal(categoriaDe(b, APPS[0]), "social");
  assert.equal(categoriaDe(b, APPS[1]), "ferramentas"); // jogos não existe mais → reserva
  assert.deepEqual(b.manuais, []);
});

test("a categoria reserva não se apaga e sempre existe", () => {
  assert.equal(apagarCategoria(bancoPadrao(), "ferramentas").categorias.length, CATEGORIAS_PADRAO.length);
  assert.ok(limparCategorias([{ id: "x", nome: "X", icone: "livro" }]).some((c) => c.id === "ferramentas"));
});

test("criar, editar e reordenar categorias", () => {
  let r = criarCategoria(bancoPadrao(), "  Trabalho <b>  ", "trabalho");
  assert.ok(r.ok); assert.equal(r.banco.categorias.at(-1).nome, "Trabalho b");
  const r2 = criarCategoria(r.banco, "Trabalho b", "livro");
  assert.notEqual(r.id, r2.id);
  let b = editarCategoria(r2.banco, r.id, { nome: "Escritório", icone: "carteira" });
  assert.equal(b.categorias.find((c) => c.id === r.id).nome, "Escritório");
  const antes = b.categorias.map((c) => c.id);
  b = reordenarCategoria(b, "social", 1);
  assert.equal(b.categorias[1].id, "social"); assert.equal(b.categorias[0].id, antes[1]);
  assert.equal(reordenarCategoria(b, b.categorias[0].id, -1), b);
  let cheio = bancoPadrao();
  for (let i = 0; i < 30; i++) cheio = criarCategoria(cheio, `Nova ${i}`).banco;
  assert.ok(cheio.categorias.length <= 14);
});

test("favoritos: limite e repetidos", () => {
  let b = bancoPadrao();
  for (let i = 0; i < MAX_FAVORITOS + 3; i++) b = favoritar(b, `com.app.n${i}`).banco;
  assert.equal(b.favoritos.length, MAX_FAVORITOS);
  assert.equal(favoritar(b, "com.app.n99").ok, false);
  assert.equal(desfavoritar(b, "com.app.n0").favoritos.includes("com.app.n0"), false);
  assert.equal(favoritar(b, "com.app.n1").ok, true);
});

test("aplicarOrganizacao: ignora pacote fantasma, categoria inexistente e app mexido à mão", () => {
  let b = moverParaCategoria(bancoPadrao(), APPS[2].pacote, "compras");
  const r = aplicarOrganizacao(b, APPS, { [APPS[0].pacote]: "produtividade", [APPS[2].pacote]: "financas", "com.nao.instalado": "jogos", [APPS[1].pacote]: "inventada" });
  assert.equal(r.mudaram, 1);
  assert.equal(categoriaDe(r.banco, APPS[0]), "produtividade");
  assert.equal(categoriaDe(r.banco, APPS[2]), "compras");
  assert.equal(categoriaDe(r.banco, APPS[1]), "jogos");
  assert.equal(r.banco.atribuidos["com.nao.instalado"], undefined);
});

test("previaOrganizacao e organizarNoAparelho (desfazer da IA mantém o manual)", () => {
  let b = moverParaCategoria(bancoPadrao(), APPS[1].pacote, "social");
  const mapa = { [APPS[0].pacote]: "produtividade" };
  const pre = previaOrganizacao(b, APPS, mapa);
  assert.deepEqual(pre.map((x) => [x.app.nome, x.de, x.para]), [["Chrome", "social", "produtividade"]]);
  const aplicado = aplicarOrganizacao(b, APPS, mapa).banco;
  const volta = organizarNoAparelho(aplicado);
  assert.equal(categoriaDe(volta, APPS[0]), "social");
  assert.equal(categoriaDe(volta, APPS[1]), "social");
});

test("appsDaCategoria e contagens ignoram ocultos e batem com o total", () => {
  const b = { ...bancoPadrao(), ocultos: [APPS[4].pacote] };
  assert.deepEqual(appsDaCategoria(b, APPS, "midia"), []);
  const c = contagens(b, APPS);
  assert.equal(Object.values(c).reduce((x, y) => x + y, 0), APPS.length - 1);
});

test("limparBanco: categorias, atribuições e favoritos lixo viram valores seguros; reconciliar limpa desinstalados", () => {
  const b = limparBanco({ modo: "voar", categorias: [{ id: "A B", nome: "x" }, { id: "ok", nome: "Ok", icone: "xyz" }], atribuidos: { "com.a": "ok", "com.b": "nao", "<script>": "ok" }, manuais: ["com.a", "com.zzz"], favoritos: ["com.a", "com.a", 7, "com.c"] });
  assert.equal(b.modo, "categorias");
  assert.deepEqual(b.categorias.map((c) => c.id), ["ok", "ferramentas"]);
  assert.equal(b.categorias[0].icone, "pasta");
  assert.deepEqual(b.atribuidos, { "com.a": "ok" });
  assert.deepEqual(b.manuais, ["com.a"]);
  assert.deepEqual(b.favoritos, ["com.a", "com.c"]);
  const r = reconciliar(b, new Set(["com.c"]));
  assert.deepEqual(r.favoritos, ["com.c"]); assert.deepEqual(r.atribuidos, {}); assert.deepEqual(r.manuais, []);
  assert.equal(limparBanco(null).categorias.length, CATEGORIAS_PADRAO.length);
});

import { GRUPOS_ICONES, ICONES_CATEGORIA, CORES_CATEGORIA, ehDinamica } from "../src/dados.ts";

test("grupos de ícones cobrem todos os ícones, sem repetir", () => {
  const ids = GRUPOS_ICONES.flatMap((g) => g.itens.map(([i]) => i));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), [...ICONES_CATEGORIA].sort());
  assert.ok(ICONES_CATEGORIA.length >= 50);
});

test("limparCategorias aceita só cor da paleta e conteúdo válido (reserva nunca é dinâmica)", () => {
  const r = limparCategorias([{ id: "a", nome: "A", icone: "casa", cor: CORES_CATEGORIA[2], conteudo: "recentes" }, { id: "b", nome: "B", icone: "xx", cor: "#123456", conteudo: "maluco" }, { id: "ferramentas", nome: "F", icone: "pasta", conteudo: "mais-usados" }]);
  assert.equal(r[0].cor, CORES_CATEGORIA[2]); assert.equal(r[0].conteudo, "recentes");
  assert.equal(r[1].cor, undefined); assert.equal(r[1].conteudo, undefined); assert.equal(r[1].icone, "pasta");
  assert.equal(r.find((c) => c.id === "ferramentas").conteudo, undefined);
});

test("categoria dinâmica: recentes e mais usados, e ninguém é movido para elas", () => {
  let b = bancoPadrao();
  b = criarCategoria(b, "Novos", "sino", { conteudo: "recentes" }).banco;
  b = criarCategoria(b, "Top", "estrela", { conteudo: "mais-usados", cor: CORES_CATEGORIA[0] }).banco;
  const apps = [{ pacote: "a.a", nome: "A", instalado: 100 }, { pacote: "b.b", nome: "B", instalado: 300 }, { pacote: "c.c", nome: "C" }];
  const novos = b.categorias.find((c) => c.nome === "Novos"), top = b.categorias.find((c) => c.nome === "Top");
  assert.ok(ehDinamica(novos) && ehDinamica(top));
  assert.deepEqual(appsDaCategoria(b, apps, novos.id).map((a) => a.pacote), ["b.b", "a.a"]);
  assert.deepEqual(appsDaCategoria(b, apps, top.id, { "c.c": 5, "a.a": 2 }).map((a) => a.pacote), ["c.c", "a.a"]);
  assert.equal(contagens(b, apps, { "c.c": 1 })[top.id], 1);
  assert.equal(moverParaCategoria(b, "a.a", novos.id), b);
  // o app continua na categoria de verdade (as dinâmicas só mostram, não tiram)
  assert.equal(contagens(b, apps)[novos.id], 2);
  const e = editarCategoria(b, top.id, { cor: null });
  assert.equal(e.categorias.find((c) => c.id === top.id).cor, undefined);
});
