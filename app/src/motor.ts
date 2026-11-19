// A ponte entre o launcher e o aparelho. No Android é o plugin nativo "VetorialHome"; no navegador (teste) é o motor de demonstração.
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { AppInfo } from "./dados.ts";
import type { Bateria, Evento } from "./widgets";
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
  agendaPermitida(): Promise<boolean>;
  pedirAgenda(): Promise<boolean>;
  eventos(): Promise<Evento[]>;
}

interface PluginNativo {
  listarApps(): Promise<{ apps: { pacote: string; nome: string; icone?: string }[] }>;
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
  agendaPermitida(): Promise<{ permitida: boolean }>;
  pedirAgenda(): Promise<{ permitida: boolean }>;
  eventosHoje(): Promise<{ eventos: { titulo: string; inicio: number; fim: number; diaTodo: boolean }[] }>;
  addListener(evento: "appsMudaram", cb: () => void): Promise<{ remove: () => Promise<void> }>;
}

function criarAndroid(): Motor {
  const n = registerPlugin<PluginNativo>("VetorialHome");
  return {
    nome: "android",
    apps: async () => (await n.listarApps()).apps.map((a) => ({ pacote: a.pacote, nome: a.nome, icone: a.icone ? `data:image/png;base64,${a.icone}` : undefined })),
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
    bateria: async () => { try { const b = await n.bateria(); return Number.isFinite(b.nivel) ? { nivel: Math.max(0, Math.min(100, Math.round(b.nivel))), carregando: !!b.carregando } : null; } catch { return null; } },
    agendaPermitida: async () => { try { return (await n.agendaPermitida()).permitida; } catch { return false; } },
    pedirAgenda: async () => { try { return (await n.pedirAgenda()).permitida; } catch { return false; } },
    eventos: async () => { try { return (await n.eventosHoje()).eventos.slice(0, 4).map((e) => ({ titulo: String(e.titulo || "Sem título").slice(0, 60), inicio: Number(e.inicio), fim: Number(e.fim), diaTodo: !!e.diaTodo })); } catch { return []; } },
  };
}

export const motor: Motor = Capacitor.isNativePlatform() ? criarAndroid() : motorDemo;
