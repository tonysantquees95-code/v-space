// Motor de demonstração: usado no navegador e no teste visual (não há celular). Apps de mentira, ícones desenhados na hora.
import type { AppInfo } from "./dados.ts";
import type { Motor } from "./motor";

const CORES = ["#22d3ee", "#e879f9", "#fb923c", "#34d399", "#8ab4ff", "#f472b6", "#fbbf24", "#a78bfa", "#2dd4bf", "#fb7185"];
const icone = (nome: string, i: number): string => {
  const c = CORES[i % CORES.length]!;
  const letra = nome.trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#1b1033"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="48" y="64" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff" text-anchor="middle">${letra}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const NOMES: [string, string][] = [
  ["com.google.android.dialer", "Telefone"], ["com.google.android.apps.messaging", "Mensagens"], ["com.android.chrome", "Chrome"], ["com.google.android.GoogleCamera", "Câmera"],
  ["com.tonimarques.sextafeira", "Vênus"], ["tech.vetorial.vindex", "Vindex"], ["tech.vetorial.vortex", "Vortex"], ["tech.vetorial.velox", "Velox"], ["tech.vetorial.vyntem", "Vyntem"], ["tech.vetorial.voxix", "Voxix"], ["tech.vetorial.drive", "Vetorial Drive"],
  ["demo.galeria", "Galeria"], ["demo.relogio", "Relógio"], ["demo.calculadora", "Calculadora"], ["demo.agenda", "Agenda"], ["demo.contatos", "Contatos"], ["demo.config", "Configurações"],
  ["demo.loja", "Play Store"], ["demo.video", "Vídeos"], ["demo.zap", "WhatsApp"], ["demo.insta", "Instagram"], ["demo.mapas", "Mapas"], ["demo.email", "E-mail"],
  ["demo.fotos", "Fotos"], ["demo.musica", "Música"], ["demo.banco", "Banco Meridian"], ["demo.gov", "Gov.br"], ["demo.carteira", "Carteira Digital"], ["demo.transporte", "Transporte"],
  ["demo.comida", "Entrega de Comida"], ["demo.pagar", "Pagamentos"], ["demo.notas", "Notas"], ["demo.gravador", "Gravador"], ["demo.lanterna", "Lanterna"], ["demo.clima", "Clima"],
  ["demo.arquivos", "Arquivos"], ["demo.jogo1", "Corrida Neon"], ["demo.jogo2", "Quebra-Blocos"], ["demo.leitor", "Leitor de PDF"], ["demo.tradutor", "Tradutor"], ["demo.ações", "Ações e Cripto"],
];

let instalados: AppInfo[] = NOMES.map(([pacote, nome], i) => ({ pacote: pacote.replace(/[^A-Za-z0-9_.]/g, "_"), nome, icone: icone(nome, i), instalado: 1_700_000_000_000 + ((i * 37) % 50) * 86_400_000 }));
const ouvintes = new Set<() => void>();
const avisar = (msg: string) => { try { window.dispatchEvent(new CustomEvent("demo-aviso", { detail: msg })); } catch { /* sem janela */ } };

let demoContatos = false;
let demoTocando = true;
export const motorDemo: Motor = {
  nome: "demo",
  apps: async () => instalados.map((a) => ({ ...a })),
  abrir: async (p) => avisar(`(demonstração) abriria ${instalados.find((a) => a.pacote === p)?.nome ?? p}`),
  detalhes: async (p) => avisar(`(demonstração) informações de ${instalados.find((a) => a.pacote === p)?.nome ?? p}`),
  abrirUrl: async (url) => avisar(`(demonstração) abriria ${url}`),
  desinstalar: async (p) => { instalados = instalados.filter((a) => a.pacote !== p); ouvintes.forEach((cb) => cb()); },
  aoMudarApps: (cb) => { ouvintes.add(cb); return () => { ouvintes.delete(cb); }; },
  ehPadrao: async () => true,
  pedirPadrao: async () => avisar("(demonstração) abriria a escolha do launcher padrão"),
  abrirAjustesInicio: async () => avisar("(demonstração) abriria as configurações do app de início"),
  salvarArquivo: async (nome) => { avisar(`(demonstração) salvaria ${nome}`); return true; },
  lerArquivo: async () => null,
  bateria: async () => ({ nivel: 76, carregando: false }),
  barras: async () => ({ topo: 0, base: 0, esq: 0, dir: 0, teclado: 0 }),
  musicaPermitida: async () => true,
  pedirMusica: async () => avisar("(demonstração) abriria o acesso às notificações"),
  musica: async () => ({ tem: true, pacote: "com.deezer.android", app: "Deezer", titulo: "From Now On", artista: "The Features", tocando: demoTocando }),
  musicaComando: async (a) => { if (a === "pausar" || a === "parar") demoTocando = false; else if (a === "tocar") demoTocando = true; else avisar(`(demonstração) ${a}`); },
  sistema: async () => ({ wifi: true, movel: true, volume: 40 }),
  mostrarVolume: async () => avisar("(demonstração) mostraria o volume"),
  abrirAjuste: async (t) => avisar(`(demonstração) abriria os ajustes de ${t}`),
  selos: async () => ({ "demo.musica": 3, "demo.gov": 1 }),
  contatosPermitidos: async () => demoContatos,
  pedirContatos: async () => { demoContatos = true; return true; },
  buscarContatos: async (t) => [{ nome: "Maria Souza", numero: "(51) 99999-0001" }, { nome: "Mário Lima", numero: "(51) 99999-0002" }].filter((x) => x.nome.toLowerCase().includes(t.toLowerCase())),
  discar: async (n) => avisar(`(demonstração) abriria o discador com ${n}`),
  widgetsExternos: async () => [
    { provider: "com.google.android.calendar/Agenda", pacote: "com.google.android.calendar", app: "Agenda", nome: "Compromissos no dia", w: 2, h: 2 },
    { provider: "com.google.android.calendar/Mes", pacote: "com.google.android.calendar", app: "Agenda", nome: "Visualização por mês", w: 4, h: 4 },
    { provider: "com.google.android.apps.wellbeing/Tempo", pacote: "com.google.android.apps.wellbeing", app: "Bem-estar Digital", nome: "Seu tempo de tela", w: 2, h: 2 },
  ],
  criarWidgetExterno: async (provider) => ({ id: 100 + (provider.length % 50), w: provider.endsWith("Mes") ? 4 : 2, h: provider.endsWith("Mes") ? 4 : 2 }),
  removerWidgetExterno: async () => undefined,
  mostrarExternos: async () => ({}),
  aoEventoExterno: () => () => undefined,
  agendaPermitida: async () => true,
  pedirAgenda: async () => true,
  eventos: async () => {
    const h = (hh: number, mm = 0) => { const x = new Date(); x.setHours(hh, mm, 0, 0); return x.getTime(); };
    return [{ titulo: "Reunião de equipe", inicio: h(23, 59), fim: h(23, 59) + 3_600_000, diaTodo: false }, { titulo: "Dentista", inicio: h(9) + 86_400_000, fim: h(10) + 86_400_000, diaTodo: false }];
  },
};
