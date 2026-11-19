// A ponte entre o launcher e o aparelho. No Android é o plugin nativo "VetorialHome"; no navegador (teste) é o motor de demonstração.
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { AppInfo } from "./dados.ts";
import type { Bateria, Evento } from "./widgets";

export interface Musica { tem: boolean; pacote?: string; app?: string; titulo?: string; artista?: string; tocando?: boolean; capa?: string }
export interface Sistema { wifi: boolean; movel: boolean; volume: number }
export type ComandoMusica = "pausar" | "tocar" | "proxima" | "anterior" | "parar";
export type TelaAjuste = "wifi" | "rede" | "bateria";
/** Widget de outro app que dá para colocar na tela inicial. `previa` é uma imagem PNG em base64. */
export interface ExternoInfo { provider: string; pacote: string; app: string; nome: string; w: number; h: number; previa?: string }
/** Posição de um widget real na tela: retângulo inteiro (x, y, w, h) e a parte visível (cx, cy, cw, ch), em px CSS. */
export interface ItemExterno { id: number; x: number; y: number; w: number; h: number; cx: number; cy: number; cw: number; ch: number }
export interface Contato { nome: string; numero: string }
export interface EventosExternos { longo: (id: number) => void; rolar: (dy: number) => void }
import { motorDemo } from "./demo";

export interface Motor {
  nome: "demo" | "android";
  apps(): Promise<AppInfo[]>;
  abrir(pacote: string): Promise<void>;
  detalhes(pacote: string): Promise<void>;
  abrirUrl(url: string): Promise<void>;
  desinstalar(pacote: string): Promise<void>;
  aoMudarApps(cb: () => void): () => void;
  ehPadrao(): Promise<boolean>;
  pedirPadrao(): Promise<void>;
  abrirAjustesInicio(): Promise<void>;
  salvarArquivo(nome: string, texto: string): Promise<boolean>;
  lerArquivo(): Promise<string | null>;
  bateria(): Promise<Bateria | null>;
  barras(): Promise<{ topo: number; base: number; esq: number; dir: number; teclado: number }>;
  agendaPermitida(): Promise<boolean>;
  pedirAgenda(): Promise<boolean>;
  eventos(): Promise<Evento[]>;
  musicaPermitida(): Promise<boolean>;
  pedirMusica(): Promise<void>;
  musica(): Promise<Musica>;
  musicaComando(acao: ComandoMusica): Promise<void>;
  sistema(): Promise<Sistema>;
  mostrarVolume(): Promise<void>;
  abrirAjuste(tela: TelaAjuste): Promise<void>;
  widgetsExternos(): Promise<ExternoInfo[]>;
  criarWidgetExterno(provider: string): Promise<{ id: number; w: number; h: number }>;
  removerWidgetExterno(id: number): Promise<void>;
  mostrarExternos(itens: ItemExterno[]): Promise<void>;
  aoEventoExterno(ev: EventosExternos): () => void;
  selos(): Promise<Record<string, number>>;
  contatosPermitidos(): Promise<boolean>;
  pedirContatos(): Promise<boolean>;
  buscarContatos(texto: string): Promise<Contato[]>;
  discar(numero: string): Promise<void>;
}

interface PluginWidgets {
  listar(): Promise<{ widgets: ExternoInfo[] }>;
  criar(o: { provider: string }): Promise<{ id: number; w: number; h: number }>;
  remover(o: { id: number }): Promise<void>;
  mostrar(o: { itens: ItemExterno[] }): Promise<void>;
  addListener(evento: "widgetLongo", cb: (o: { id: number }) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(evento: "widgetRolar", cb: (o: { dy: number }) => void): Promise<{ remove: () => Promise<void> }>;
}

interface PluginNativo {
  listarApps(): Promise<{ apps: { pacote: string; nome: string; icone?: string; instalado?: number }[] }>;
  abrir(o: { pacote: string }): Promise<void>;
  detalhes(o: { pacote: string }): Promise<void>;
  abrirUrl(o: { url: string }): Promise<void>;
  desinstalar(o: { pacote: string }): Promise<void>;
  ehPadrao(): Promise<{ padrao: boolean }>;
  pedirPadrao(): Promise<void>;
  abrirAjustesInicio(): Promise<void>;
  salvarArquivo(o: { nome: string; texto: string }): Promise<{ ok: boolean }>;
  lerArquivo(): Promise<{ texto: string | null }>;
  bateria(): Promise<{ nivel: number; carregando: boolean }>;
  barras(): Promise<{ topo: number; base: number; esq: number; dir: number; teclado: number }>;
  agendaPermitida(): Promise<{ permitida: boolean }>;
  pedirAgenda(): Promise<{ permitida: boolean }>;
  eventosHoje(): Promise<{ eventos: { titulo: string; inicio: number; fim: number; diaTodo: boolean }[] }>;
  musicaPermitida(): Promise<{ permitida: boolean }>;
  pedirMusica(): Promise<void>;
  musica(): Promise<Musica>;
  musicaComando(o: { acao: string }): Promise<void>;
  sistema(): Promise<Sistema>;
  mostrarVolume(): Promise<void>;
  abrirAjuste(o: { tela: string }): Promise<void>;
  selos(): Promise<{ contagem: Record<string, number> }>;
  contatosPermitidos(): Promise<{ permitida: boolean }>;
  pedirContatos(): Promise<{ permitida: boolean }>;
  buscarContatos(o: { texto: string }): Promise<{ contatos: { nome: string; numero: string }[] }>;
  discar(o: { numero: string }): Promise<void>;
  addListener(evento: "appsMudaram", cb: () => void): Promise<{ remove: () => Promise<void> }>;
}

function criarAndroid(): Motor {
  const n = registerPlugin<PluginNativo>("VetorialHome");
  const w = registerPlugin<PluginWidgets>("VetorialWidgets");
  return {
    nome: "android",
    apps: async () => (await n.listarApps()).apps.map((a) => ({ pacote: a.pacote, nome: a.nome, icone: a.icone ? `data:image/png;base64,${a.icone}` : undefined, instalado: typeof a.instalado === "number" && a.instalado > 0 ? a.instalado : undefined })),
    abrir: (pacote) => n.abrir({ pacote }),
    detalhes: (pacote) => n.detalhes({ pacote }),
    abrirUrl: (url) => n.abrirUrl({ url }),
    desinstalar: (pacote) => n.desinstalar({ pacote }),
    aoMudarApps: (cb) => {
      let fim: (() => Promise<void>) | null = null; let parou = false;
      void n.addListener("appsMudaram", cb).then((h) => { if (parou) void h.remove(); else fim = h.remove; });
      return () => { parou = true; if (fim) void fim(); };
    },
    ehPadrao: async () => (await n.ehPadrao()).padrao,
    pedirPadrao: () => n.pedirPadrao(),
    abrirAjustesInicio: () => n.abrirAjustesInicio(),
    salvarArquivo: async (nome, texto) => (await n.salvarArquivo({ nome, texto })).ok,
    lerArquivo: async () => (await n.lerArquivo()).texto,
    barras: async () => { try { const b = await n.barras(); const f = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(200, x)) : 0); return { topo: f(b.topo), base: f(b.base), esq: f(b.esq), dir: f(b.dir), teclado: f(b.teclado ?? 0) }; } catch { return { topo: 0, base: 0, esq: 0, dir: 0, teclado: 0 }; } },
    bateria: async () => { try { const b = await n.bateria(); return Number.isFinite(b.nivel) ? { nivel: Math.max(0, Math.min(100, Math.round(b.nivel))), carregando: !!b.carregando } : null; } catch { return null; } },
    agendaPermitida: async () => { try { return (await n.agendaPermitida()).permitida; } catch { return false; } },
    pedirAgenda: async () => { try { return (await n.pedirAgenda()).permitida; } catch { return false; } },
    eventos: async () => { try { return (await n.eventosHoje()).eventos.slice(0, 4).map((e) => ({ titulo: String(e.titulo || "Sem título").slice(0, 60), inicio: Number(e.inicio), fim: Number(e.fim), diaTodo: !!e.diaTodo })); } catch { return []; } },
    musicaPermitida: async () => { try { return (await n.musicaPermitida()).permitida; } catch { return false; } },
    pedirMusica: () => n.pedirMusica(),
    musica: async () => {
      try {
        const x = await n.musica();
        if (!x || !x.tem) return { tem: false };
        const capa = typeof x.capa === "string" && x.capa.startsWith("data:image/jpeg;base64,") && x.capa.length < 60_000 ? x.capa : undefined;
        return { tem: true, pacote: String(x.pacote ?? "").slice(0, 200), app: String(x.app ?? "").slice(0, 40), titulo: String(x.titulo ?? "").slice(0, 120), artista: String(x.artista ?? "").slice(0, 120), tocando: !!x.tocando, capa };
      } catch { return { tem: false }; }
    },
    musicaComando: (acao) => n.musicaComando({ acao }),
    sistema: async () => { try { const s = await n.sistema(); return { wifi: !!s.wifi, movel: !!s.movel, volume: Number.isFinite(s.volume) ? Math.max(0, Math.min(100, Math.round(s.volume))) : 0 }; } catch { return { wifi: false, movel: false, volume: 0 }; } },
    mostrarVolume: () => n.mostrarVolume(),
    abrirAjuste: (tela) => n.abrirAjuste({ tela }),
    selos: async () => {
      try {
        const r: Record<string, number> = {};
        for (const [k, v] of Object.entries((await n.selos()).contagem ?? {})) if (typeof v === "number" && v > 0 && k.length < 200) r[k] = Math.min(999, Math.round(v));
        return r;
      } catch { return {}; }
    },
    contatosPermitidos: async () => { try { return (await n.contatosPermitidos()).permitida; } catch { return false; } },
    pedirContatos: async () => { try { return (await n.pedirContatos()).permitida; } catch { return false; } },
    buscarContatos: async (texto) => { try { return (await n.buscarContatos({ texto })).contatos.slice(0, 5).map((x) => ({ nome: String(x.nome).slice(0, 80), numero: String(x.numero).slice(0, 30) })); } catch { return []; } },
    discar: (numero) => n.discar({ numero }),
    widgetsExternos: async () => {
      try {
        return (await w.listar()).widgets.filter((x) => x && typeof x.provider === "string" && /^[\w.]+\/[\w.$]+$/.test(x.provider)).slice(0, 300).map((x) => ({
          provider: x.provider, pacote: String(x.pacote ?? "").slice(0, 200), app: String(x.app ?? "").slice(0, 60), nome: String(x.nome ?? "").slice(0, 60),
          w: Math.max(1, Math.min(4, Math.round(Number(x.w) || 2))), h: Math.max(1, Math.min(8, Math.round(Number(x.h) || 2))),
          previa: typeof x.previa === "string" && x.previa.length < 400_000 ? x.previa : undefined,
        }));
      } catch { return []; }
    },
    criarWidgetExterno: async (provider) => { const r = await w.criar({ provider }); return { id: Math.round(r.id), w: Math.max(1, Math.min(4, Math.round(r.w) || 2)), h: Math.max(1, Math.min(8, Math.round(r.h) || 2)) }; },
    removerWidgetExterno: async (id) => { try { await w.remover({ id }); } catch { /* já saiu */ } },
    mostrarExternos: async (itens) => { try { await w.mostrar({ itens }); } catch { /* sem widgets reais agora */ } },
    aoEventoExterno: (ev) => {
      const fins: (() => Promise<void>)[] = []; let parou = false;
      void w.addListener("widgetLongo", (o) => ev.longo(o.id)).then((h) => { if (parou) void h.remove(); else fins.push(h.remove); });
      void w.addListener("widgetRolar", (o) => ev.rolar(o.dy)).then((h) => { if (parou) void h.remove(); else fins.push(h.remove); });
      return () => { parou = true; fins.forEach((f) => void f()); };
    },
  };
}

export const motor: Motor = Capacitor.isNativePlatform() ? criarAndroid() : motorDemo;
