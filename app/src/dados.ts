// Lógica pura do launcher (sem tela): layout da tela inicial, dock, pastas, busca, backup.
// Tudo que vem do disco ou de um backup passa por limparBanco. Sem imports de fora, para o teste do Node rodar.

export interface AppInfo { pacote: string; nome: string; icone?: string; instalado?: number }
export type Forma = "original" | "circulo" | "squircle" | "quadrado";
export type EstiloGaveta = "lista" | "grade";
export type Fundo = "aurora" | "noite" | "neon" | "cor" | "foto";
export type EstiloBotao = "degrade" | "contorno" | "solido";
export type EstiloDock = "vidro" | "solido" | "transparente";
export type PacoteIcones = "original" | "mono" | "tingido" | "vivo";
export type EstiloPasta = "vidro" | "solida" | "contorno";
export type AcaoGesto = "nada" | "gaveta" | "pesquisa" | "estudio" | "seguro" | "bloquear";
export const ACOES_GESTO: AcaoGesto[] = ["nada", "gaveta", "pesquisa", "estudio", "seguro", "bloquear"];
export interface Gestos { baixo: AcaoGesto; duplo: AcaoGesto; doisCima: AcaoGesto; doisBaixo: AcaoGesto }
export const GESTOS_PADRAO: Gestos = { baixo: "nada", duplo: "nada", doisCima: "nada", doisBaixo: "seguro" };
/** Entradas do menu de segurar na tela inicial (a pessoa escolhe quais mostrar). */
export const ITENS_MENU = ["papel", "widgets", "apps", "atalhos", "pasta", "grade", "icones", "temas", "estudio", "bloquear"] as const;
export type ItemMenu = (typeof ITENS_MENU)[number];
export function limparGestos(x: unknown): Gestos {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const a = (v: unknown, d: AcaoGesto): AcaoGesto => (ACOES_GESTO.includes(v as AcaoGesto) ? (v as AcaoGesto) : d);
  return { baixo: a(o.baixo, "nada"), duplo: a(o.duplo, "nada"), doisCima: a(o.doisCima, "nada"), doisBaixo: a(o.doisBaixo, "seguro") };
}
export type Gesto = "gaveta" | "pesquisa" | "nada";

export type OrdemGaveta = "az" | "za" | "novos" | "antigos" | "usados";
export const ORDENS: OrdemGaveta[] = ["az", "za", "novos", "antigos", "usados"];
export type Superficie = "vidro" | "acrilico" | "cor";
export const SUPERFICIES: Superficie[] = ["vidro", "acrilico", "cor"];
export type PastaAbre = "folha" | "janela";
export const PASTA_ABRE: PastaAbre[] = ["folha", "janela"];
export type AnimBloqueio = "cadeado" | "pulso" | "brilho" | "nenhuma";
export const ANIM_BLOQUEIO: AnimBloqueio[] = ["cadeado", "pulso", "brilho", "nenhuma"];
export type Luz = "nenhuma" | "sol" | "dia" | "noite";
export type AplicarEm = "pergunta" | "inicio" | "bloqueio" | "ambas";
export const LUZES: Luz[] = ["nenhuma", "sol", "dia", "noite"];
export const APLICAR_EM: AplicarEm[] = ["pergunta", "inicio", "bloqueio", "ambas"];
export interface Tema {
  id: string; cor: string; cor2: string; fundo: Fundo; fundoCor: string;
  forma: Forma; tamanho: number; rotulos: boolean; gaveta: EstiloGaveta; botoes: EstiloBotao;
  /** papel de parede (fundo "foto"): desfoque em px e escurecimento em % */
  desfoque: number; escuro: number;
  /** ajustes de cor do papel: saturação em % (100 = original), temperatura de -50 (fria) a 50 (quente) e vinheta (bordas escuras) em % */
  saturacao: number; temperatura: number; vinheta: number;
  /** Luz do dia: o papel recebe a cor da luz do sol agora ("sol"), ou fica fixo em dia/noite */
  luz: Luz;
  /** troca o papel por um dos favoritos uma vez por dia */
  papelDiario: boolean;
  /** onde "Aplicar ao Android" coloca o papel: pergunta, tela inicial do Android, bloqueio ou ambas */
  aplicarEm: AplicarEm;
  /** gaveta de apps: ordem, selo de notificação e ponto em app novo */
  ordem: OrdemGaveta; selos: boolean; pontoNovo: boolean;
  /** material do dock e dos widgets em vidro: vidro, acrílico (fosco escuro) ou cor do tema; intensidade 0–100 */
  superficie: Superficie; intensidade: number;
  /** pasta abre como folha (de baixo) ou janela (no meio); animação ao travar/destravar o layout */
  pastaAbre: PastaAbre; animBloqueio: AnimBloqueio;
  /** raio dos cartões e janelas (px), estilo do dock, pacote de ícones e estilo das pastas */
  cantos: number; dock: EstiloDock; pacote: PacoteIcones; pasta: EstiloPasta;
}
export interface Pasta { id: string; nome: string; apps: string[] }
export type Item = { tipo: "app"; pacote: string } | { tipo: "pasta"; id: string };
export interface Layout { colunas: number; linhas: number; paginas: Item[][]; dock: string[]; pastas: Pasta[] }
/** Catálogo dos widgets: [tipo, nome, colunas, linhas]. Acrescentar uma linha aqui e o desenho em telas/WidgetsExtra.tsx. */
export const CATALOGO_WIDGET = [
  ["relogio-digital", "Relógio digital", 4, 2], ["relogio-analogico", "Relógio analógico", 2, 2], ["clima", "Clima", 4, 2], ["bateria", "Bateria", 2, 2], ["agenda", "Agenda", 4, 2],
  ["calendario", "Calendário do mês", 4, 4], ["notas", "Notas", 2, 2], ["contagem", "Contagem regressiva", 2, 2], ["frase", "Frase do dia", 4, 2], ["pomodoro", "Foco (Pomodoro)", 2, 2], ["mundo", "Horas pelo mundo", 4, 2],
  ["relogio-alto", "Relógio alto", 4, 4], ["relogio-compacto", "Relógio compacto", 2, 1], ["relogio-vidro", "Relógio de vidro", 4, 3], ["relogio-editorial", "Relógio editorial", 4, 2],
  ["relogio-empilhado", "Hora empilhada", 2, 2], ["relogio-flip", "Relógio de cartões", 4, 2], ["relogio-grande", "Relógio grande", 4, 2], ["relogio-agenda", "Relógio e agenda", 4, 2],
  ["relogio-clima", "Relógio e clima", 4, 1], ["relogio-largo", "Relógio analógico largo", 4, 2], ["relogio-progresso", "Progresso do dia", 4, 2],
  ["saudacao", "Saudação", 4, 2], ["relance", "Num relance", 4, 1], ["pesquisa", "Pesquisa global", 4, 1], ["mes-dia", "Mês e dia", 4, 2], ["semana", "Semana", 4, 2],
  ["proximos", "Próximos eventos", 4, 2], ["saude-bateria", "Saúde da bateria", 2, 2], ["linha-status", "Linha de status", 2, 1],
  ["tempo", "Tempo", 2, 2], ["tipo-clima", "Tipo de clima", 4, 2], ["previsao", "Previsão", 4, 2], ["por-hora", "Clima por hora", 4, 1], ["orbita", "Órbita", 2, 2],
  ["musica-capa", "Música · Capa", 2, 2], ["musica-compacto", "Música · Compacto", 4, 1], ["musica-disco", "Música · Disco", 4, 2], ["musica-tocando", "Música · Tocando", 4, 2], ["musica-brilho", "Música · Brilho", 2, 2],
] as const;
/** "externo" é o widget real de outro app (Google Agenda etc.): não faz parte do catálogo próprio. */
export type TipoWidget = (typeof CATALOGO_WIDGET)[number][0] | "externo";
export const TIPOS_WIDGET = CATALOGO_WIDGET.map((x) => x[0]) as readonly Exclude<TipoWidget, "externo">[];
const TIPOS_VALIDOS: readonly TipoWidget[] = [...TIPOS_WIDGET, "externo"];
export const NOMES_WIDGET = { ...Object.fromEntries(CATALOGO_WIDGET.map((x) => [x[0], x[1]])), externo: "Widget de app" } as Record<TipoWidget, string>;
export const MAX_WIDGETS = 16;
export const COLUNAS_WIDGET = 4;
export const ALTURA_MAX_WIDGET = 8;
export type EstiloWidget = "vidro" | "fosco" | "solido" | "transparente";
export const ESTILOS_WIDGET: readonly EstiloWidget[] = ["vidro", "fosco", "solido", "transparente"];
export const NOMES_ESTILO_WIDGET: Record<EstiloWidget, string> = { vidro: "Vidro", fosco: "Fosco", solido: "Sólido", transparente: "Transparente" };
/** Tamanho (em células: colunas × linhas) que cada widget tem ao ser colocado. */
export const TAMANHO_WIDGET = { ...Object.fromEntries(CATALOGO_WIDGET.map((x) => [x[0], { w: x[2], h: x[3] }])), externo: { w: 2, h: 2 } } as Record<TipoWidget, { w: number; h: number }>;
/** Um widget solto na tela inicial: posição (x, y) e tamanho (w, h) em células de uma grade de 4 colunas. O clima guarda a cidade e o ponto no mapa. */
export interface Widget { id: string; tipo: TipoWidget; x: number; y: number; w: number; h: number; estilo: EstiloWidget; cidade?: string; lat?: number; lon?: number; titulo?: string; data?: string; texto?: string; provider?: string; appId?: number }
export interface Retangulo { x: number; y: number; w: number; h: number }
export const sobrepoe = (a: Retangulo, b: Retangulo): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const cabeEm = (ws: Widget[], r: Retangulo, ignorar?: string): boolean => !ws.some((x) => x.id !== ignorar && sobrepoe(x, r));
const inteiro = (v: unknown, min: number, max: number): number | null => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);
/** Primeiro espaço livre (de cima para baixo, da esquerda para a direita) onde cabe w × h. */
export function acharLugar(ws: Widget[], w: number, h: number): { x: number; y: number } {
  for (let y = 0; ; y++) for (let x = 0; x + w <= COLUNAS_WIDGET; x++) if (cabeEm(ws, { x, y, w, h })) return { x, y };
}
/** Mover: se o lugar pedido está ocupado, desce até achar espaço livre na mesma coluna. */
export function moverWidget(ws: Widget[], id: string, x: number, y: number): Widget[] {
  const a = ws.find((w) => w.id === id);
  if (!a) return ws;
  const nx = Math.max(0, Math.min(COLUNAS_WIDGET - a.w, Math.round(x)));
  let ny = Math.max(0, Math.round(y));
  while (!cabeEm(ws, { x: nx, y: ny, w: a.w, h: a.h }, id)) ny++;
  return ws.map((w) => (w.id === id ? { ...w, x: nx, y: ny } : w));
}
/** Redimensionar (e, puxando pela borda de cima/esquerda, mover): null quando bate em outro widget ou sai da grade. */
export function ajustarWidget(ws: Widget[], id: string, r: Retangulo): Widget[] | null {
  const x = inteiro(r.x, 0, COLUNAS_WIDGET - 1), y = inteiro(r.y, 0, 400), w = inteiro(r.w, 1, COLUNAS_WIDGET), h = inteiro(r.h, 1, ALTURA_MAX_WIDGET);
  if (x === null || y === null || w === null || h === null || x + w > COLUNAS_WIDGET) return null;
  if (!ws.some((a) => a.id === id) || !cabeEm(ws, { x, y, w, h }, id)) return null;
  return ws.map((a) => (a.id === id ? { ...a, x, y, w, h } : a));
}
export const estiloDoWidget = (ws: Widget[], id: string, estilo: EstiloWidget): Widget[] => ws.map((w) => (w.id === id && ESTILOS_WIDGET.includes(estilo) ? { ...w, estilo } : w));
export const alturaDosWidgets = (ws: Widget[]): number => ws.reduce((m, w) => Math.max(m, w.y + w.h), 0);
export type ModoInicio = "categorias" | "grade";
export const ICONES_CATEGORIA = ["estrela", "casa", "coracao", "social", "chat", "telefone", "email", "agenda", "relogio", "notas", "ideias", "criancas", "pata", "lua", "presente", "sino", "nota", "fone", "podcast", "video", "tv", "camera", "galeria", "jogos", "jornal", "livro", "midia", "esporte", "haltere", "saude", "comida", "cafe", "trabalho", "capelo", "codigo", "acoes", "carteira", "banco", "sacola", "mercado", "pasta", "pino", "aviao", "carro", "onibus", "bike", "globo", "folha", "sol", "mala", "ferramentas", "brilho", "ajustes", "nuvem", "escudo", "raio", "bandeira"] as const;
export type IconeCategoria = (typeof ICONES_CATEGORIA)[number];
/** Os ícones de categoria por assunto, com nome, para a pessoa achar o que combina. */
export const GRUPOS_ICONES: readonly { nome: string; itens: readonly (readonly [IconeCategoria, string])[] }[] = [
  { nome: "Dia a dia", itens: [["estrela", "Estrela"], ["casa", "Página inicial"], ["coracao", "Saúde e fitness"], ["social", "Pessoas"], ["chat", "Conversa"], ["telefone", "Chamadas"], ["email", "E-mail"], ["agenda", "Agenda"], ["relogio", "Hora"], ["notas", "Notas"], ["ideias", "Ideias"], ["criancas", "Crianças"], ["pata", "Animais"], ["lua", "Sono"], ["presente", "Presentes"], ["sino", "Sino"]] },
  { nome: "Mídia e lazer", itens: [["nota", "Música"], ["fone", "Áudio"], ["podcast", "Podcasts"], ["video", "Vídeo"], ["tv", "TV"], ["camera", "Fotos"], ["galeria", "Galeria"], ["jogos", "Jogos"], ["jornal", "Notícias"], ["livro", "Livros"], ["midia", "Streaming"], ["esporte", "Esportes"]] },
  { nome: "Comida e saúde", itens: [["haltere", "Exercício"], ["saude", "Saúde"], ["comida", "Comida"], ["cafe", "Café"]] },
  { nome: "Trabalho e dinheiro", itens: [["trabalho", "Trabalho"], ["capelo", "Escola"], ["codigo", "Código"], ["acoes", "Ações"], ["carteira", "Finanças"], ["banco", "Banco"], ["sacola", "Compras"], ["mercado", "Mercado"], ["pasta", "Arquivos"]] },
  { nome: "Viagem e ar livre", itens: [["pino", "Mapas"], ["aviao", "Viagens"], ["carro", "Carro"], ["onibus", "Transporte"], ["bike", "Bike"], ["globo", "Web"], ["folha", "Natureza"], ["sol", "Clima"], ["mala", "Malas"]] },
  { nome: "Ferramentas", itens: [["ferramentas", "Utilitários"], ["brilho", "Destaques"], ["ajustes", "Configurações"], ["nuvem", "Nuvem"], ["escudo", "Segurança"], ["raio", "Energia"], ["bandeira", "Marcadores"]] },
];
/** Cores que a categoria pode ter (aparecem no trilho e no título). */
export const CORES_CATEGORIA = ["#64b5f6", "#ff7eb6", "#ffd166", "#81c784", "#b0bec5", "#b39ddb", "#ffab70", "#ff8a80", "#4dd0e1", "#9fa8da"] as const;
export type ConteudoCategoria = "escolhe" | "mais-usados" | "recentes";
export const CONTEUDOS: readonly ConteudoCategoria[] = ["escolhe", "mais-usados", "recentes"];
export const NOMES_CONTEUDO: Record<ConteudoCategoria, string> = { escolhe: "Apps que você escolhe", "mais-usados": "Mais usados", recentes: "Instalados recentemente" };
export interface Categoria { id: string; nome: string; icone: IconeCategoria; cor?: string; conteudo?: ConteudoCategoria }
export const ehDinamica = (c: Pick<Categoria, "conteudo"> | undefined): boolean => !!c && (c.conteudo === "mais-usados" || c.conteudo === "recentes");
/** Categorias que o V-Space traz. "ferramentas" é a reserva: o app que ninguém soube classificar cai nela. */
export const CATEGORIAS_PADRAO: Categoria[] = [
  { id: "social", nome: "Social e notícias", icone: "social" },
  { id: "jogos", nome: "Jogos", icone: "jogos" },
  { id: "produtividade", nome: "Produtividade", icone: "trabalho" },
  { id: "financas", nome: "Finanças", icone: "carteira" },
  { id: "compras", nome: "Compras e transporte", icone: "sacola" },
  { id: "midia", nome: "Mídia e fotos", icone: "midia" },
  { id: "saude", nome: "Saúde e bem-estar", icone: "coracao" },
  { id: "estudos", nome: "Estudos", icone: "livro" },
  { id: "ferramentas", nome: "Ferramentas e mais", icone: "ferramentas" },
];
export const CATEGORIA_RESERVA = "ferramentas";
export const MAX_CATEGORIAS = 14;
export const MAX_FAVORITOS = 16;
export const MODOS: readonly ModoInicio[] = ["categorias", "grade"];
export interface Banco {
  v: 1; tema: Tema; layout: Layout; ocultos: string[]; relogio: boolean; widgets: Widget[]; gesto: Gesto; bloqueado: boolean; musica: boolean; faixa: boolean;
  /** Espaço seguro (banco, governo): só estes apps aparecem lá, sem widgets, selos nem música */
  seguro: string[];
  /** outros gestos da tela inicial, vibração ao segurar e entradas do menu de segurar que a pessoa escondeu */
  gestos: Gestos; vibrar: boolean; menuOculto: string[];
  modo: ModoInicio; categorias: Categoria[]; atribuidos: Record<string, string>; manuais: string[]; favoritos: string[];
}

export const MAX_DOCK = 5;
export const MAX_PAGINAS = 8;
export const COLUNAS = { min: 3, max: 6 };
export const LINHAS = { min: 4, max: 7 };
export const TAMANHO_ICONE = { min: 40, max: 72 };
export const DESFOQUE = { min: 0, max: 24 };
export const ESCURO = { min: 0, max: 80 };
export const SATURACAO = { min: 0, max: 200 };
export const TEMPERATURA = { min: -50, max: 50 };
export const VINHETA = { min: 0, max: 80 };
export const CANTOS = { min: 0, max: 32 };
export const GESTOS: readonly Gesto[] = ["gaveta", "pesquisa", "nada"];

export const TEMAS: Tema[] = [
  { id: "vetorial", cor: "#22d3ee", cor2: "#e879f9", fundo: "aurora", fundoCor: "#0b1020", forma: "squircle", tamanho: 56, rotulos: true, gaveta: "lista", botoes: "degrade", desfoque: 0, escuro: 30, saturacao: 100, temperatura: 0, vinheta: 0, luz: "nenhuma", papelDiario: false, aplicarEm: "pergunta", ordem: "az", selos: true, pontoNovo: false, superficie: "vidro", intensidade: 50, pastaAbre: "folha", animBloqueio: "cadeado", cantos: 20, dock: "vidro", pacote: "original", pasta: "vidro" },
  { id: "noite", cor: "#8ab4ff", cor2: "#b39dff", fundo: "noite", fundoCor: "#05070d", forma: "circulo", tamanho: 54, rotulos: true, gaveta: "lista", botoes: "solido", desfoque: 0, escuro: 30, saturacao: 100, temperatura: 0, vinheta: 0, luz: "nenhuma", papelDiario: false, aplicarEm: "pergunta", ordem: "az", selos: true, pontoNovo: false, superficie: "vidro", intensidade: 50, pastaAbre: "folha", animBloqueio: "cadeado", cantos: 20, dock: "vidro", pacote: "original", pasta: "vidro" },
  { id: "brasa", cor: "#fb923c", cor2: "#f43f5e", fundo: "neon", fundoCor: "#14080a", forma: "squircle", tamanho: 56, rotulos: true, gaveta: "grade", botoes: "degrade", desfoque: 0, escuro: 30, saturacao: 100, temperatura: 0, vinheta: 0, luz: "nenhuma", papelDiario: false, aplicarEm: "pergunta", ordem: "az", selos: true, pontoNovo: false, superficie: "vidro", intensidade: 50, pastaAbre: "folha", animBloqueio: "cadeado", cantos: 20, dock: "vidro", pacote: "original", pasta: "vidro" },
  { id: "floresta", cor: "#34d399", cor2: "#a3e635", fundo: "noite", fundoCor: "#04100b", forma: "quadrado", tamanho: 52, rotulos: false, gaveta: "lista", botoes: "contorno", desfoque: 0, escuro: 30, saturacao: 100, temperatura: 0, vinheta: 0, luz: "nenhuma", papelDiario: false, aplicarEm: "pergunta", ordem: "az", selos: true, pontoNovo: false, superficie: "vidro", intensidade: 50, pastaAbre: "folha", animBloqueio: "cadeado", cantos: 20, dock: "vidro", pacote: "original", pasta: "vidro" },
  { id: "rosa", cor: "#f472b6", cor2: "#c084fc", fundo: "aurora", fundoCor: "#12081a", forma: "circulo", tamanho: 58, rotulos: true, gaveta: "grade", botoes: "degrade", desfoque: 0, escuro: 30, saturacao: 100, temperatura: 0, vinheta: 0, luz: "nenhuma", papelDiario: false, aplicarEm: "pergunta", ordem: "az", selos: true, pontoNovo: false, superficie: "vidro", intensidade: 50, pastaAbre: "folha", animBloqueio: "cadeado", cantos: 20, dock: "vidro", pacote: "original", pasta: "vidro" },
];
export const NOMES_DOS_TEMAS: Record<string, string> = { vetorial: "Vetorial", noite: "Noite", brasa: "Brasa", floresta: "Floresta", rosa: "Rosa" };

const REGEX_COR = /^#[0-9a-fA-F]{6}$/;
const REGEX_PACOTE = /^[A-Za-z0-9_.]{1,200}$/;
const FORMAS: Forma[] = ["original", "circulo", "squircle", "quadrado"];
const DOCKS: EstiloDock[] = ["vidro", "solido", "transparente"];
const PACOTES: PacoteIcones[] = ["original", "mono", "tingido", "vivo"];
const PASTAS: EstiloPasta[] = ["vidro", "solida", "contorno"];
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
/** Data AAAA-MM-DD que existe de verdade (rejeita 2026-02-31). */
export function dataValida(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const a = Number(m[1]), me = Number(m[2]), d = Number(m[3]);
  const t = new Date(Date.UTC(a, me - 1, d));
  return a >= 2000 && a <= 2100 && t.getUTCFullYear() === a && t.getUTCMonth() === me - 1 && t.getUTCDate() === d;
}
export function limparWidgets(x: unknown): Widget[] {
  const saida: Widget[] = [];
  const ids = new Set<string>();
  for (const w of Array.isArray(x) ? x : []) {
    if (saida.length >= MAX_WIDGETS) break;
    if (!w || typeof w !== "object") continue;
    const o = w as Record<string, unknown>;
    if (!TIPOS_VALIDOS.includes(o.tipo as TipoWidget)) continue;
    const id = typeof o.id === "string" && /^[a-z0-9_-]{1,20}$/.test(o.id) && !ids.has(o.id) ? o.id : `w${saida.length + 1}-${saida.length * 7 + 3}`;
    if (ids.has(id)) continue;
    const tipo = o.tipo as TipoWidget;
    const pad = TAMANHO_WIDGET[tipo];
    let lar = inteiro(o.w, 1, COLUNAS_WIDGET) ?? pad.w; const alt = inteiro(o.h, 1, ALTURA_MAX_WIDGET) ?? pad.h;
    let x = inteiro(o.x, 0, COLUNAS_WIDGET - 1), y = inteiro(o.y, 0, 400);
    if (x !== null && x + lar > COLUNAS_WIDGET) lar = COLUNAS_WIDGET - x;
    if (x === null || y === null || !cabeEm(saida, { x, y, w: lar, h: alt })) { const l = acharLugar(saida, lar, alt); x = l.x; y = l.y; }
    const item: Widget = { id, tipo, x, y, w: lar, h: alt, estilo: escolha(o.estilo, ESTILOS_WIDGET, "vidro") };
    if (item.tipo === "clima") {
      const lat = decimal(o.lat, -90, 90), lon = decimal(o.lon, -180, 180);
      const cidade = typeof o.cidade === "string" ? o.cidade.replace(/[<>]/g, "").trim().slice(0, 40) : "";
      if (lat === null || lon === null || !cidade) continue; // clima sem lugar não funciona: sai em vez de ficar quebrado
      item.cidade = cidade; item.lat = lat; item.lon = lon;
    }
    if (tipo === "externo") {
      if (typeof o.provider !== "string" || !/^[\w.]+\/[\w.$]+$/.test(o.provider) || o.provider.length > 300 || !Number.isInteger(o.appId) || (o.appId as number) < 0) continue; // sem número do Android não há o que mostrar
      item.provider = o.provider; item.appId = o.appId as number;
      const t = typeof o.titulo === "string" ? o.titulo.replace(/[<>]/g, "").slice(0, 60) : "";
      if (t.trim()) item.titulo = t;
    }
    if (tipo === "contagem") {
      const titulo = typeof o.titulo === "string" ? o.titulo.replace(/[<>]/g, "").slice(0, 30) : "";
      if (titulo.trim()) item.titulo = titulo;
      if (typeof o.data === "string" && dataValida(o.data)) item.data = o.data;
    }
    if (tipo === "notas" && typeof o.texto === "string") { const t = o.texto.replace(/[<>]/g, "").slice(0, 300); if (t.trim()) item.texto = t; }
    ids.add(id); saida.push(item);
  }
  return saida;
}
const dataEm = (dias: number, agora = new Date()): string => { const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dias); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export function adicionarWidget(b: Banco, w: { tipo: TipoWidget; cidade?: string; lat?: number; lon?: number; estilo?: EstiloWidget; titulo?: string; data?: string; texto?: string; provider?: string; appId?: number; w?: number; h?: number }): { banco: Banco; ok: boolean } {
  if (b.widgets.length >= MAX_WIDGETS) return { banco: b, ok: false };
  const usados = new Set(b.widgets.map((x) => x.id));
  let n = 1; while (usados.has(`w${n}`)) n++;
  const padrao: Partial<Widget> = w.tipo === "contagem" ? { titulo: "Meu evento", data: dataEm(30) } : {};
  return { banco: { ...b, widgets: limparWidgets([...b.widgets, { ...padrao, ...w, id: `w${n}` }]) }, ok: true };
}
/** Muda o texto de um widget (nota, título e data da contagem); passa pela mesma limpeza de sempre. */
export const editarWidget = (ws: Widget[], id: string, campos: { titulo?: string; data?: string; texto?: string }): Widget[] => limparWidgets(ws.map((w) => (w.id === id ? { ...w, ...campos } : w)));
export const removerWidget = (b: Banco, id: string): Banco => ({ ...b, widgets: b.widgets.filter((w) => w.id !== id) });
export const ehPacote = (v: unknown): v is string => typeof v === "string" && REGEX_PACOTE.test(v);
export const nomeLimpo = (v: unknown, padrao = ""): string => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 24) || padrao;

export const temaPadrao = (): Tema => ({ ...TEMAS[0]! });
export const layoutVazio = (): Layout => ({ colunas: 4, linhas: 5, paginas: [[]], dock: [], pastas: [] });
export const bancoPadrao = (): Banco => ({ v: 1, tema: temaPadrao(), layout: layoutVazio(), ocultos: [], relogio: true, widgets: [], gesto: "gaveta", bloqueado: false, musica: true, faixa: true, seguro: [], gestos: { ...GESTOS_PADRAO }, vibrar: true, menuOculto: [], modo: "categorias", categorias: CATEGORIAS_PADRAO.map((c) => ({ ...c })), atribuidos: {}, manuais: [], favoritos: [] });

export function limparCategorias(x: unknown): Categoria[] {
  const saida: Categoria[] = [];
  const ids = new Set<string>();
  for (const c of Array.isArray(x) ? x : []) {
    if (!c || typeof c !== "object" || saida.length >= MAX_CATEGORIAS) continue;
    const q = c as Record<string, unknown>;
    if (typeof q.id !== "string" || !/^[a-z0-9_-]{1,30}$/.test(q.id) || ids.has(q.id)) continue;
    ids.add(q.id);
    const cat: Categoria = { id: q.id, nome: nomeLimpo(q.nome, "Categoria"), icone: escolha(q.icone, ICONES_CATEGORIA, "pasta") };
    if (typeof q.cor === "string" && (CORES_CATEGORIA as readonly string[]).includes(q.cor)) cat.cor = q.cor;
    if (q.id !== CATEGORIA_RESERVA && (q.conteudo === "mais-usados" || q.conteudo === "recentes")) cat.conteudo = q.conteudo;
    saida.push(cat);
  }
  if (!saida.some((c) => c.id === CATEGORIA_RESERVA)) saida.push({ ...CATEGORIAS_PADRAO.find((c) => c.id === CATEGORIA_RESERVA)! });
  return saida;
}

export function limparTema(x: unknown): Tema {
  const t = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const p = TEMAS[0]!;
  return {
    id: typeof t.id === "string" && /^[a-z0-9_-]{1,20}$/.test(t.id) ? t.id : "personalizado",
    cor: cor(t.cor, p.cor), cor2: cor(t.cor2, p.cor2), fundo: escolha(t.fundo, FUNDOS, p.fundo), fundoCor: cor(t.fundoCor, p.fundoCor),
    forma: escolha(t.forma, FORMAS, p.forma), tamanho: limitar(t.tamanho, TAMANHO_ICONE.min, TAMANHO_ICONE.max, p.tamanho),
    rotulos: typeof t.rotulos === "boolean" ? t.rotulos : p.rotulos, gaveta: escolha(t.gaveta, GAVETAS, p.gaveta), botoes: escolha(t.botoes, BOTOES, p.botoes),
    desfoque: limitar(t.desfoque, DESFOQUE.min, DESFOQUE.max, p.desfoque), escuro: limitar(t.escuro, ESCURO.min, ESCURO.max, p.escuro),
    saturacao: limitar(t.saturacao, SATURACAO.min, SATURACAO.max, 100), temperatura: limitar(t.temperatura, TEMPERATURA.min, TEMPERATURA.max, 0), vinheta: limitar(t.vinheta, VINHETA.min, VINHETA.max, 0),
    luz: LUZES.includes(t.luz as Luz) ? (t.luz as Luz) : "nenhuma", papelDiario: t.papelDiario === true, aplicarEm: APLICAR_EM.includes(t.aplicarEm as AplicarEm) ? (t.aplicarEm as AplicarEm) : "pergunta",
    ordem: ORDENS.includes(t.ordem as OrdemGaveta) ? (t.ordem as OrdemGaveta) : "az", selos: t.selos !== false, pontoNovo: t.pontoNovo === true,
    superficie: SUPERFICIES.includes(t.superficie as Superficie) ? (t.superficie as Superficie) : "vidro",
    intensidade: typeof t.intensidade === "number" && Number.isFinite(t.intensidade) ? Math.min(100, Math.max(0, Math.round(t.intensidade))) : 50,
    pastaAbre: PASTA_ABRE.includes(t.pastaAbre as PastaAbre) ? (t.pastaAbre as PastaAbre) : "folha",
    animBloqueio: ANIM_BLOQUEIO.includes(t.animBloqueio as AnimBloqueio) ? (t.animBloqueio as AnimBloqueio) : "cadeado",
    cantos: limitar(t.cantos, CANTOS.min, CANTOS.max, p.cantos), dock: escolha(t.dock, DOCKS, p.dock), pacote: escolha(t.pacote, PACOTES, p.pacote), pasta: escolha(t.pasta, PASTAS, p.pasta),
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

  const categorias = Array.isArray(b.categorias) ? limparCategorias(b.categorias) : CATEGORIAS_PADRAO.map((c) => ({ ...c }));
  const idsCat = new Set(categorias.map((c) => c.id));
  const atribuidos: Record<string, string> = {};
  if (b.atribuidos && typeof b.atribuidos === "object") for (const [p, c] of Object.entries(b.atribuidos as Record<string, unknown>)) if (ehPacote(p) && typeof c === "string" && idsCat.has(c)) atribuidos[p] = c;
  const manuais: string[] = [];
  for (const a of Array.isArray(b.manuais) ? b.manuais : []) if (ehPacote(a) && atribuidos[a] && !manuais.includes(a)) manuais.push(a);
  const favoritos: string[] = [];
  for (const a of Array.isArray(b.favoritos) ? b.favoritos : []) if (ehPacote(a) && !favoritos.includes(a) && favoritos.length < MAX_FAVORITOS) favoritos.push(a);

  return { v: 1, modo: escolha(b.modo, MODOS, "categorias"), categorias, atribuidos, manuais, favoritos, tema: limparTema(b.tema), layout: { colunas, linhas, paginas: repaginado, dock, pastas }, ocultos, relogio: typeof b.relogio === "boolean" ? b.relogio : true, widgets: limparWidgets(b.widgets), gesto: escolha(b.gesto, GESTOS, "gaveta"), bloqueado: b.bloqueado === true, musica: b.musica !== false, faixa: b.faixa !== false, seguro: Array.from(new Set((Array.isArray(b.seguro) ? b.seguro : []).filter((a): a is string => ehPacote(a)))).slice(0, 60), gestos: limparGestos(b.gestos), vibrar: b.vibrar !== false, menuOculto: Array.from(new Set((Array.isArray(b.menuOculto) ? b.menuOculto : []).filter((m): m is string => (ITENS_MENU as readonly string[]).includes(m as string)))) };
}

/** Reparte os itens em páginas de `capacidade`, sem buracos. Sempre devolve pelo menos uma página. */
export function repaginar(itens: Item[], capacidade: number): Item[][] {
  const paginas: Item[][] = [];
  for (let i = 0; i < itens.length && paginas.length < MAX_PAGINAS; i += capacidade) paginas.push(itens.slice(i, i + capacidade));
  return paginas.length ? paginas : [[]];
}

export const normalizar = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** Ordem da gaveta: A–Z, Z–A, instalados mais recentemente, mais antigos ou mais usados. */
export function ordenarPor(apps: AppInfo[], ordem: OrdemGaveta, usos: Record<string, number> = {}): AppInfo[] {
  const az = ordenar(apps);
  if (ordem === "az") return az;
  if (ordem === "za") return az.reverse();
  if (ordem === "novos") return [...az].sort((a, b) => (b.instalado ?? 0) - (a.instalado ?? 0));
  if (ordem === "antigos") return [...az].sort((a, b) => (a.instalado ?? Infinity) - (b.instalado ?? Infinity));
  return [...az].sort((a, b) => (usos[b.pacote] ?? 0) - (usos[a.pacote] ?? 0));
}
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
  const favoritos = [...dock, ...suite.map((a) => a.pacote).filter((p) => !dock.includes(p))].slice(0, 12);
  return { ...base, favoritos, layout: { ...base.layout, dock, paginas: [fila.map((a) => ({ tipo: "app" as const, pacote: a.pacote }))], pastas: [] } };
}

/** Tira do layout o que foi desinstalado e esconde o que não existe mais. Não põe app novo na tela: ele fica na gaveta. */
export function reconciliar(b: Banco, instalados: Set<string>): Banco {
  const vivo = (p: string) => instalados.has(p);
  const pastas = b.layout.pastas.map((p) => ({ ...p, apps: p.apps.filter(vivo) })).filter((p) => p.apps.length);
  const ids = new Set(pastas.map((p) => p.id));
  const paginas = b.layout.paginas.map((pg) => pg.filter((it) => (it.tipo === "app" ? vivo(it.pacote) : ids.has(it.id))));
  return limparBanco({ ...b, layout: { ...b.layout, paginas, pastas, dock: b.layout.dock.filter(vivo) }, ocultos: b.ocultos.filter(vivo), favoritos: b.favoritos.filter(vivo),
    atribuidos: Object.fromEntries(Object.entries(b.atribuidos).filter(([p]) => vivo(p))), manuais: b.manuais.filter(vivo) });
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
