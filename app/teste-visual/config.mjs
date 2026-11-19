// Telas que o teste visual do V-Space visita: [nome, modo, passos]. O app roda no motor de demonstração (sem celular).
import { readFileSync } from "node:fs";
const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const TERMOS = src("apresentacao.ts").match(/VERSAO_DOS_TERMOS\s*=\s*(\d+)/)[1];

const it = (pacote) => ({ tipo: "app", pacote });
const banco = (extra = {}) => JSON.stringify({
  v: 1, modo: "grade", relogio: true, ocultos: [],
  tema: { id: "vetorial", cor: "#22d3ee", cor2: "#e879f9", fundo: "aurora", fundoCor: "#0b1020", forma: "squircle", tamanho: 56, rotulos: true, gaveta: "lista", botoes: "degrade" },
  layout: {
    colunas: 4, linhas: 5,
    dock: ["com.google.android.dialer", "com.google.android.apps.messaging", "com.android.chrome", "com.google.android.GoogleCamera"],
    pastas: [{ id: "jogos", nome: "Jogos", apps: ["demo.jogo1", "demo.jogo2"] }, { id: "dinheiro", nome: "Dinheiro", apps: ["demo.banco", "demo.carteira", "demo.pagar"] }],
    paginas: [
      [it("com.tonimarques.sextafeira"), it("tech.vetorial.vindex"), it("tech.vetorial.vortex"), it("tech.vetorial.velox"), it("tech.vetorial.vyntem"), it("tech.vetorial.voxix"), it("tech.vetorial.drive"), { tipo: "pasta", id: "jogos" }, { tipo: "pasta", id: "dinheiro" }, it("demo.galeria"), it("demo.relogio"), it("demo.calculadora"), it("demo.agenda"), it("demo.contatos"), it("demo.config"), it("demo.loja"), it("demo.video"), it("demo.zap"), it("demo.insta"), it("demo.mapas")],
      [it("demo.email"), it("demo.fotos"), it("demo.musica"), it("demo.gov")],
    ],
  },
  ...extra,
});
const comWidgets = JSON.stringify({ ...JSON.parse(banco()), widgets: [{ id: "w1", tipo: "relogio-analogico" }, { id: "w2", tipo: "clima", cidade: "Porto Alegre, Rio Grande do Sul", lat: -30.033, lon: -51.23 }, { id: "w3", tipo: "bateria" }, { id: "w4", tipo: "agenda" }] });
const grande = JSON.stringify({ ...JSON.parse(banco()), tema: { ...JSON.parse(banco()).tema, tamanho: 72, rotulos: true }, layout: { ...JSON.parse(banco()).layout, colunas: 6, linhas: 7, paginas: [JSON.parse(banco()).layout.paginas.flat()] } });
const redondo = JSON.stringify({ ...JSON.parse(banco()), tema: { ...JSON.parse(banco()).tema, forma: "circulo", rotulos: false, gaveta: "grade", fundo: "neon", cor: "#fb923c", cor2: "#f43f5e", fundoCor: "#14080a" } });

const FAVS = ["com.google.android.dialer", "com.google.android.apps.messaging", "com.android.chrome", "tech.vetorial.vindex", "com.tonimarques.sextafeira", "demo.email", "demo.fotos"];
const cats = (extra = {}) => JSON.stringify({ ...JSON.parse(banco()), modo: "categorias", favoritos: FAVS, widgets: [{ id: "w1", tipo: "relogio-digital" }, { id: "w2", tipo: "bateria" }], ...extra });
const entrar = async (p, nome) => { await p.getByRole("button", { name: new RegExp(`^${nome},`) }).click(); await p.waitForTimeout(250); };

const base = { "vhome.tour": "1", "vhome.termos": TERMOS, "vhome.novidades.vistas": "9999" };
const livre = async (p) => { await p.waitForTimeout(150); };
const abrirGaveta = async (p) => { await p.getByRole("button", { name: "Todos os apps" }).click(); await p.getByRole("dialog", { name: "Todos os apps" }).waitFor(); };
const abrirEstudio = async (p) => { await p.getByRole("button", { name: "Abrir o Estúdio" }).click(); await p.getByRole("dialog", { name: "Estúdio" }).waitFor(); };
const aba = async (p, nome) => { await p.getByRole("tab", { name: nome, exact: true }).click(); await p.waitForTimeout(150); };
const quantos = (p) => p.locator(".pagina").first().locator(".app-cel").count();

export default {
  porta: 4183,
  espera: 700,
  guardado: (modo) => ({
    primeira: {},
    atualizou: { ...base, "vhome.novidades.vistas": "0", "vhome.banco": banco() },
    normal: base,
    completo: { ...base, "vhome.banco": banco() },
    grande: { ...base, "vhome.banco": grande },
    widgets: { ...base, "vhome.banco": comWidgets },
    redondo: { ...base, "vhome.banco": redondo },
    categorias: { ...base, "vhome.banco": cats() },
    categoriasBloqueado: { ...base, "vhome.banco": cats({ bloqueado: true }) },
    categoriasVazio: { ...base, "vhome.banco": cats({ favoritos: [], widgets: [] }) },
  }[modo] ?? base),
  respostas: {},
  cenarios: [
    ["primeira-abertura", "primeira", async (p) => { await p.getByText("Bem-vindo ao V-Space").waitFor(); }],
    ["apresentacao-permissoes", "primeira", async (p) => { for (let i = 0; i < 7; i++) await p.getByRole("button", { name: /Próximo|Continuar/ }).click(); await p.getByText("Lista de apps instalados").waitFor(); }],
    ["apresentacao-termos", "primeira", async (p) => { for (let i = 0; i < 7; i++) await p.getByRole("button", { name: /Próximo|Continuar/ }).click(); await p.getByRole("button", { name: "Continuar" }).click(); await p.getByRole("heading", { name: "Termos de uso" }).waitFor(); }],
    ["o-que-ha-de-novo", "atualizou", async (p) => { await p.getByText("O que há de novo").first().waitFor(); }],
    ["inicio-primeira-vez", "normal", livre],
    ["inicio", "completo", livre],
    ["inicio-pagina-2", "completo", async (p) => { await p.getByRole("tab", { name: "Ir para a página 2" }).click(); await p.waitForTimeout(500); }],
    ["inicio-grade-grande", "grande", livre],
    ["inicio-redondo", "redondo", livre],
    ["menu-app", "completo", async (p) => { await p.getByRole("button", { name: "Vindex", exact: true }).first().click({ button: "right" }); await p.getByRole("dialog", { name: "Vindex" }).waitFor(); }],
    ["menu-dock", "completo", async (p) => { await p.getByRole("button", { name: "Chrome" }).click({ button: "right" }); await p.getByRole("dialog", { name: "Chrome" }).waitFor(); }],
    ["menu-desinstalar", "completo", async (p) => {
      await p.getByRole("button", { name: "Galeria", exact: true }).first().click({ button: "right" });
      await p.getByRole("button", { name: "Desinstalar" }).click(); await p.getByText("O Android vai pedir a sua confirmação").waitFor();
    }],
    ["agrupar", "completo", async (p) => {
      await p.getByRole("button", { name: "Galeria", exact: true }).first().click({ button: "right" });
      await p.getByRole("button", { name: "Agrupar em pasta…" }).click(); await p.getByRole("dialog", { name: /Agrupar Galeria/ }).waitFor();
    }],
    ["pasta-aberta", "completo", async (p) => { await p.getByRole("button", { name: "Pasta Dinheiro" }).click(); await p.getByRole("dialog", { name: /Pasta Dinheiro/ }).waitFor(); }],
    ["remover-da-tela", "completo", async (p) => {
      const antes = await quantos(p);
      await p.getByRole("button", { name: "Galeria", exact: true }).first().click({ button: "right" });
      await p.getByRole("button", { name: "Remover da tela inicial" }).click(); await p.waitForTimeout(250);
      if ((await quantos(p)) !== antes - 1) throw new Error("o app não saiu da tela inicial");
    }],
    ["colocar-no-dock", "completo", async (p) => {
      // o dock começa com 4: cabe mais um (o limite é 5)
      await p.getByRole("button", { name: "Galeria", exact: true }).first().click({ button: "right" });
      await p.getByRole("button", { name: "Colocar no dock" }).click(); await p.waitForTimeout(250);
      if ((await p.locator(".dock .dock-cel").count()) !== 6) throw new Error("o app não foi para o dock");
    }],
    ["gaveta", "completo", abrirGaveta],
    ["gaveta-grade", "redondo", abrirGaveta],
    ["gaveta-letra", "completo", async (p) => { await abrirGaveta(p); const l = p.getByRole("button", { name: "Ir para a letra V" }); if (await l.isVisible().catch(() => false)) await l.click(); await p.waitForTimeout(400); }],
    ["gaveta-busca", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("textbox", { name: "Pesquisar apps" }).fill("cam"); await p.waitForTimeout(200); await p.getByRole("dialog", { name: "Todos os apps" }).getByRole("button", { name: "Câmera" }).waitFor(); }],
    ["gaveta-busca-vazia", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("textbox", { name: "Pesquisar apps" }).fill("zzzz"); await p.getByText(/Nenhum app com/).waitFor(); }],
    ["gaveta-pela-busca", "completo", async (p) => { const b = p.getByRole("button", { name: "Pesquisar apps" }); if (!(await b.isVisible())) throw new Error("PULAR"); await b.click(); await p.getByRole("dialog", { name: "Todos os apps" }).waitFor(); }],
    ["estudio-temas", "completo", async (p) => { await abrirEstudio(p); }],
    ["estudio-tema-brasa", "completo", async (p) => { await abrirEstudio(p); await p.getByRole("button", { name: /Brasa/ }).click(); await p.waitForTimeout(250); }],
    ["menu-tela-vazia", "completo", async (p) => { await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("dialog", { name: "Tela inicial" }).waitFor(); }],
    ["estudio-papel", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); }],
    ["estudio-papel-pronto", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Papel de parede");
      await p.getByRole("button", { name: "Papel Oceano" }).click(); await aba(p, "Ajustes"); await p.getByRole("slider", { name: "Desfoque" }).waitFor();
      await p.getByRole("slider", { name: "Desfoque" }).fill("8"); await p.waitForTimeout(250);
    }],
    ["inicio-widgets", "widgets", async (p) => { const f = p.getByRole("region", { name: "Widgets" }); if (!(await f.isVisible().catch(() => false))) { await p.waitForTimeout(300); if (!(await f.isVisible().catch(() => false))) throw new Error("PULAR"); } await p.waitForTimeout(400); }],
    ["widgets-agenda", "widgets", async (p) => { const f = p.getByRole("region", { name: "Widgets" }); await p.waitForTimeout(300); if (!(await f.isVisible().catch(() => false))) throw new Error("PULAR"); await f.evaluate((e) => { e.scrollLeft = e.scrollWidth; }); await p.getByText("Reunião de equipe").waitFor(); }],
    ["estudio-widgets", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Widgets"); }],
    ["menu-criar-pasta", "completo", async (p) => { await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("button", { name: "Criar pasta" }).click(); await p.getByRole("dialog", { name: "Criar pasta" }).waitFor(); }],
    ["criar-pasta-feita", "completo", async (p) => {
      await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("button", { name: "Criar pasta" }).click();
      const d = p.getByRole("dialog", { name: "Criar pasta" }); await d.getByRole("button", { name: "Galeria" }).click(); await d.getByRole("button", { name: "Relógio" }).click();
      await d.getByRole("button", { name: "Criar pasta" }).click(); await p.getByRole("button", { name: "Pasta Pasta" }).waitFor();
    }],
    ["estudio-widgets-adicionar", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Widgets");
      await p.getByRole("button", { name: "Bateria" }).click(); await p.getByRole("button", { name: "Relógio analógico" }).click(); await aba(p, "Gerenciar");
      if ((await p.getByRole("button", { name: /^Remover/ }).count()) !== 2) throw new Error("os widgets não foram adicionados");
    }],
    ["estudio-icones", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Ícones"); }],
    ["estudio-inicio", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); }],
    ["estudio-gaveta", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); }],
    ["estudio-backup", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Backup"); await p.getByRole("button", { name: "Salvar backup" }).waitFor(); }],
    ["estudio-launcher", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Launcher"); await p.getByText("O V-Space é o launcher padrão").waitFor(); }],
    ["estudio-gestos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await p.getByRole("switch", { name: "Bloquear layout" }).waitFor(); }],
    ["estudio-cenas", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Cenas"); }],
    ["estudio-cena-aplicada", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Cenas"); await p.getByRole("button", { name: "Cena Mar calmo" }).click(); await p.waitForTimeout(300); }],
    ["estudio-cores", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Cores"); }],
    ["estudio-superficie", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Superfície"); await p.getByRole("slider", { name: "Cantos" }).fill("30"); await p.waitForTimeout(200); }],
    ["estudio-dock", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Dock"); await p.getByRole("button", { name: "Sólido" }).click(); await p.waitForTimeout(200); }],
    ["estudio-pastas", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Pastas"); await p.getByRole("button", { name: "Contorno" }).click(); await p.waitForTimeout(200); }],
    ["estudio-pacote-icones", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Ícones"); await p.getByRole("button", { name: "Monocromático" }).click(); await p.waitForTimeout(200); }],
    ["estudio-ocultos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); await aba(p, "Ocultos"); }],
    ["estudio-backup-refazer", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Backup"); await p.getByRole("button", { name: "Refazer a tela inicial" }).click(); await p.getByText(/Isso refaz a tela inicial/).waitFor(); }],
    ["estudio-sobre", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Sobre"); }],
    ["sobre-apresentacao", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Sobre"); await p.getByRole("button", { name: "Rever a apresentação" }).click(); await p.getByText("Bem-vindo ao V-Space").waitFor(); }],
    ["sobre-termos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Sobre"); await p.getByRole("button", { name: "Termos de uso" }).click(); await p.getByText("1. O que é o V-Space").waitFor(); }],
    ["categorias-inicio", "categorias", livre],
    ["categorias-inicio-vazio", "categoriasVazio", livre],
    ["categorias-pagina", "categorias", async (p) => { await entrar(p, "Social e notícias"); await p.getByText(/\d+ apps?$/).first().waitFor(); }],
    ["categorias-pagina-longa", "categorias", async (p) => { await entrar(p, "Ferramentas e mais"); await p.getByText(/\d+ apps?$/).first().waitFor(); }],
    ["categorias-bloqueado", "categoriasBloqueado", async (p) => { await entrar(p, "Jogos"); const n = await p.getByRole("button", { name: /^Adicionar apps a/ }).count(); if (n) throw new Error("layout bloqueado não deveria mostrar Adiciona"); }],
    ["categorias-menu-app", "categorias", async (p) => { await entrar(p, "Jogos"); await p.getByRole("button", { name: "Corrida Neon" }).click({ button: "right" }); await p.getByRole("dialog", { name: "Corrida Neon" }).waitFor(); await p.getByRole("button", { name: /favoritos/ }).waitFor(); }],
    ["categorias-mover", "categorias", async (p) => { await entrar(p, "Jogos"); await p.getByRole("button", { name: "Corrida Neon" }).click({ button: "right" }); await p.getByRole("button", { name: /Mover para categoria/ }).click(); await p.getByRole("dialog", { name: /Mover Corrida Neon/ }).waitFor(); }],
    ["categorias-mover-feito", "categorias", async (p) => {
      await entrar(p, "Jogos"); await p.getByRole("button", { name: "Corrida Neon" }).click({ button: "right" }); await p.getByRole("button", { name: /Mover para categoria/ }).click();
      await p.getByRole("dialog", { name: /Mover/ }).getByRole("button", { name: /Estudos/ }).click(); await p.waitForTimeout(250);
      if (await p.getByRole("button", { name: "Corrida Neon" }).count()) throw new Error("o app devia ter saído de Jogos");
      await entrar(p, "Estudos"); await p.getByRole("button", { name: "Corrida Neon" }).waitFor();
    }],
    ["categorias-adiciona", "categorias", async (p) => { await entrar(p, "Jogos"); await p.getByRole("button", { name: /^Adicionar apps a/ }).click(); await p.getByRole("dialog", { name: /Adicionar a Jogos/ }).waitFor(); }],
    ["categorias-favoritos", "categorias", async (p) => { await p.getByRole("button", { name: "Adicionar favoritos" }).click(); await p.getByRole("dialog", { name: "Favoritos" }).waitFor(); }],
    ["categorias-nova", "categorias", async (p) => { await p.getByRole("button", { name: "Nova categoria" }).click(); await p.getByRole("dialog", { name: "Nova categoria" }).waitFor(); await p.getByPlaceholder("Ex.: Trabalho").fill("Trabalho"); await p.waitForTimeout(150); }],
    ["categorias-nova-criada", "categorias", async (p) => { await p.getByRole("button", { name: "Nova categoria" }).click(); await p.getByPlaceholder("Ex.: Trabalho").fill("Trabalho"); await p.getByRole("button", { name: "Salvar" }).click(); await p.waitForTimeout(250); await p.getByRole("button", { name: /^Trabalho, 0 apps/ }).waitFor(); }],
    ["organizar-inicio", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("dialog", { name: "Organizar com IA" }).waitFor(); }],
    ["organizar-previa", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("button", { name: "Organizar agora" }).click(); await p.getByText(/mudam? de categoria/).waitFor({ timeout: 5000 }); }],
    ["organizar-feito", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("button", { name: "Organizar agora" }).click(); await p.getByRole("button", { name: "Aplicar" }).click(); await p.getByText(/Pronto!/).waitFor(); }],
    ["estudio-categorias-modo", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Tela inicial"); }],
    ["estudio-categorias-lista", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Suas categorias"); await p.getByRole("button", { name: "Editar Jogos" }).waitFor(); }],
    ["estudio-categorias-editar", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Suas categorias"); await p.getByRole("button", { name: "Editar Jogos" }).click(); await p.getByRole("dialog", { name: "Editar categoria" }).waitFor(); }],
    ["estudio-grade-mais-colunas", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Início");
      await p.getByRole("button", { name: "Mais colunas" }).click(); await p.getByRole("button", { name: "Mais colunas" }).click(); await p.waitForTimeout(200);
      await p.getByRole("button", { name: "Fechar" }).first().click(); await p.waitForTimeout(250);
      if ((await p.locator(".pagina").first().evaluate((e) => getComputedStyle(e).getPropertyValue("--cols").trim())) !== "6") throw new Error("a grade não passou para 6 colunas");
    }],
  ],
};
