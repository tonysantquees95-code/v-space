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

const SESSAO = JSON.stringify({ token: "demo", email: "demo@vetorial.tech", nome: "Demo" });
const base = { "vspace.sessao": SESSAO, "vhome.tour": "1", "vhome.termos": TERMOS, "vhome.novidades.vistas": "9999" };
const CLIMA_CACHE = JSON.stringify({ chave: "-30.033,-51.23", quando: Date.now(), clima: { temp: 28, codigo: 0, max: 29, min: 20, vento: 10, dia: true } });
const _h = Array.from({ length: 24 }, (_, i) => `2026-11-19T${String(i).padStart(2, "0")}:00`);
const PREV_CACHE = JSON.stringify({ chave: "-30.033,-51.23", quando: Date.now(), dados: { hourly: { time: [..._h, ..._h.map((x) => x.replace("19T", "20T"))], temperature_2m: Array(48).fill(27), weather_code: Array(48).fill(1) }, daily: { time: ["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24"], temperature_2m_max: [29, 28, 29, 24, 27, 26], temperature_2m_min: [20, 20, 20, 19, 17, 18], weather_code: [0, 61, 1, 3, 0, 2] } } });
const W = (tipo, i, x, y, w, h, extra = {}) => ({ id: `n${i}`, tipo, x, y, w, h, estilo: "vidro", ...extra });
const CLIMA_W = { id: "c1", tipo: "clima", x: 0, y: 0, w: 4, h: 2, estilo: "vidro", cidade: "Porto Alegre", lat: -30.033, lon: -51.23 };
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
    widgetsLivres: { ...base, "vhome.banco": cats({ widgets: [{ id: "w1", tipo: "relogio-analogico", x: 0, y: 0, w: 2, h: 2, estilo: "fosco" }, { id: "w2", tipo: "bateria", x: 2, y: 0, w: 2, h: 2, estilo: "transparente" }, { id: "w3", tipo: "agenda", x: 0, y: 2, w: 4, h: 2, estilo: "solido" }] }) },
    redondo: { ...base, "vhome.banco": redondo },
    semConta: { "vhome.tour": "1", "vhome.termos": TERMOS, "vhome.novidades.vistas": "9999" },
    categorias: { ...base, "vhome.banco": cats() },
    categoriasBloqueado: { ...base, "vhome.banco": cats({ bloqueado: true }) },
    widgetsNovos: { ...base, "vhome.banco": cats({ widgets: [
      { id: "w1", tipo: "calendario", x: 0, y: 0, w: 4, h: 4, estilo: "vidro" }, { id: "w2", tipo: "notas", x: 0, y: 4, w: 2, h: 2, estilo: "fosco", texto: "Comprar pão\nLigar para o dentista" },
      { id: "w3", tipo: "contagem", x: 2, y: 4, w: 2, h: 2, estilo: "solido", titulo: "Viagem", data: "2027-01-10" }, { id: "w4", tipo: "frase", x: 0, y: 6, w: 4, h: 2, estilo: "vidro" },
      { id: "w5", tipo: "pomodoro", x: 0, y: 8, w: 2, h: 2, estilo: "fosco" }, { id: "w6", tipo: "mundo", x: 0, y: 10, w: 4, h: 2, estilo: "transparente" }] }) },
    catalogoRelogios: { ...base, "vhome.banco": cats({ widgets: [W("relogio-alto", 1, 0, 0, 4, 4), W("relogio-compacto", 2, 0, 4, 2, 1), W("relogio-empilhado", 3, 2, 4, 2, 2), W("relogio-vidro", 4, 0, 6, 4, 3), W("relogio-editorial", 5, 0, 9, 4, 2), W("relogio-flip", 6, 0, 11, 4, 2), W("relogio-largo", 7, 0, 13, 4, 2)] }) },
    catalogoInfo: { ...base, "vhome.banco": cats({ widgets: [CLIMA_W, W("relogio-grande", 1, 0, 2, 4, 2), W("relogio-agenda", 2, 0, 4, 4, 2), W("relogio-clima", 3, 0, 6, 4, 1), W("relogio-progresso", 4, 0, 7, 4, 2), W("saudacao", 5, 0, 9, 4, 2), W("relance", 6, 0, 11, 4, 1), W("pesquisa", 7, 0, 12, 4, 1), W("mes-dia", 8, 0, 13, 4, 2), W("semana", 9, 0, 15, 4, 2), W("proximos", 10, 0, 17, 4, 2), W("saude-bateria", 11, 0, 19, 2, 2), W("linha-status", 12, 2, 19, 2, 1)] }), "vhome.clima": CLIMA_CACHE, "vhome.previsao": PREV_CACHE },
    catalogoTempo: { ...base, "vhome.banco": cats({ widgets: [CLIMA_W, W("tempo", 1, 0, 2, 2, 2), W("orbita", 2, 2, 2, 2, 2), W("tipo-clima", 3, 0, 4, 4, 2), W("previsao", 4, 0, 6, 4, 2), W("por-hora", 5, 0, 8, 4, 1), W("relogio-vidro", 6, 0, 9, 4, 3)] }), "vhome.clima": CLIMA_CACHE, "vhome.previsao": PREV_CACHE },
    catalogoMusica: { ...base, "vhome.banco": cats({ widgets: [W("musica-capa", 1, 0, 0, 2, 2), W("musica-brilho", 2, 2, 0, 2, 2), W("musica-compacto", 3, 0, 2, 4, 1), W("musica-disco", 4, 0, 3, 4, 2), W("musica-tocando", 5, 0, 5, 4, 2)] }) },
    widgetsExterno: { ...base, "vhome.banco": cats({ widgets: [W("relogio-compacto", 1, 0, 0, 2, 1), { id: "x1", tipo: "externo", x: 0, y: 1, w: 4, h: 3, estilo: "vidro", provider: "com.google.android.calendar/Mes", appId: 101, titulo: "Agenda: Visualização por mês" }] }) },
    categoriasVazio: { ...base, "vhome.banco": cats({ favoritos: [], widgets: [] }) },
  }[modo] ?? base),
  respostas: {},
  cenarios: [
    ["primeira-abertura", "primeira", async (p) => { await p.getByText("Bem-vindo ao V-Space").waitFor(); }],
    ["apresentacao-permissoes", "primeira", async (p) => { for (let i = 0; i < 14 && !(await p.getByText("Lista de apps instalados").isVisible()); i++) await p.getByRole("button", { name: /Próximo|Continuar/ }).click(); await p.getByText("Lista de apps instalados").waitFor(); }],
    ["apresentacao-termos", "primeira", async (p) => { for (let i = 0; i < 14 && !(await p.getByText("Lista de apps instalados").isVisible()); i++) await p.getByRole("button", { name: /Próximo|Continuar/ }).click(); await p.getByRole("button", { name: "Continuar" }).click(); await p.getByRole("heading", { name: "Termos de uso" }).waitFor(); }],
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
    ["gaveta-busca", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("button", { name: "Pesquisar", exact: true }).click(); await p.getByRole("textbox", { name: "Pesquise qualquer coisa" }).fill("cam"); await p.getByRole("dialog", { name: "Pesquisar" }).getByText("Melhor resultado").waitFor(); }],
    ["gaveta-busca-vazia", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("button", { name: "Pesquisar", exact: true }).click(); await p.getByRole("textbox", { name: "Pesquise qualquer coisa" }).fill("zzzz"); await p.getByRole("tab", { name: /Aplicativos/ }).waitFor(); await p.getByRole("tab", { name: /Aplicativos/ }).click(); await p.getByText(/Nenhum app com/).waitFor(); }],
    ["busca-config", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("button", { name: "Pesquisar", exact: true }).click(); await p.getByRole("textbox", { name: "Pesquise qualquer coisa" }).fill("colunas"); await p.getByRole("dialog", { name: "Pesquisar" }).getByText("Colunas e linhas").first().waitFor(); }],
    ["busca-inicial", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("button", { name: "Pesquisar", exact: true }).click(); await p.getByRole("textbox", { name: "Pesquise qualquer coisa" }).waitFor(); }],
    ["busca-contatos", "completo", async (p) => { await abrirGaveta(p); await p.getByRole("button", { name: "Pesquisar", exact: true }).click(); await p.getByRole("textbox", { name: "Pesquise qualquer coisa" }).fill("mar"); await p.getByRole("button", { name: "Procurar também nos contatos" }).click(); await p.getByText("Maria Souza").waitFor(); }],
    ["gaveta-pela-busca", "completo", async (p) => { const b = p.getByRole("button", { name: "Pesquisar apps" }); if (!(await b.isVisible())) throw new Error("PULAR"); await b.click(); await p.getByRole("dialog", { name: "Pesquisar" }).waitFor(); }],
    ["estudio-temas", "completo", async (p) => { await abrirEstudio(p); }],
    ["estudio-tema-brasa", "completo", async (p) => { await abrirEstudio(p); await p.getByRole("button", { name: /Brasa/ }).click(); await p.waitForTimeout(250); }],
    ["menu-tela-vazia", "completo", async (p) => { await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("dialog", { name: "Tela inicial" }).waitFor(); }],
    ["estudio-papel", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); }],
    ["estudio-papel-pronto", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Papel de parede");
      await p.getByRole("button", { name: "Papel Oceano" }).click(); await aba(p, "Editor"); await p.getByRole("slider", { name: "Desfoque" }).waitFor();
      await p.getByRole("slider", { name: "Desfoque" }).fill("8"); await p.waitForTimeout(250);
    }],
    ["estudio-papel-luz", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); await aba(p, "Luz do dia"); await p.getByRole("group", { name: "Luz do dia" }).waitFor(); }],
    ["estudio-papel-favoritos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); await p.getByRole("button", { name: "Papel Oceano" }).click(); await aba(p, "Favoritos"); await p.getByRole("button", { name: "Guardar o papel atual" }).click(); await p.getByRole("button", { name: "Usar favorito 1" }).waitFor(); }],
    ["estudio-papel-fontes", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); await aba(p, "Fontes"); await p.getByText("Aplicar no Android").waitFor(); }],
    ["estudio-papel-geral", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Papel de parede"); await aba(p, "Geral"); await p.getByRole("switch", { name: "Papel de parede diário" }).waitFor(); }],
    ["estudio-apps-disposicao", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); await p.getByText("Ordem dos apps").waitFor(); }],
    ["estudio-apps-geral", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); await aba(p, "Geral"); await p.getByRole("switch", { name: "Apps novos" }).waitFor(); }],
    ["estudio-apps-icones", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); await aba(p, "Ícones"); await p.getByText("Ícone de cada app").waitFor(); }],
    ["inicio-widgets", "widgets", async (p) => { const f = p.getByRole("region", { name: "Widgets" }); if (!(await f.isVisible().catch(() => false))) { await p.waitForTimeout(300); if (!(await f.isVisible().catch(() => false))) throw new Error("PULAR"); } await p.waitForTimeout(400); }],
    ["widgets-agenda", "widgets", async (p) => { await p.waitForTimeout(300); if (!(await p.getByText("Reunião de equipe").isVisible().catch(() => false))) throw new Error("PULAR"); }],
    ["widgets-novos", "widgetsNovos", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.getByRole("article", { name: "Calendário do mês" }).waitFor(); await p.getByRole("article", { name: "Horas pelo mundo" }).waitFor(); await p.waitForTimeout(300); }],
    ["widgets-pomodoro", "widgetsNovos", async (p) => { const a = p.getByRole("article", { name: "Foco (Pomodoro)" }); await a.scrollIntoViewIfNeeded(); await a.getByRole("button", { name: "Iniciar" }).click(); await a.getByRole("button", { name: "Pausar" }).waitFor(); }],
    ["widgets-editar-nota", "widgetsNovos", async (p) => { const a = p.getByRole("article", { name: "Notas" }); await a.scrollIntoViewIfNeeded(); const b = await a.boundingBox(); await p.mouse.move(b.x + 20, b.y + 20); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); const d = p.getByRole("dialog", { name: "Editar Notas" }); await d.getByLabel("Texto da nota").fill("Olá mundo"); await a.getByText("Olá mundo").waitFor(); }],
    ["atalhos-lado", "widgetsLivres", async (p) => { if (p.viewportSize().height <= 560) throw new Error("PULAR"); await p.getByRole("navigation", { name: "Atalhos do aparelho" }).waitFor(); const a = await p.getByRole("navigation", { name: "Atalhos do aparelho" }).boundingBox(); const t = await p.getByRole("navigation", { name: "Categorias" }).boundingBox(); if (a.y + a.height > t.y + 2 || a.x < p.viewportSize().width / 2) throw new Error("os atalhos deveriam ficar à direita, acima das categorias"); const f = await p.getByRole("button", { name: "Favoritos e widgets" }).boundingBox(); const topo = await p.evaluate(() => { const n = document.querySelector(".trilho"); return n ? n.scrollTop + "/" + n.scrollHeight + "/" + n.clientHeight : "sem trilho"; }); if (process.env.MEDIR) await p.screenshot({ path: "/tmp/rail.png", clip: { x: p.viewportSize().width - 70, y: 60, width: 70, height: p.viewportSize().height - 60 } }); if (f.y < t.y - 1) throw new Error("o trilho começou rolado: Favoritos fora da vista (" + f.y + " < " + t.y + ")"); }],
    ["gaveta-arrastar-fecha", "completo", async (p) => { await p.getByRole("button", { name: "Todos os apps" }).click(); const g = p.getByRole("dialog", { name: "Todos os apps" }); await g.waitFor(); const c = await g.boundingBox(); await p.touchscreen.tap(c.x + 5, c.y + 5).catch(() => undefined); await g.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 100, clientY: 200, pageX: 100, pageY: 200 }], changedTouches: [{ identifier: 1, clientX: 100, clientY: 200 }] }); await g.dispatchEvent("touchend", { touches: [], changedTouches: [{ identifier: 1, clientX: 100, clientY: 340 }] }); await g.waitFor({ state: "detached" }); }],
    ["catalogo-relogios", "catalogoRelogios", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.waitForTimeout(500); const r = await p.evaluate(() => { const e = document.querySelector(".widgets-area"); const ruins = []; for (const w of document.querySelectorAll(".widgets-area .widget")) { if (w.scrollWidth > w.clientWidth + 2 || w.scrollHeight > w.clientHeight + 2) ruins.push(w.getAttribute("aria-label") + " " + w.scrollWidth + "x" + w.scrollHeight + " em " + w.clientWidth + "x" + w.clientHeight); } return ruins; }); if (process.env.MEDIR) await p.locator(".widgets-area").screenshot({ path: `/tmp/area-${Date.now()}.png` }); if (r.length) throw new Error("conteúdo maior que o widget: " + r.join("; ")); }],
    ["catalogo-info", "catalogoInfo", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.waitForTimeout(500); const r = await p.evaluate(() => { const e = document.querySelector(".widgets-area"); const ruins = []; for (const w of document.querySelectorAll(".widgets-area .widget")) { if (w.scrollWidth > w.clientWidth + 2 || w.scrollHeight > w.clientHeight + 2) ruins.push(w.getAttribute("aria-label") + " " + w.scrollWidth + "x" + w.scrollHeight + " em " + w.clientWidth + "x" + w.clientHeight); } return ruins; }); if (process.env.MEDIR) await p.locator(".widgets-area").screenshot({ path: `/tmp/area-${Date.now()}.png` }); if (r.length) throw new Error("conteúdo maior que o widget: " + r.join("; ")); }],
    ["catalogo-tempo", "catalogoTempo", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.waitForTimeout(500); const r = await p.evaluate(() => { const e = document.querySelector(".widgets-area"); const ruins = []; for (const w of document.querySelectorAll(".widgets-area .widget")) { if (w.scrollWidth > w.clientWidth + 2 || w.scrollHeight > w.clientHeight + 2) ruins.push(w.getAttribute("aria-label") + " " + w.scrollWidth + "x" + w.scrollHeight + " em " + w.clientWidth + "x" + w.clientHeight); } return ruins; }); if (process.env.MEDIR) await p.locator(".widgets-area").screenshot({ path: `/tmp/area-${Date.now()}.png` }); if (r.length) throw new Error("conteúdo maior que o widget: " + r.join("; ")); }],
    ["catalogo-musica", "catalogoMusica", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.waitForTimeout(500); const r = await p.evaluate(() => { const e = document.querySelector(".widgets-area"); const ruins = []; for (const w of document.querySelectorAll(".widgets-area .widget")) { if (w.scrollWidth > w.clientWidth + 2 || w.scrollHeight > w.clientHeight + 2) ruins.push(w.getAttribute("aria-label") + " " + w.scrollWidth + "x" + w.scrollHeight + " em " + w.clientWidth + "x" + w.clientHeight); } return ruins; }); if (process.env.MEDIR) await p.locator(".widgets-area").screenshot({ path: `/tmp/area-${Date.now()}.png` }); if (r.length) throw new Error("conteúdo maior que o widget: " + r.join("; ")); }],
    ["estudio-widgets-externos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Widgets"); await p.getByRole("img", { name: /Prévia de Compromissos no dia/ }).waitFor(); await p.getByRole("button", { name: "Adicionar Agenda: Compromissos no dia" }).click(); await aba(p, "Gerenciar"); await p.getByText(/Agenda: Compromissos no dia/).last().waitFor(); }],
    ["widget-externo-reserva", "widgetsExterno", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.getByText("Agenda: Visualização por mês").waitFor(); }],
    ["widgets-livres", "widgetsLivres", async (p) => { await p.getByRole("region", { name: "Widgets" }).waitFor(); await p.waitForTimeout(400); }],
    ["player-tocando", "widgetsLivres", async (p) => { await p.getByRole("region", { name: "Tocando agora" }).waitFor(); await p.getByText("From Now On").waitFor(); await p.getByRole("button", { name: "Pausar" }).click(); await p.getByRole("button", { name: "Tocar" }).waitFor({ timeout: 6000 }); }],
    ["atalhos-wifi", "widgetsLivres", async (p) => { if (p.viewportSize().height <= 560) throw new Error("PULAR"); await p.getByRole("button", { name: /Wi-Fi conectado/ }).click(); await p.getByText(/ajustes de wifi/).waitFor(); }],
    ["estudio-atalhos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Atalhos"); await p.getByRole("switch", { name: "Mostrar o player de música" }).waitFor(); }],
    ["estudio-seguro", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Espaço seguro"); await p.getByRole("button", { name: "Abrir o Espaço seguro" }).waitFor(); }],
    ["espaco-seguro", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Espaço seguro"); await p.getByRole("button", { name: "Abrir o Espaço seguro" }).click(); await p.getByRole("dialog", { name: "Espaço seguro" }).waitFor(); }],
    ["estudio-previa-volta", "completo", async (p) => { await abrirEstudio(p); if (!(await p.getByRole("button", { name: "Voltar para a tela inicial" }).isVisible())) throw new Error("PULAR"); await p.getByRole("button", { name: "Voltar para a tela inicial" }).click(); await p.getByRole("dialog", { name: "Estúdio" }).waitFor({ state: "detached" }); }],
    ["widgets-editar", "widgetsLivres", async (p) => { const a = p.getByRole("article", { name: "Bateria" }); const b = await a.boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.getByRole("dialog", { name: "Editar Bateria" }).waitFor(); }],
    ["widgets-editar-estilo", "widgetsLivres", async (p) => { const a = p.getByRole("article", { name: "Bateria" }); const b = await a.boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); const d = p.getByRole("dialog", { name: "Editar Bateria" }); await d.getByRole("button", { name: "Sólido" }).click(); await d.getByRole("button", { name: "Mais baixo" }).click(); await d.getByText("2×1").waitFor(); }],
    ["widgets-mover", "widgetsLivres", async (p) => { if (p.viewportSize().height < 560) throw new Error("PULAR"); const a = p.getByRole("article", { name: "Relógio analógico" }); const b = await a.boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); const dest = p.getByRole("dialog", { name: "Editar Relógio analógico" }); await dest.waitFor(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2 + 150, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200); const n = await a.boundingBox(); if (Math.abs(n.y - b.y) < 20) throw new Error("o widget não se moveu"); }],
    ["estudio-widgets", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Widgets"); await p.getByRole("img", { name: /Prévia de Agenda/ }).waitFor(); }],
    ["menu-criar-pasta", "completo", async (p) => { await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("button", { name: "Criar pasta" }).click(); await p.getByRole("dialog", { name: "Criar pasta" }).waitFor(); }],
    ["criar-pasta-feita", "completo", async (p) => {
      await p.locator(".pagina").first().click({ button: "right", position: { x: 4, y: 4 } }); await p.getByRole("button", { name: "Criar pasta" }).click();
      const d = p.getByRole("dialog", { name: "Criar pasta" }); await d.getByRole("button", { name: "Galeria" }).click(); await d.getByRole("button", { name: "Relógio" }).click();
      await d.getByRole("button", { name: "Criar pasta" }).click(); await p.getByRole("button", { name: "Pasta Pasta" }).waitFor();
    }],
    ["estudio-widgets-adicionar", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Widgets");
      await p.getByRole("button", { name: "Adicionar bateria" }).click(); await p.getByRole("button", { name: "Adicionar relógio analógico", exact: true }).click(); await aba(p, "Gerenciar");
      if ((await p.getByRole("button", { name: /^Remover/ }).count()) !== 2) throw new Error("os widgets não foram adicionados");
    }],
    ["estudio-icones", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); await aba(p, "Ícones"); }],
    ["estudio-inicio", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Início"); }],
    ["estudio-gaveta", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Aplicativos"); }],
    ["estudio-backup", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Backup"); await p.getByRole("button", { name: "Salvar backup" }).waitFor(); }],
    ["estudio-launcher", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Launcher"); await p.getByText("O V-Space é o launcher padrão").waitFor(); }],
    ["estudio-gestos", "completo", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Gestos"); await p.getByRole("switch", { name: "Bloquear layout" }).waitFor(); }],
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
    ["categorias-nova-teclado", "categorias", async (p) => { if (p.viewportSize().height < 560) throw new Error("PULAR"); await p.getByRole("button", { name: "Nova categoria" }).click(); await p.getByRole("dialog", { name: "Nova categoria" }).waitFor(); await p.evaluate(() => document.documentElement.style.setProperty("--teclado", "280px")); await p.getByPlaceholder("Ex.: Trabalho").fill("Trabalho"); await p.waitForTimeout(200); const campo = await p.getByPlaceholder("Ex.: Trabalho").boundingBox(); const vh = p.viewportSize().height; if (!campo || campo.y + campo.height > vh - 280) throw new Error("o campo ficou embaixo do teclado"); const icones = p.getByRole("dialog", { name: "Nova categoria" }).getByRole("button", { name: "Animais" }); await icones.scrollIntoViewIfNeeded(); await icones.click(); await p.getByRole("button", { name: "Salvar" }).scrollIntoViewIfNeeded(); const s = await p.getByRole("button", { name: "Salvar" }).boundingBox(); if (s.y + s.height > vh - 280 + 1) throw new Error("o botão Salvar ficou embaixo do teclado"); }],
    ["categorias-nova-recentes", "categorias", async (p) => { await p.getByRole("button", { name: "Nova categoria" }).click(); const d = p.getByRole("dialog", { name: "Nova categoria" }); await d.waitFor(); await p.getByPlaceholder("Ex.: Trabalho").fill("Novos"); await d.getByRole("button", { name: "Instalados recentemente" }).click(); await d.getByRole("button", { name: "Cor #ffd166" }).click(); await d.getByRole("button", { name: "Esportes" }).scrollIntoViewIfNeeded(); await d.getByRole("button", { name: "Sino" }).click(); await d.getByRole("button", { name: "Salvar" }).click(); await p.getByRole("button", { name: /^Novos, \d+ apps/ }).click(); await p.getByRole("heading", { name: "Novos" }).waitFor(); }],
    ["categorias-nova", "categorias", async (p) => { await p.getByRole("button", { name: "Nova categoria" }).click(); await p.getByRole("dialog", { name: "Nova categoria" }).waitFor(); await p.getByPlaceholder("Ex.: Trabalho").fill("Trabalho"); await p.waitForTimeout(150); }],
    ["categorias-nova-criada", "categorias", async (p) => { await p.getByRole("button", { name: "Nova categoria" }).click(); await p.getByPlaceholder("Ex.: Trabalho").fill("Trabalho"); await p.getByRole("button", { name: "Salvar" }).click(); await p.waitForTimeout(250); await p.getByRole("button", { name: /^Trabalho, 0 apps/ }).waitFor(); }],
    ["organizar-inicio", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("dialog", { name: "Organizar com IA" }).waitFor(); }],
    ["organizar-previa", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("button", { name: "Organizar agora" }).click(); await p.getByText(/mudam? de categoria/).waitFor({ timeout: 5000 }); }],
    ["organizar-feito", "categorias", async (p) => { await p.getByRole("button", { name: "Organizar com IA" }).click(); await p.getByRole("button", { name: "Organizar agora" }).click(); await p.getByRole("button", { name: "Aplicar" }).click(); await p.getByText(/Pronto!/).waitFor(); }],
    ["estudio-categorias-modo", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Tela inicial"); }],
    ["estudio-categorias-lista", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Suas categorias"); await p.getByRole("button", { name: "Editar Jogos" }).waitFor(); }],
    ["estudio-categorias-editar", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Categorias"); await aba(p, "Suas categorias"); await p.getByRole("button", { name: "Editar Jogos" }).click(); await p.getByRole("dialog", { name: "Editar categoria" }).waitFor(); }],
    ["conta-entrada", "semConta", async (p) => { await p.getByRole("dialog", { name: "Entrar com o Vetorial ID" }).waitFor(); await p.getByRole("button", { name: "Entrar", exact: true }).waitFor(); }],
    ["conta-criar", "semConta", async (p) => { await p.getByRole("button", { name: /Não tenho conta/ }).click(); await p.getByText("Senha de recuperação (6 números)").waitFor(); }],
    ["conta-recuperar", "semConta", async (p) => { await p.getByRole("button", { name: "Recuperar" }).click(); await p.waitForTimeout(300); }],
    ["estudio-conta", "categorias", async (p) => { await abrirEstudio(p); await aba(p, "Configurações"); await aba(p, "Conta"); await p.getByText("demo@vetorial.tech").waitFor(); }],
    ["estudio-grade-mais-colunas", "completo", async (p) => {
      await abrirEstudio(p); await aba(p, "Início");
      await p.getByRole("button", { name: "Mais colunas" }).click(); await p.getByRole("button", { name: "Mais colunas" }).click(); await p.waitForTimeout(200);
      await p.getByRole("button", { name: "Fechar" }).first().click(); await p.waitForTimeout(250);
      if ((await p.locator(".pagina").first().evaluate((e) => getComputedStyle(e).getPropertyValue("--cols").trim())) !== "6") throw new Error("a grade não passou para 6 colunas");
    }],
  ],
};
