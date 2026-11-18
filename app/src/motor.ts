// A ponte entre o launcher e o aparelho. No Android é o plugin nativo "VetorialHome"; no navegador (teste) é o motor de demonstração.
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { AppInfo } from "./dados.ts";
import { motorDemo } from "./demo";

export interface Motor {
  nome: "demo" | "android";
  apps(): Promise<AppInfo[]>;
  abrir(pacote: string): Promise<void>;
  detalhes(pacote: string): Promise<void>;
  desinstalar(pacote: string): Promise<void>;
  aoMudarApps(cb: () => void): () => void;
  ehPadrao(): Promise<boolean>;
  pedirPadrao(): Promise<void>;
  abrirAjustesInicio(): Promise<void>;
  salvarArquivo(nome: string, texto: string): Promise<boolean>;
  lerArquivo(): Promise<string | null>;
}

interface PluginNativo {
  listarApps(): Promise<{ apps: { pacote: string; nome: string; icone?: string }[] }>;
  abrir(o: { pacote: string }): Promise<void>;
  detalhes(o: { pacote: string }): Promise<void>;
  desinstalar(o: { pacote: string }): Promise<void>;
  ehPadrao(): Promise<{ padrao: boolean }>;
  pedirPadrao(): Promise<void>;
  abrirAjustesInicio(): Promise<void>;
  salvarArquivo(o: { nome: string; texto: string }): Promise<{ ok: boolean }>;
  lerArquivo(): Promise<{ texto: string | null }>;
  addListener(evento: "appsMudaram", cb: () => void): Promise<{ remove: () => Promise<void> }>;
}

function criarAndroid(): Motor {
  const n = registerPlugin<PluginNativo>("VetorialHome");
  return {
    nome: "android",
    apps: async () => (await n.listarApps()).apps.map((a) => ({ pacote: a.pacote, nome: a.nome, icone: a.icone ? `data:image/png;base64,${a.icone}` : undefined })),
    abrir: (pacote) => n.abrir({ pacote }),
    detalhes: (pacote) => n.detalhes({ pacote }),
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
  };
}

export const motor: Motor = Capacitor.isNativePlatform() ? criarAndroid() : motorDemo;
