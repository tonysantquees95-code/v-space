import test from "node:test";
import assert from "node:assert/strict";
import {
  bancoPadrao, limparBanco, limparTema, layoutInicial, reconciliar, adicionarNaTela, removerDaTela, paraODock, tirarDoDock, criarPasta,
  adicionarNaPasta, tirarDaPasta, renomearPasta, mudarGrade, ocultar, mostrar, escolherTema, ajustarTema, exportar, importar, buscar,
  agruparPorLetra, ordenar, naTela, noLayout, repaginar, ehDaSuite, MAX_DOCK, MAX_PAGINAS, TEMAS,
} from "../src/dados.ts";

const app = (pacote, nome) => ({ pacote, nome: nome ?? pacote });
const lote = (n) => Array.from({ length: n }, (_, i) => app(`com.exemplo.app${i}`, `App ${String(i).padStart(2, "0")}`));
const comTela = (pacotes, b = bancoPadrao()) => ({ ...b, layout: { ...b.layout, paginas: [pacotes.map((pacote) => ({ tipo: "app", pacote }))] } });

test("limparBanco: lixo vira o banco padrão", () => {
  for (const ruim of [null, undefined, 42, "x", [], { layout: 5, tema: "a" }]) {
    const b = limparBanco(ruim);
    assert.equal(b.v, 1);
    assert.deepEqual(b.layout.paginas, [[]]);
    assert.equal(b.layout.colunas, 4);
    assert.equal(b.tema.cor, TEMAS[0].cor);
  }
});

test("limparBanco: limites, repetidos e pasta fantasma", () => {
  const b = limparBanco({
    tema: { cor: "vermelho", cor2: "#ABCDEF", tamanho: 999, forma: "triangulo", rotulos: "sim" },
    layout: {
      colunas: 99, linhas: 1, dock: ["a.b", "a.b", "c.d", "<x>", "e", "f", "g", "h", "i"],
      pastas: [{ id: "p1", nome: "  <b>Jogos</b>  ", apps: ["j.1", "j.1", "j.2"] }, { id: "p1", nome: "dup", apps: ["z"] }, { id: "vazia", apps: [] }],
      paginas: [[{ tipo: "app", pacote: "x.y" }, { tipo: "app", pacote: "x.y" }, { tipo: "pasta", id: "p1" }, { tipo: "pasta", id: "nao-existe" }, { tipo: "app", pacote: "j.1" }, 7, null]],
    },
    ocultos: ["o.1", "o.1", 5],
  });
  assert.equal(b.layout.colunas, 6); assert.equal(b.layout.linhas, 4);
  assert.equal(b.tema.cor, "#22d3ee"); assert.equal(b.tema.cor2, "#abcdef"); assert.equal(b.tema.tamanho, 72); assert.equal(b.tema.forma, "squircle"); assert.equal(b.tema.rotulos, true);
  assert.deepEqual(b.layout.dock, ["a.b", "c.d", "e", "f", "g"]);
  assert.equal(b.layout.dock.length, MAX_DOCK);
  assert.equal(b.layout.pastas.length, 1);
  assert.equal(b.layout.pastas[0].nome, "bJogos/b");
  assert.deepEqual(b.layout.pastas[0].apps, ["j.1", "j.2"]);
  assert.deepEqual(b.layout.paginas.flat(), [{ tipo: "app", pacote: "x.y" }, { tipo: "pasta", id: "p1" }]);
  assert.deepEqual(b.ocultos, ["o.1"]);
});

test("limparBanco: pasta sem página volta para a primeira e nada passa de MAX_PAGINAS", () => {
  const b = limparBanco({ layout: { pastas: [{ id: "solta", nome: "Solta", apps: ["a.a"] }], paginas: [] } });
  assert.deepEqual(b.layout.paginas.flat(), [{ tipo: "pasta", id: "solta" }]);
  const muitas = limparBanco({ layout: { colunas: 3, linhas: 4, paginas: Array.from({ length: 20 }, (_, i) => [{ tipo: "app", pacote: `p.${i}` }]) } });
  assert.ok(muitas.layout.paginas.length <= MAX_PAGINAS);
});

test("limparTema aceita hex em maiúscula e guarda minúscula", () => {
  assert.equal(limparTema({ cor: "#AABBCC" }).cor, "#aabbcc");
  assert.equal(limparTema({ cor: "#abc" }).cor, TEMAS[0].cor);
});

test("busca: começo do nome vem antes de trecho, acento e maiúscula não atrapalham", () => {
  const apps = [app("a.1", "Câmera"), app("a.2", "Google Camera"), app("a.3", "Calculadora"), app("com.whats", "WhatsApp"), app("a.5", "Scanner de câmera")];
  assert.deepEqual(buscar(apps, "camera").map((a) => a.nome), ["Câmera", "Google Camera", "Scanner de câmera"]);
  assert.deepEqual(buscar(apps, "CAL").map((a) => a.nome), ["Calculadora"]);
  assert.deepEqual(buscar(apps, "whats").map((a) => a.pacote), ["com.whats"]);
  assert.equal(buscar(apps, "zzz").length, 0);
  assert.equal(buscar(apps, "  ").length, 5);
  assert.deepEqual(buscar([app("com.exemplo.secreto", "Alfa")], "secreto").map((a) => a.nome), ["Alfa"]);
});

test("agrupar por letra: acento vai para a letra, símbolo e número vão para #", () => {
  const g = agruparPorLetra([app("1", "Éter"), app("2", "Abc"), app("3", "2048"), app("4", "Ágata"), app("5", "Zeta"), app("6", "elo")]);
  assert.deepEqual(g.map((x) => x.letra), ["A", "E", "Z", "#"]);
  assert.deepEqual(g[0].apps.map((a) => a.nome), ["Ágata", "Abc"].sort((x, y) => x.localeCompare(y, "pt-BR")));
  assert.deepEqual(g[1].apps.map((a) => a.nome), ["elo", "Éter"]);
});

test("layout inicial: suíte primeiro, dock com os essenciais, tudo cabe", () => {
  const apps = [app("com.google.android.dialer", "Telefone"), app("com.google.android.apps.messaging", "Mensagens"), app("com.android.chrome", "Chrome"), app("com.google.android.GoogleCamera", "Câmera"),
    app("tech.vetorial.vindex", "Vindex"), app("com.tonimarques.sextafeira", "Vênus"), ...lote(40)];
  const b = layoutInicial(apps);
  assert.equal(b.layout.dock.length, 4);
  assert.deepEqual(b.layout.dock, ["com.google.android.dialer", "com.google.android.apps.messaging", "com.android.chrome", "com.google.android.GoogleCamera"]);
  const primeira = b.layout.paginas[0];
  assert.equal(primeira.length, b.layout.colunas * b.layout.linhas);
  assert.ok(ehDaSuite(primeira[0].pacote) && ehDaSuite(primeira[1].pacote));
  assert.equal(new Set(noLayout(b)).size, noLayout(b).size);
});

test("layout inicial sem os apps conhecidos usa os primeiros em ordem alfabética", () => {
  const b = layoutInicial(lote(30));
  assert.equal(b.layout.dock.length, 4);
  assert.equal(b.layout.dock[0], "com.exemplo.app0");
  assert.ok(!naTela(b).has(b.layout.dock[0]));
});

test("reconciliar tira o que foi desinstalado de tela, dock, pastas e ocultos", () => {
  let b = comTela(["a.1", "a.2", "a.3", "a.4"]);
  b = criarPasta(b, "a.1", "a.2", "Dupla");
  b = paraODock(b, "a.3").banco;
  b = ocultar(b, "a.4");
  const r = reconciliar(b, new Set(["a.1"]));
  assert.deepEqual([...noLayout(r)], ["a.1"]);
  assert.equal(r.layout.pastas.length, 1);
  assert.deepEqual(r.layout.pastas[0].apps, ["a.1"]);
  assert.deepEqual(r.ocultos, []);
  const tudoSumiu = reconciliar(b, new Set());
  assert.deepEqual(tudoSumiu.layout.paginas, [[]]);
  assert.deepEqual(tudoSumiu.layout.pastas, []);
});

test("adicionar na tela: primeiro espaço livre, nova página quando enche, limite de páginas", () => {
  let b = mudarGrade(bancoPadrao(), 3, 4);
  for (let i = 0; i < 12; i++) b = adicionarNaTela(b, `x.${i}`).banco;
  assert.equal(b.layout.paginas.length, 1);
  b = adicionarNaTela(b, "x.12").banco;
  assert.equal(b.layout.paginas.length, 2);
  assert.equal(adicionarNaTela(b, "x.12").banco, b, "repetir não duplica");
  let cheio = b;
  for (let i = 13; i < 12 * MAX_PAGINAS + 5; i++) cheio = adicionarNaTela(cheio, `x.${i}`).banco;
  assert.equal(cheio.layout.paginas.length, MAX_PAGINAS);
  assert.equal(adicionarNaTela(cheio, "extra.app").ok, false);
  // buraco aberto numa página anterior é reaproveitado
  const aberto = removerDaTela(b, "x.3");
  assert.equal(adicionarNaTela(aberto, "novo.app").banco.layout.paginas[0].length, 12);
});

test("dock: limite de 5, mover tira da tela e voltar devolve", () => {
  let b = comTela(["a.1", "a.2", "a.3", "a.4", "a.5", "a.6"]);
  for (const p of ["a.1", "a.2", "a.3", "a.4", "a.5"]) b = paraODock(b, p).banco;
  assert.equal(b.layout.dock.length, MAX_DOCK);
  assert.deepEqual([...naTela(b)], ["a.6"]);
  const cheio = paraODock(b, "a.6");
  assert.equal(cheio.ok, false);
  assert.equal(cheio.banco, b);
  const volta = tirarDoDock(b, "a.1");
  assert.equal(volta.ok, true);
  assert.ok(naTela(volta.banco).has("a.1"));
  assert.ok(!volta.banco.layout.dock.includes("a.1"));
});

test("pastas: criar, adicionar, tirar, apagar quando esvazia, renomear", () => {
  let b = comTela(["a.1", "a.2", "a.3"]);
  b = criarPasta(b, "a.1", "a.2", "Jogos");
  assert.equal(b.layout.pastas.length, 1);
  assert.deepEqual(b.layout.paginas[0].map((i) => i.tipo), ["pasta", "app"]);
  assert.equal(criarPasta(b, "a.1", "a.3").layout.pastas.length, 1, "app que já está em pasta não vira outra pasta");
  const id = b.layout.pastas[0].id;
  b = adicionarNaPasta(b, id, "a.3");
  assert.deepEqual(b.layout.pastas[0].apps, ["a.1", "a.2", "a.3"]);
  assert.deepEqual(b.layout.paginas[0].map((i) => i.tipo), ["pasta"]);
  b = renomearPasta(b, id, "  Meus jogos  ");
  assert.equal(b.layout.pastas[0].nome, "Meus jogos");
  let r = tirarDaPasta(b, id, "a.2");
  assert.ok(r.ok && naTela(r.banco).has("a.2"));
  r = tirarDaPasta(r.banco, id, "a.1");
  r = tirarDaPasta(r.banco, id, "a.3");
  assert.equal(r.banco.layout.pastas.length, 0, "pasta vazia some");
  assert.ok(!r.banco.layout.paginas.flat().some((i) => i.tipo === "pasta"));
  assert.equal(naTela(r.banco).size, 3);
  assert.equal(tirarDaPasta(r.banco, "nao-existe", "a.1").ok, false);
});

test("remover da tela limpa pasta e apaga pasta que ficou vazia", () => {
  let b = comTela(["a.1", "a.2"]);
  b = criarPasta(b, "a.1", "a.2");
  b = removerDaTela(b, "a.1");
  assert.equal(b.layout.pastas[0].apps.length, 1);
  b = removerDaTela(b, "a.2");
  assert.deepEqual(b.layout.pastas, []);
  assert.deepEqual(b.layout.paginas, [[]]);
});

test("mudar a grade repagina sem perder nada e não faz nada se não couber", () => {
  let b = comTela(lote(18).map((a) => a.pacote));
  b = mudarGrade(b, 3, 4);
  assert.equal(b.layout.paginas.length, 2);
  assert.equal(b.layout.paginas.flat().length, 18);
  b = mudarGrade(b, 6, 7);
  assert.equal(b.layout.paginas.length, 1);
  assert.equal(b.layout.colunas, 6);
  const gigante = comTela(lote(3 * 4 * MAX_PAGINAS).map((a) => a.pacote));
  const apertado = mudarGrade(mudarGrade(gigante, 3, 4), 3, 4);
  assert.equal(apertado.layout.paginas.flat().length, 3 * 4 * MAX_PAGINAS);
  assert.equal(repaginar([], 10).length, 1);
});

test("ocultar tira da tela e do dock; mostrar volta só para a gaveta", () => {
  let b = comTela(["a.1", "a.2"]);
  b = paraODock(b, "a.2").banco;
  b = ocultar(ocultar(b, "a.1"), "a.2");
  assert.deepEqual(b.ocultos, ["a.1", "a.2"]);
  assert.equal(noLayout(b).size, 0);
  b = mostrar(b, "a.1");
  assert.deepEqual(b.ocultos, ["a.2"]);
  assert.equal(noLayout(b).size, 0);
});

test("temas: escolher copia o tema; ajustar vira personalizado e é limpo", () => {
  let b = escolherTema(bancoPadrao(), "brasa");
  assert.equal(b.tema.id, "brasa");
  assert.equal(b.tema.gaveta, "grade");
  b = ajustarTema(b, { cor: "#112233", tamanho: 1000, forma: "circulo" });
  assert.equal(b.tema.id, "personalizado");
  assert.equal(b.tema.cor, "#112233");
  assert.equal(b.tema.tamanho, 72);
  assert.equal(escolherTema(b, "inexistente"), b);
  TEMAS.forEach((t) => assert.deepEqual(limparTema(t), t, `o tema ${t.id} já é válido`));
});

test("backup: exportar e importar dão o mesmo banco; lixo é recusado", () => {
  let b = comTela(["a.1", "a.2", "a.3"]);
  b = criarPasta(b, "a.1", "a.2", "Dupla");
  b = paraODock(b, "a.3").banco;
  b = ajustarTema(b, { cor: "#ff0000" });
  const volta = importar(exportar(b));
  assert.deepEqual(volta, limparBanco(b));
  assert.equal(importar("nao é json"), null);
  assert.equal(importar(JSON.stringify({ formato: "outro-app", banco: {} })), null);
  assert.equal(importar(JSON.stringify({ formato: "vetorial-home" })), null);
  assert.equal(importar("x".repeat(2_000_001)), null);
});

test("ordenar não muda a lista original e desempata pelo pacote", () => {
  const original = [app("b", "Zé"), app("a2", "Ana"), app("a1", "Ana")];
  const o = ordenar(original);
  assert.deepEqual(o.map((a) => a.pacote), ["a1", "a2", "b"]);
  assert.deepEqual(original.map((a) => a.pacote), ["b", "a2", "a1"]);
});
