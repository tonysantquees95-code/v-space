// Categorias inteligentes: separa os apps em categorias (no aparelho, por palavras; a IA do servidor só refina).
// Lógica pura, sem tela. Imports levam .ts para o teste do Node rodar.
import {
  CATEGORIA_RESERVA, MAX_CATEGORIAS, MAX_FAVORITOS, ehDaSuite, ehPacote, nomeLimpo, normalizar,
  type AppInfo, type Banco, type Categoria, type IconeCategoria,
} from "./dados.ts";

/** Termos por categoria, na ordem em que valem. Termo curto (até 3 letras) precisa ser a palavra inteira; os outros valem como começo de palavra. */
const REGRAS: [string, string[]][] = [
  ["jogos", ["game", "games", "jogo", "jogos", "roblox", "pokemon", "minecraft", "supercell", "garena", "gameloft", "activision", "clash", "freefire", "callofduty", "puzzle", "candy", "sugar", "racing", "rivals", "rom", "roms", "emulador", "gamesir", "xbox", "steam", "playstation", "vetogoshi", "fortnite", "ludo"]],
  ["financas", ["banco", "bank", "nubank", "inter", "itau", "bradesco", "santander", "caixa", "pix", "mercadopago", "picpay", "c6", "neon", "xp", "investimento", "bolsa", "binance", "cripto", "fgts", "imposto", "receita", "cartao", "cartoes", "credito", "wallet", "pay", "99pay", "sicredi", "sicoob", "bb", "brasil"]],
  ["compras", ["shop", "shopping", "loja", "compra", "compras", "amazon", "mercadolivre", "shopee", "magalu", "americanas", "aliexpress", "shein", "ifood", "rappi", "uber", "99", "taxi", "cabify", "farmacia", "farmacias", "drogasil", "pacheco", "supermercado", "delivery", "olx", "cupom", "melhor", "envio", "correios", "rastreio", "clubgas", "gas", "posto", "combustivel", "indrive"]],
  ["saude", ["saude", "health", "fitness", "treino", "workout", "medit", "sono", "sleep", "pressao", "diabet", "clinica", "hospital", "unimed", "bemestar", "yoga", "corrida", "strava", "agua", "medico", "consulta", "vacina", "gympass"]],
  ["estudos", ["duolingo", "idioma", "language", "curso", "course", "escola", "study", "estudo", "estudos", "udemy", "khan", "biblia", "dicionario", "livro", "livros", "book", "kindle", "leitor", "reader", "translate", "tradutor", "quiz", "enem", "aprender", "coursera", "babbel"]],
  ["social", ["whatsapp", "telegram", "instagram", "facebook", "messenger", "twitter", "tiktok", "snapchat", "pinterest", "linkedin", "discord", "reddit", "gmail", "mail", "email", "meet", "zoom", "teams", "sms", "mensagens", "messaging", "contatos", "contacts", "dialer", "telefone", "phone", "chrome", "brave", "firefox", "browser", "navegador", "noticias", "news", "globo", "g1", "blabla", "threads", "kwai", "signal", "wa", "tinder", "ligar", "chamadas", "opera", "edge"]],
  ["produtividade", ["docs", "sheets", "slides", "office", "word", "excel", "powerpoint", "pdf", "adobe", "drive", "dropbox", "notion", "keep", "notas", "notes", "agenda", "calendar", "calendario", "tarefa", "todo", "trello", "slack", "github", "git", "authenticator", "calculadora", "calculator", "scanner", "camscanner", "ponto", "adp", "trabalho", "work", "empresa", "contrato", "assinatura", "cadastro", "gov", "inss", "mei", "carteira", "beneficios", "assistente", "assistant", "onedrive", "outlook", "gerenciador", "relatorio"]],
  ["midia", ["youtube", "spotify", "deezer", "netflix", "prime", "video", "videos", "music", "musica", "player", "radio", "podcast", "camera", "galeria", "gallery", "photos", "fotos", "foto", "cinema", "cinemark", "tv", "globoplay", "disney", "hbo", "twitch", "capcut", "vlc", "dolby", "som", "audio", "gravador", "recorder", "editor", "shazam"]],
];

const palavras = (s: string): string[] => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean);
const casa = (tokens: string[], termo: string): boolean => tokens.some((t) => (termo.length <= 3 ? t === termo : t.startsWith(termo)));

/** Categoria que o aparelho sugere para o app (sem IA). Sempre devolve uma id de CATEGORIAS_PADRAO. */
export function classificarLocal(app: AppInfo): string {
  const nome = palavras(app.nome);
  const pacote = palavras(app.pacote);
  const todos = [...nome, ...pacote];
  // o nome do app pesa mais que o pacote: "Play Games" é jogo mesmo estando em com.google.android.play
  // jogo declarado no pacote (jogo1, games, supercell…) vale mais que uma palavra solta no nome ("Corrida Neon" não é banco nem treino)
  const jogos = REGRAS[0]![1];
  if (jogos.some((t) => casa(pacote, t))) return "jogos";
  for (const [cat, termos] of REGRAS) if (termos.some((t) => casa(nome, t))) return cat;
  if (ehDaSuite(app.pacote)) return CATEGORIA_RESERVA;
  for (const [cat, termos] of REGRAS) if (termos.some((t) => casa(pacote, t) && !["com", "app", "apps", "android", "google", "mobile"].includes(t))) return cat;
  void todos;
  return CATEGORIA_RESERVA;
}

const existe = (b: Banco, id: string | undefined): id is string => !!id && b.categorias.some((c) => c.id === id);

/** Categoria do app agora: a escolhida (por você ou pela IA) vale; senão a do aparelho; se a categoria foi apagada, a reserva. */
export function categoriaDe(b: Banco, app: AppInfo): string {
  const guardada = b.atribuidos[app.pacote];
  if (existe(b, guardada)) return guardada;
  const local = classificarLocal(app);
  return existe(b, local) ? local : CATEGORIA_RESERVA;
}

/** Apps de uma categoria (sem os ocultos), em ordem alfabética. */
export function appsDaCategoria(b: Banco, apps: AppInfo[], id: string): AppInfo[] {
  return apps.filter((a) => !b.ocultos.includes(a.pacote) && categoriaDe(b, a) === id).sort((x, y) => normalizar(x.nome).localeCompare(normalizar(y.nome), "pt-BR") || x.pacote.localeCompare(y.pacote));
}

export const contagens = (b: Banco, apps: AppInfo[]): Record<string, number> => {
  const r: Record<string, number> = {};
  for (const c of b.categorias) r[c.id] = 0;
  for (const a of apps) if (!b.ocultos.includes(a.pacote)) { const c = categoriaDe(b, a); r[c] = (r[c] ?? 0) + 1; }
  return r;
};

/** Escolha manual: vale mais que a IA e que o aparelho. */
export function moverParaCategoria(b: Banco, pacote: string, id: string): Banco {
  if (!ehPacote(pacote) || !existe(b, id)) return b;
  return { ...b, atribuidos: { ...b.atribuidos, [pacote]: id }, manuais: b.manuais.includes(pacote) ? b.manuais : [...b.manuais, pacote] };
}

export function favoritar(b: Banco, pacote: string): { banco: Banco; ok: boolean } {
  if (!ehPacote(pacote)) return { banco: b, ok: false };
  if (b.favoritos.includes(pacote)) return { banco: b, ok: true };
  if (b.favoritos.length >= MAX_FAVORITOS) return { banco: b, ok: false };
  return { banco: { ...b, favoritos: [...b.favoritos, pacote] }, ok: true };
}
export const desfavoritar = (b: Banco, pacote: string): Banco => ({ ...b, favoritos: b.favoritos.filter((p) => p !== pacote) });

const slug = (nome: string): string => normalizar(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "categoria";

export function criarCategoria(b: Banco, nome: string, icone: IconeCategoria = "pasta"): { banco: Banco; ok: boolean; id: string } {
  const limpo = nomeLimpo(nome);
  if (!limpo || b.categorias.length >= MAX_CATEGORIAS) return { banco: b, ok: false, id: "" };
  let id = slug(limpo), n = 2;
  while (b.categorias.some((c) => c.id === id)) id = `${slug(limpo).slice(0, 16)}-${n++}`;
  return { banco: { ...b, categorias: [...b.categorias, { id, nome: limpo, icone }] }, ok: true, id };
}
export function editarCategoria(b: Banco, id: string, mudanca: Partial<Pick<Categoria, "nome" | "icone">>): Banco {
  return { ...b, categorias: b.categorias.map((c) => (c.id === id ? { ...c, nome: nomeLimpo(mudanca.nome, c.nome), icone: mudanca.icone ?? c.icone } : c)) };
}
/** Apagar não perde app: quem estava nela volta a ser classificado (reserva se preciso). A reserva não se apaga. */
export function apagarCategoria(b: Banco, id: string): Banco {
  if (id === CATEGORIA_RESERVA) return b;
  const atribuidos = Object.fromEntries(Object.entries(b.atribuidos).filter(([, c]) => c !== id));
  return { ...b, categorias: b.categorias.filter((c) => c.id !== id), atribuidos, manuais: b.manuais.filter((p) => atribuidos[p]) };
}
export function reordenarCategoria(b: Banco, id: string, delta: -1 | 1): Banco {
  const i = b.categorias.findIndex((c) => c.id === id), j = i + delta;
  if (i < 0 || j < 0 || j >= b.categorias.length) return b;
  const lista = [...b.categorias]; [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  return { ...b, categorias: lista };
}

/** Resultado da IA: só vale pacote instalado, categoria que existe e app que você não mexeu à mão. Devolve o banco novo e quantos apps mudaram. */
export function aplicarOrganizacao(b: Banco, apps: AppInfo[], mapa: Record<string, string>): { banco: Banco; mudaram: number } {
  const instalados = new Set(apps.map((a) => a.pacote));
  const atribuidos = { ...b.atribuidos };
  let mudaram = 0;
  for (const [p, c] of Object.entries(mapa)) {
    if (!instalados.has(p) || !existe(b, c) || b.manuais.includes(p)) continue;
    const app = apps.find((a) => a.pacote === p)!;
    if (categoriaDe({ ...b, atribuidos }, app) !== c) mudaram++;
    atribuidos[p] = c;
  }
  return { banco: { ...b, atribuidos }, mudaram };
}

/** Prévia: para cada app, de onde sai e para onde vai se a IA for aplicada. */
export function previaOrganizacao(b: Banco, apps: AppInfo[], mapa: Record<string, string>): { app: AppInfo; de: string; para: string }[] {
  const { banco } = aplicarOrganizacao(b, apps, mapa);
  return apps.map((app) => ({ app, de: categoriaDe(b, app), para: categoriaDe(banco, app) })).filter((x) => x.de !== x.para);
}

/** Organização só com o aparelho: tira o que a IA guardou (mantém o que você mexeu à mão). */
export function organizarNoAparelho(b: Banco): Banco {
  return { ...b, atribuidos: Object.fromEntries(Object.entries(b.atribuidos).filter(([p]) => b.manuais.includes(p))) };
}
