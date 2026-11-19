// Busca universal: apps, configurações do próprio V-Space e web. Lógica pura (testada em app/teste).
import { normalizar, type AppInfo } from "./dados.ts";

export interface Ajuste { titulo: string; onde: string; destino: string; chaves: string }
/** Para onde cada configuração leva: "secao/parte" do Estúdio, ou "@organizar" (abre o Organizar com IA). */
export const AJUSTES: Ajuste[] = [
  { titulo: "As cores vêm de", onde: "Temas · Cores", destino: "temas/cores", chaves: "cor cores acento neon tema" },
  { titulo: "Escolher tema", onde: "Temas · Escolha", destino: "temas/escolha", chaves: "tema temas visual estilo" },
  { titulo: "Cenas prontas", onde: "Temas · Cenas", destino: "temas/cenas", chaves: "cena cenas pronto combinacao" },
  { titulo: "Colunas e linhas", onde: "Início · Disposição", destino: "inicio/grade", chaves: "colunas linhas grade tamanho disposicao" },
  { titulo: "Relógio na tela inicial", onde: "Início · Disposição", destino: "inicio/grade", chaves: "relogio hora data" },
  { titulo: "Forma do ícone", onde: "Início · Ícones", destino: "inicio/icones", chaves: "forma icone circulo squircle quadrado redondo" },
  { titulo: "Cor do ícone", onde: "Início · Ícones", destino: "inicio/icones", chaves: "cor icone mono tingido vivo" },
  { titulo: "Pacote de ícones", onde: "Início · Ícones", destino: "inicio/icones", chaves: "pacote icones estilo original mono tingido vivo" },
  { titulo: "Tamanho do ícone e nomes", onde: "Início · Ícones", destino: "inicio/icones", chaves: "tamanho icone rotulo rotulos etiqueta nome" },
  { titulo: "Cantos arredondados", onde: "Início · Superfície", destino: "inicio/superficie", chaves: "cantos raio arredondado vidro desfoque superficie" },
  { titulo: "Estilo do dock", onde: "Início · Dock", destino: "inicio/dock", chaves: "dock barra inferior" },
  { titulo: "Estilo das pastas", onde: "Início · Pastas", destino: "inicio/pastas", chaves: "pasta pastas" },
  { titulo: "Tela inicial: categorias ou grade", onde: "Categorias · Tela inicial", destino: "categorias/modo", chaves: "modo categorias grade favoritos trilho" },
  { titulo: "Suas categorias", onde: "Categorias · Suas categorias", destino: "categorias/lista", chaves: "categoria categorias salas renomear criar apagar ordem" },
  { titulo: "Organizar com IA", onde: "Categorias", destino: "@organizar", chaves: "organizar ia inteligencia artificial separar categorias automatico" },
  { titulo: "Estilo da gaveta", onde: "Aplicativos · Disposição", destino: "apps/gaveta", chaves: "gaveta lista grade letras" },
  { titulo: "Apps ocultos", onde: "Aplicativos · Ocultos", destino: "apps/ocultos", chaves: "ocultos esconder oculto mostrar" },
  { titulo: "Papel de parede", onde: "Papel de parede · Escolha", destino: "papel/escolha", chaves: "papel parede fundo foto galeria wallpaper" },
  { titulo: "Desfoque, escurecimento, cor e vinheta", onde: "Papel de parede · Ajustes", destino: "papel/ajustes", chaves: "desfoque blur escuro escurecimento saturacao temperatura vinheta cor" },
  { titulo: "Adicionar widget", onde: "Widgets · Adicionar", destino: "widgets/adicionar", chaves: "widget widgets relogio clima bateria agenda" },
  { titulo: "Gerenciar widgets", onde: "Widgets · Gerenciar", destino: "widgets/gerenciar", chaves: "widget widgets remover" },
  { titulo: "Vetorial ID (conta)", onde: "Configurações · Conta", destino: "config/conta", chaves: "conta vetorial id entrar sair login" },
  { titulo: "Gesto de deslizar para cima", onde: "Configurações · Gestos", destino: "config/gestos", chaves: "gesto deslizar cima pesquisa gaveta" },
  { titulo: "Faixa de atalhos (Wi-Fi, volume, bateria)", onde: "Configurações · Atalhos", destino: "config/atalhos", chaves: "atalhos wifi volume bateria faixa temperatura rede" },
  { titulo: "Player de música na tela inicial", onde: "Configurações · Atalhos", destino: "config/atalhos", chaves: "musica player tocando deezer spotify youtube notificacoes" },
  { titulo: "Bloquear layout", onde: "Configurações · Gestos", destino: "config/gestos", chaves: "bloquear layout travar trava" },
  { titulo: "Backup e restauração", onde: "Configurações · Backup", destino: "config/backup", chaves: "backup restaurar exportar importar salvar" },
  { titulo: "Ícone de cada app", onde: "Aplicativos · Ícones", destino: "apps/icones", chaves: "icone icones trocar imagem personalizar app" },
  { titulo: "Ordem da gaveta", onde: "Aplicativos · Disposição", destino: "apps/gaveta", chaves: "ordem ordenar az recentes usados gaveta" },
  { titulo: "Espaço seguro (banco e governo)", onde: "Configurações · Espaço seguro", destino: "config/seguro", chaves: "seguro espaco banco governo privado protegido segundo", },
  { titulo: "Launcher padrão", onde: "Configurações · Launcher", destino: "config/padrao", chaves: "padrao launcher inicio voltar anterior" },
  { titulo: "Procurar atualização", onde: "Configurações · Sobre", destino: "config/sobre", chaves: "atualizar atualizacao versao nova" },
  { titulo: "Sobre o V-Space", onde: "Configurações · Sobre", destino: "config/sobre", chaves: "sobre termos apresentacao tour ajuda" },
];

/** 3 = o texto começa com a busca; 2 = alguma palavra começa; 1 = contém; 0 = não casa. */
export function pontuar(texto: string, q: string): number {
  const t = normalizar(texto), b = normalizar(q);
  if (!b) return 0;
  if (t.startsWith(b)) return 3;
  if (t.split(/[^a-z0-9]+/).some((p) => p.startsWith(b))) return 2;
  return t.includes(b) ? 1 : 0;
}

/** Apps que casam, do melhor para o pior; empate: os abertos há pouco primeiro, depois ordem alfabética. */
export function buscarApps(apps: AppInfo[], q: string, recentes: string[] = []): AppInfo[] {
  const r = (p: string) => { const i = recentes.indexOf(p); return i < 0 ? 99 : i; };
  return apps.map((a) => ({ a, p: pontuar(a.nome, q) })).filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p || r(x.a.pacote) - r(y.a.pacote) || normalizar(x.a.nome).localeCompare(normalizar(y.a.nome), "pt-BR") || x.a.pacote.localeCompare(y.a.pacote)).map((x) => x.a);
}

export function buscarAjustes(q: string): Ajuste[] {
  const b = normalizar(q);
  if (!b) return [];
  return AJUSTES.map((a) => ({ a, p: Math.max(pontuar(a.titulo, q) * 2, pontuar(a.onde, q), a.chaves.split(" ").some((c) => c.startsWith(b)) ? 1 : 0) })).filter((x) => x.p > 0).sort((x, y) => y.p - x.p).map((x) => x.a);
}

export interface LinkWeb { id: string; nome: string; url: string }
export function linksWeb(q: string): LinkWeb[] {
  const t = q.trim().slice(0, 200);
  if (!t) return [];
  const e = encodeURIComponent(t);
  return [
    { id: "google", nome: `Pesquise na web por “${t}”`, url: `https://www.google.com/search?q=${e}` },
    { id: "play", nome: `Pesquisar “${t}” no Google Play`, url: `https://play.google.com/store/search?q=${e}&c=apps` },
    { id: "youtube", nome: `Pesquisar “${t}” no YouTube`, url: `https://www.youtube.com/results?search_query=${e}` },
    { id: "mapas", nome: `Procurar “${t}” no Google Maps`, url: `https://www.google.com/maps/search/?api=1&query=${e}` },
    { id: "wiki", nome: `Procurar “${t}” na Wikipédia`, url: `https://pt.wikipedia.org/w/index.php?search=${e}` },
  ];
}

/** Põe o item no começo da lista, sem repetir, até `max` itens. */
export function registrarRecente(lista: string[], item: string, max = 8): string[] {
  const i = item.trim();
  if (!i) return lista;
  return [i, ...lista.filter((x) => x !== i)].slice(0, max);
}

const CH_BUSCAS = "vspace.buscas", CH_APPS = "vspace.recentes";
const ler = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 20) : []; } catch { return []; } };
const gravar = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
export const buscasRecentes = (): string[] => ler(CH_BUSCAS);
export const guardarBusca = (q: string): void => gravar(CH_BUSCAS, registrarRecente(ler(CH_BUSCAS), q, 8));
export const limparBuscas = (): void => gravar(CH_BUSCAS, []);
export const appsRecentes = (): string[] => ler(CH_APPS);
export const guardarAppRecente = (pacote: string): void => { gravar(CH_APPS, registrarRecente(ler(CH_APPS), pacote, 12)); contarUso(pacote); };
/** Quantas vezes cada app foi aberto pelo V-Space (alimenta a categoria "Mais usados"; nada sai do aparelho). */
const CH_USOS = "vspace.usos";
export function usosDosApps(): Record<string, number> {
  try { const v = JSON.parse(localStorage.getItem(CH_USOS) ?? "{}"); if (!v || typeof v !== "object") return {}; const r: Record<string, number> = {}; for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number" && Number.isFinite(n) && n > 0 && k.length < 200) r[k] = Math.min(100000, Math.floor(n)); return r; } catch { return {}; }
}
function contarUso(pacote: string): void {
  try { const u = usosDosApps(); u[pacote] = (u[pacote] ?? 0) + 1; const top = Object.entries(u).sort((a, b) => b[1] - a[1]).slice(0, 300); localStorage.setItem(CH_USOS, JSON.stringify(Object.fromEntries(top))); } catch { /* sem armazenamento */ }
}
