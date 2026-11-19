// Lógica pura do launcher (sem tela): layout da tela inicial, dock, pastas, busca, backup.
// Tudo que vem do disco ou de um backup passa por limparBanco. Sem imports de fora, para o teste do Node rodar.

export interface AppInfo { pacote: string; nome: string; icone?: string }
export type Forma = "original" | "circulo" | "squircle" | "quadrado";
export type EstiloGaveta = "lista" | "grade";
export type Fundo = "aurora" | "noite" | "neon" | "cor" | "foto";
export type EstiloBotao = "degrade" | "contorno" | "solido";

export interface Tema {
  id: string; cor: string; cor2: string; fundo: Fundo; fundoCor: string;
  forma: Forma; tamanho: number; rotulos: boolean; gaveta: EstiloGaveta; botoes: EstiloBotao;
  /** papel de parede (fundo "foto"): desfoque em px e escurecimento em % */
  desfoque: number; escuro: number;
}
export interface Pasta { id: string; nome: string; apps: string[] }
export type Item = { tipo: "app"; pacote: string } | { tipo: "pasta"; id: string };
export interface Layout { colunas: number; linhas: number; paginas: Item[][]; dock: string[]; pastas: Pasta[] }
export type TipoWidget = "relogio-digital" | "relogio-analogico" | "clima" | "bateria" | "agenda";
export const TIPOS_WIDGET: readonly TipoWidget[] = ["relogio-digital", "relogio-analogico", "clima", "bateria", "agenda"];
export const NOMES_WIDGET: Record<TipoWidget, string> = { "relogio-digital": "Relógio digital", "relogio-analogico": "Relógio analógico", clima: "Clima", bateria: "Bateria", agenda: "Agenda" };
export const MAX_WIDGETS = 4;
/** Um widget na faixa da tela inicial. O clima guarda a cidade e o ponto no mapa (achados uma vez, na hora de adicionar). */
export interface Widget { id: string; tipo: TipoWidget; cidade?: string; lat?: number; lon?: number }
export interface Banco { v: 1; tema: Tema; layout: Layout; ocultos: string[]; relogio: boolean; widgets: Widget[] }

export const MAX_DOCK = 5;
export const MAX_PAGINAS = 8;
export const COLUNAS = { min: 3, max: 6 };
export const LINHAS = { min: 4, max: 7 };
export const TAMANHO_ICONE = { min: 40, max: 72 };
export const DESFOQUE = { min: 0, max: 24 };
export const ESCURO = { min: 0, max: 80 };

export const TEMAS: Tema[] = [
  { id: "vetorial", cor: "#22d3ee", cor2: "#e879f9", fundo: "aurora", fundoCor: "#0b1020", forma: "squircle", tamanho: 56, rotulos: true, gaveta: "lista", botoes: "degrade", desfoque: 0, escuro: 30 },
  { id: "noite", cor: "#8ab4ff", cor2: "#b39dff", fundo: "noite", fundoCor: "#05070d", forma: "circulo", tamanho: 54, rotulos: true, gaveta: "lista", botoes: "solido", desfoque: 0, escuro: 30 },
  { id: "brasa", cor: "#fb923c", cor2: "#f43f5e", fundo: "neon", fundoCor: "#14080a", forma: "squircle", tamanho: 56, rotulos: true, gaveta: "grade", botoes: "degrade", desfoque: 0, escuro: 30 },
  { id: "floresta", cor: "#34d399", cor2: "#a3e635", fundo: "noite", fundoCor: "#04100b", forma: "quadrado", tamanho: 52, rotulos: false, gaveta: "lista", botoes: "contorno", desfoque: 0, escuro: 30 },
  { id: "rosa", cor: "#f472b6", cor2: "#c084fc", fundo: "aurora", fundoCor: "#12081a", forma: "circulo", tamanho: 58, rotulos: true, gaveta: "grade", botoes: "degrade", desfoque: 0, escuro: 30 },
];
export const NOMES_DOS_TEMAS: Record<string, string> = { vetorial: "Vetorial", noite: "Noite", brasa: "Brasa", floresta: "Floresta", rosa: "Rosa" };

const REGEX_COR = /^#[0-9a-fA-F]{6}$/;
const REGEX_PACOTE = /^[A-Za-z0-9_.]{1,200}$/;
const FORMAS: Forma[] = ["original", "circulo", "squircle", "quadrado"];
const FUNDOS: Fundo[] = ["aurora", "noite", "neon", "cor", "foto"];
const BOTOES: EstiloBotao[] = ["degrade", "contorno", "solido"];
const GAVETAS: EstiloGaveta[] = ["lista", "grade"];

const limitar = (n: unknown, min: number, max: number, padrao: number): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : padrao;
  return Math.min(max, Math.max(min, v));
};
const cor = (v: unknown, padrao: string): string => (typeof v === "string" && REGEX_COR.test(v) ? v.toLowerCase() : padrao);
const escolha = <T extends string>(v: unknown, lista: readonly T[], padrao: T): T => (lista.includes(v as T) ? (v as T) : padrao);
const decimal = (v: unknown, min: number, max: number): number | null => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 1000) / 1000 : null);
export function limparWidgets(x: unknown): Widget[] {
  const saida: Widget[] = [];
  const ids = new Set<string>();
  for (const w of Array.isArray(x) ? x : []) {
    if (saida.length >= MAX_WIDGETS) break;
    if (!w || typeof w !== "object") continue;
    const o = w as Record<string, unknown>;
    if (!TIPOS_WIDGET.includes(o.tipo as TipoWidget)) continue;
    const id = typeof o.id === "string" && /^[a-z0-9_-]{1,20}$/.test(o.id) && !ids.has(o.id) ? o.id : `w${saida.length + 1}-${saida.length * 7 + 3}`;
    if (ids.has(id)) continue;
    const item: Widget = { id, tipo: o.tipo as TipoWidget };
    if (item.tipo === "clima") {
      const lat = decimal(o.lat, -90, 90), lon = decimal(o.lon, -180, 180);
      const cidade = typeof o.cidade === "string" ? o.cidade.replace(/[<>]/g, "").trim().slice(0, 40) : "";
      if (lat === null || lon === null || !cidade) continue; // clima sem lugar não funciona: sai em vez de ficar quebrado
      item.cidade = cidade; item.lat = lat; item.lon = lon;
    }
    ids.add(id); saida.push(item);
  }
  return saida;
}
export function adicionarWidget(b: Banco, w: Omit<Widget, "id">): { banco: Banco; ok: boolean } {
  if (b.widgets.length >= MAX_WIDGETS) return { banco: b, ok: false };
  const usados = new Set(b.widgets.map((x) => x.id));
  let n = 1; while (usados.has(`w${n}`)) n++;
  return { banco: { ...b, widgets: limparWidgets([...b.widgets, { ...w, id: `w${n}` }]) }, ok: true };
}
export const removerWidget = (b: Banco, id: string): Banco => ({ ...b, widgets: b.widgets.filter((w) => w.id !== id) });
export const ehPacote = (v: unknown): v is string => typeof v === "string" && REGEX_PACOTE.test(v);
export const nomeLimpo = (v: unknown, padrao = ""): string => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 24) || padrao;

export const temaPadrao = (): Tema => ({ ...TEMAS[0]! });
export const layoutVazio = (): Layout => ({ colunas: 4, linhas: 5, paginas: [[]], dock: [], pastas: [] });
export const bancoPadrao = (): Banco => ({ v: 1, tema: temaPadrao(), layout: layoutVazio(), ocultos: [], relogio: true, widgets: [] });

export function limparTema(x: unknown): Tema {
  const t = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const p = TEMAS[0]!;
  return {
    id: typeof t.id === "string" && /^[a-z0-9_-]{1,20}$/.test(t.id) ? t.id : "personalizado",
    cor: cor(t.cor, p.cor), cor2: cor(t.cor2, p.cor2), fundo: escolha(t.fundo, FUNDOS, p.fundo), fundoCor: cor(t.fundoCor, p.fundoCor),
    forma: escolha(t.forma, FORMAS, p.forma), tamanho: limitar(t.tamanho, TAMANHO_ICONE.min, TAMANHO_ICONE.max, p.tamanho),
    rotulos: typeof t.rotulos === "boolean" ? t.rotulos : p.rotulos, gaveta: escolha(t.gaveta, GAVETAS, p.gaveta), botoes: escolha(t.botoes, BOTOES, p.botoes),
    desfoque: limitar(t.desfoque, DESFOQUE.min, DESFOQUE.max, p.desfoque), escuro: limitar(t.escuro, ESCURO.min, ESCURO.max, p.escuro),
  };
}

/** Qualquer coisa que venha do disco ou de backup vira um Banco válido: sem repetidos, sem pasta fantasma, dentro dos limites. */
export function limparBanco(x: unknown): Banco {
  const b = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const l = (b.layout && typeof b.layout === "object" ? b.layout : {}) as Record<string, unknown>;
  const colunas = limitar(l.colunas, COLUNAS.min, COLUNAS.max, 4);
  const linhas = limitar(l.linhas, LINHAS.min, LINHAS.max, 5);
  const capacidade = colunas * linhas;
  const visto = new Set<string>();

  const pastas: Pasta[] = [];
  const idsDePasta = new Set<string>();
  for (const p of Array.isArray(l.pastas) ? l.pastas : []) {
    if (!p || typeof p !== "object") continue;
    const q = p as Record<string, unknown>;
    if (typeof q.id !== "string" || !/^[a-z0-9_-]{1,40}$/i.test(q.id) || idsDePasta.has(q.id)) continue;
    const apps: string[] = [];
    for (const a of Array.isArray(q.apps) ? q.apps : []) if (ehPacote(a) && !visto.has(a)) { visto.add(a); apps.push(a); }
    if (!apps.length) continue;
    idsDePasta.add(q.id);
    pastas.push({ id: q.id, nome: nomeLimpo(q.nome, "Pasta"), apps: apps.slice(0, 60) });
  }

  const usadas = new Set<string>();
  const paginas: Item[][] = [];
  for (const pg of Array.isArray(l.paginas) ? l.paginas : []) {
    if (!Array.isArray(pg) || paginas.length >= MAX_PAGINAS) continue;
    const itens: Item[] = [];
    for (const it of pg) {
      if (!it || typeof it !== "object") continue;
      const q = it as Record<string, unknown>;
      if (q.tipo === "app" && ehPacote(q.pacote) && !visto.has(q.pacote)) { visto.add(q.pacote); itens.push({ tipo: "app", pacote: q.pacote }); }
      else if (q.tipo === "pasta" && typeof q.id === "string" && idsDePasta.has(q.id) && !usadas.has(q.id)) { usadas.add(q.id); itens.push({ tipo: "pasta", id: q.id }); }
    }
    paginas.push(itens);
  }
  // pasta que nenhuma página mostra volta para a primeira página (nada some em silêncio)
  for (const p of pastas) if (!usadas.has(p.id)) { (paginas[0] ??= []).push({ tipo: "pasta", id: p.id }); usadas.add(p.id); }
  if (!paginas.length) paginas.push([]);
  const achatado = paginas.flat();
  const repaginado = repaginar(achatado, capacidade);

  const dock: string[] = [];
  for (const a of Array.isArray(l.dock) ? l.dock : []) if (ehPacote(a) && !dock.includes(a) && dock.length < MAX_DOCK) dock.push(a);

  const ocultos: string[] = [];
  for (const a of Array.isArray(b.ocultos) ? b.ocultos : []) if (ehPacote(a) && !ocultos.includes(a)) ocultos.push(a);

  return { v: 1, tema: limparTema(b.tema), layout: { colunas, linhas, paginas: repaginado, dock, pastas }, ocultos, relogio: typeof b.relogio === "boolean" ? b.relogio : true, widgets: limparWidgets(b.widgets) };
}

/** Reparte os itens em páginas de `capacidade`, sem buracos. Sempre devolve pelo menos uma página. */
export function repaginar(itens: Item[], capacidade: number): Item[][] {
  const paginas: Item[][] = [];
  for (let i = 0; i < itens.length && paginas.length < MAX_PAGINAS; i += capacidade) paginas.push(itens.slice(i, i + capacidade));
  return paginas.length ? paginas : [[]];
}

export const normalizar = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const ordenar = (apps: AppInfo[]): AppInfo[] => [...apps].sort((a, b) => normalizar(a.nome).localeCompare(normalizar(b.nome), "pt-BR") || a.pacote.localeCompare(b.pacote));

/** Busca por nome (começo do nome, começo de palavra, trecho) e, por último, pelo identificador do app. */
export function buscar(apps: AppInfo[], termo: string): AppInfo[] {
  const t = normalizar(termo);
  if (!t) return ordenar(apps);
  const pontos: [number, AppInfo][] = [];
  for (const a of apps) {
    const n = normalizar(a.nome);
    let p = -1;
    if (n.startsWith(t)) p = 0;
    else if (n.split(/[\s\-_.]+/).some((w) => w.startsWith(t))) p = 1;
    else if (n.includes(t)) p = 2;
    else if (a.pacote.toLowerCase().includes(t)) p = 3;
    if (p >= 0) pontos.push([p, a]);
  }
  return pontos.sort((x, y) => x[0] - y[0] || normalizar(x[1].nome).localeCompare(normalizar(y[1].nome), "pt-BR")).map((x) => x[1]);
}

export const letraDe = (nome: string): string => { const c = normalizar(nome).charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
export function agruparPorLetra(apps: AppInfo[]): { letra: string; apps: AppInfo[] }[] {
  const mapa = new Map<string, AppInfo[]>();
  for (const a of ordenar(apps)) { const l = letraDe(a.nome); mapa.set(l, [...(mapa.get(l) ?? []), a]); }
  return [...mapa].map(([letra, lista]) => ({ letra, apps: lista })).sort((a, b) => (a.letra === "#" ? 1 : b.letra === "#" ? -1 : a.letra.localeCompare(b.letra)));
}

export const ehDaSuite = (pacote: string): boolean => pacote.startsWith("tech.vetorial.") || pacote === "com.tonimarques.sextafeira";
const PREFERIDOS_DO_DOCK = [
  ["com.google.android.dialer", "com.samsung.android.dialer", "com.android.dialer", "com.motorola.dialer"],
  ["com.google.android.apps.messaging", "com.samsung.android.messaging", "com.android.mms"],
  ["com.android.chrome", "org.mozilla.firefox", "com.sec.android.app.sbrowser"],
  ["com.google.android.GoogleCamera", "com.sec.android.app.camera", "com.android.camera", "com.motorola.camera3"],
];

export const noLayout = (b: Banco): Set<string> => {
  const s = new Set<string>(b.layout.dock);
  for (const pg of b.layout.paginas) for (const it of pg) if (it.tipo === "app") s.add(it.pacote);
  for (const p of b.layout.pastas) for (const a of p.apps) s.add(a);
  return s;
};
export const naTela = (b: Banco): Set<string> => { const s = noLayout(b); for (const a of b.layout.dock) s.delete(a); return s; };

/** Primeira abertura: apps da suíte primeiro, o resto em ordem alfabética até encher a primeira página; o dock leva ligar, mensagens, navegador e câmera. */
export function layoutInicial(apps: AppInfo[], base: Banco = bancoPadrao()): Banco {
  const instalados = new Set(apps.map((a) => a.pacote));
  const dock: string[] = [];
  for (const grupo of PREFERIDOS_DO_DOCK) { const achou = grupo.find((p) => instalados.has(p)); if (achou) dock.push(achou); }
  const resto = ordenar(apps).filter((a) => !dock.includes(a.pacote));
  const suite = resto.filter((a) => ehDaSuite(a.pacote));
  const outros = resto.filter((a) => !ehDaSuite(a.pacote));
  if (dock.length < 4) for (const a of outros) { if (dock.length >= 4) break; dock.push(a.pacote); }
  const fila = [...suite, ...outros.filter((a) => !dock.includes(a.pacote))].slice(0, base.layout.colunas * base.layout.linhas);
  return { ...base, layout: { ...base.layout, dock, paginas: [fila.map((a) => ({ tipo: "app" as const, pacote: a.pacote }))], pastas: [] } };
}

/** Tira do layout o que foi desinstalado e esconde o que não existe mais. Não põe app novo na tela: ele fica na gaveta. */
export function reconciliar(b: Banco, instalados: Set<string>): Banco {
  const vivo = (p: string) => instalados.has(p);
  const pastas = b.layout.pastas.map((p) => ({ ...p, apps: p.apps.filter(vivo) })).filter((p) => p.apps.length);
  const ids = new Set(pastas.map((p) => p.id));
  const paginas = b.layout.paginas.map((pg) => pg.filter((it) => (it.tipo === "app" ? vivo(it.pacote) : ids.has(it.id))));
  return limparBanco({ ...b, layout: { ...b.layout, paginas, pastas, dock: b.layout.dock.filter(vivo) }, ocultos: b.ocultos.filter(vivo) });
}

const capacidade = (b: Banco) => b.layout.colunas * b.layout.linhas;
const comLayout = (b: Banco, l: Partial<Layout>): Banco => ({ ...b, layout: { ...b.layout, ...l } });
const semEsteApp = (itens: Item[], pacote: string) => itens.filter((it) => !(it.tipo === "app" && it.pacote === pacote));

/** Põe o app no primeiro espaço livre da tela inicial (cria página nova se precisar). ok=false: não coube. */
export function adicionarNaTela(b: Banco, pacote: string): { banco: Banco; ok: boolean } {
  if (!ehPacote(pacote)) return { banco: b, ok: false };
  if (naTela(b).has(pacote)) return { banco: b, ok: true };
  const paginas = b.layout.paginas.map((pg) => [...pg]);
  const livre = paginas.findIndex((pg) => pg.length < capacidade(b));
  if (livre >= 0) paginas[livre]!.push({ tipo: "app", pacote });
  else if (paginas.length < MAX_PAGINAS) paginas.push([{ tipo: "app", pacote }]);
  else return { banco: b, ok: false };
  return { banco: comLayout(b, { paginas }), ok: true };
}

export function removerDaTela(b: Banco, pacote: string): Banco {
  const pastas = b.layout.pastas.map((p) => ({ ...p, apps: p.apps.filter((a) => a !== pacote) })).filter((p) => p.apps.length);
  const ids = new Set(pastas.map((p) => p.id));
  const paginas = b.layout.paginas.map((pg) => semEsteApp(pg, pacote).filter((it) => it.tipo === "app" || ids.has(it.id)));
  return comLayout(b, { paginas, pastas });
}

export function paraODock(b: Banco, pacote: string): { banco: Banco; ok: boolean } {
  if (b.layout.dock.includes(pacote)) return { banco: b, ok: true };
  if (b.layout.dock.length >= MAX_DOCK) return { banco: b, ok: false };
  const sem = removerDaTela(b, pacote);
  return { banco: comLayout(sem, { dock: [...sem.layout.dock, pacote] }), ok: true };
}
export function tirarDoDock(b: Banco, pacote: string): { banco: Banco; ok: boolean } {
  const sem = comLayout(b, { dock: b.layout.dock.filter((a) => a !== pacote) });
  return adicionarNaTela(sem, pacote);
}

/** Junta dois apps que estão na tela inicial numa pasta nova, no lugar do primeiro. */
export function criarPasta(b: Banco, a: string, c: string, nome = "Pasta"): Banco {
  if (a === c) return b;
  const tela = naTela(b);
  if (!tela.has(a) || !tela.has(c)) return b;
  const noA = b.layout.pastas.find((p) => p.apps.includes(a));
  const noC = b.layout.pastas.find((p) => p.apps.includes(c));
  if (noA || noC) return b;
  const id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const paginas = b.layout.paginas.map((pg) => pg.flatMap((it): Item[] => (it.tipo === "app" && it.pacote === a ? [{ tipo: "pasta", id }] : it.tipo === "app" && it.pacote === c ? [] : [it])));
  return comLayout(b, { paginas, pastas: [...b.layout.pastas, { id, nome: nomeLimpo(nome, "Pasta"), apps: [a, c] }] });
}
export function adicionarNaPasta(b: Banco, id: string, pacote: string): Banco {
  const p = b.layout.pastas.find((x) => x.id === id);
  if (!p || p.apps.includes(pacote) || !naTela(b).has(pacote)) return b;
  const sem = removerDaTela(b, pacote);
  return comLayout(sem, { pastas: sem.layout.pastas.map((x) => (x.id === id ? { ...x, apps: [...x.apps, pacote] } : x)) });
}
export function tirarDaPasta(b: Banco, id: string, pacote: string): { banco: Banco; ok: boolean } {
  const p = b.layout.pastas.find((x) => x.id === id);
  if (!p || !p.apps.includes(pacote)) return { banco: b, ok: false };
  const restante = p.apps.filter((a) => a !== pacote);
  const pastas = restante.length ? b.layout.pastas.map((x) => (x.id === id ? { ...x, apps: restante } : x)) : b.layout.pastas.filter((x) => x.id !== id);
  const paginas = b.layout.paginas.map((pg) => pg.filter((it) => it.tipo === "app" || it.id !== id || restante.length > 0));
  return adicionarNaTela(comLayout(b, { pastas, paginas }), pacote);
}
export function renomearPasta(b: Banco, id: string, nome: string): Banco {
  return comLayout(b, { pastas: b.layout.pastas.map((p) => (p.id === id ? { ...p, nome: nomeLimpo(nome, "Pasta") } : p)) });
}

export function mudarGrade(b: Banco, colunas: number, linhas: number): Banco {
  const c = limitar(colunas, COLUNAS.min, COLUNAS.max, b.layout.colunas);
  const l = limitar(linhas, LINHAS.min, LINHAS.max, b.layout.linhas);
  const tudo = b.layout.paginas.flat();
  const paginas = repaginar(tudo, c * l);
  // se não coube tudo em MAX_PAGINAS, mantém a grade antiga: nada some
  if (paginas.flat().length < tudo.length) return b;
  return comLayout(b, { colunas: c, linhas: l, paginas });
}

export function ocultar(b: Banco, pacote: string): Banco {
  if (!ehPacote(pacote) || b.ocultos.includes(pacote)) return b;
  return { ...removerDaTela(comLayout(b, { dock: b.layout.dock.filter((a) => a !== pacote) }), pacote), ocultos: [...b.ocultos, pacote] };
}
export const mostrar = (b: Banco, pacote: string): Banco => ({ ...b, ocultos: b.ocultos.filter((a) => a !== pacote) });

export const escolherTema = (b: Banco, id: string): Banco => { const t = TEMAS.find((x) => x.id === id); return t ? { ...b, tema: { ...t } } : b; };
export const ajustarTema = (b: Banco, mudanca: Partial<Tema>): Banco => ({ ...b, tema: limparTema({ ...b.tema, id: "personalizado", ...mudanca }) });

const MARCA = "vetorial-home";
export const exportar = (b: Banco): string => JSON.stringify({ formato: MARCA, v: 1, banco: b }, null, 2);
/** Lê um backup. Devolve null se o arquivo não for do V-Space. */
export function importar(texto: string): Banco | null {
  try {
    if (texto.length > 2_000_000) return null;
    const j = JSON.parse(texto) as { formato?: unknown; banco?: unknown };
    if (!j || j.formato !== MARCA || !j.banco) return null;
    return limparBanco(j.banco);
  } catch { return null; }
}
