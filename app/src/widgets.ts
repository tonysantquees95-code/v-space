// Dados dos widgets: clima (Open-Meteo, sem chave), bateria e agenda (vêm do aparelho). A parte pura é testada no Node.
/** Preferências dos widgets (Estúdio › Widgets › Geral): unidade de temperatura e primeiro dia da semana (0 = domingo, 1 = segunda, 6 = sábado). */
export type UnidadeTemp = "c" | "f";
let unidadeTemp: UnidadeTemp = "c";
let inicioSemana = 0;
export function definirPrefsWidgets(u: UnidadeTemp, semana: number): void { unidadeTemp = u === "f" ? "f" : "c"; inicioSemana = [0, 1, 6].includes(semana) ? semana : 0; }
export const primeiroDiaSemana = (): number => inicioSemana;
export const paraUnidade = (c: number): number => (unidadeTemp === "f" ? Math.round((c * 9) / 5 + 32) : c);
export const letrasDaSemana = (): string[] => { const L = ["D", "S", "T", "Q", "Q", "S", "S"]; return [...L.slice(inicioSemana), ...L.slice(0, inicioSemana)]; };
export interface Clima { temp: number; codigo: number; max: number; min: number; vento: number; dia: boolean }
export interface Evento { titulo: string; inicio: number; fim: number; diaTodo: boolean }
export interface Bateria { nivel: number; carregando: boolean }
export interface Lugar { nome: string; lat: number; lon: number }

/** Código do tempo (WMO) → palavra curta em português e um símbolo. */
export function descreverTempo(codigo: number, dia = true): { texto: string; simbolo: string } {
  if (codigo === 0) return { texto: dia ? "Céu limpo" : "Noite limpa", simbolo: dia ? "☀️" : "🌙" };
  if (codigo <= 2) return { texto: "Poucas nuvens", simbolo: dia ? "⛅" : "☁️" };
  if (codigo === 3) return { texto: "Nublado", simbolo: "☁️" };
  if (codigo === 45 || codigo === 48) return { texto: "Neblina", simbolo: "🌫️" };
  if (codigo >= 51 && codigo <= 57) return { texto: "Garoa", simbolo: "🌦️" };
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return { texto: "Chuva", simbolo: "🌧️" };
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return { texto: "Neve", simbolo: "❄️" };
  if (codigo >= 95) return { texto: "Tempestade", simbolo: "⛈️" };
  return { texto: "Tempo instável", simbolo: "🌥️" };
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Valida a resposta do Open-Meteo antes de usar (nunca confia no que vem da rede). */
export function lerClima(j: unknown): Clima | null {
  if (!j || typeof j !== "object") return null;
  const o = j as { current?: Record<string, unknown>; daily?: Record<string, unknown> };
  const c = o.current, d = o.daily;
  if (!c || !d) return null;
  const temp = num(c.temperature_2m), codigo = num(c.weather_code), vento = num(c.wind_speed_10m);
  const max = Array.isArray(d.temperature_2m_max) ? num(d.temperature_2m_max[0]) : null;
  const min = Array.isArray(d.temperature_2m_min) ? num(d.temperature_2m_min[0]) : null;
  if (temp === null || codigo === null || max === null || min === null) return null;
  return { temp: Math.round(temp), codigo, max: Math.round(max), min: Math.round(min), vento: Math.round(vento ?? 0), dia: c.is_day !== 0 };
}

export function lerLugares(j: unknown): Lugar[] {
  const r = j && typeof j === "object" ? (j as { results?: unknown }).results : null;
  if (!Array.isArray(r)) return [];
  const saida: Lugar[] = [];
  for (const x of r) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const lat = num(o.latitude), lon = num(o.longitude);
    if (typeof o.name !== "string" || lat === null || lon === null) continue;
    const regiao = typeof o.admin1 === "string" ? `, ${o.admin1}` : "";
    saida.push({ nome: `${o.name}${regiao}`.slice(0, 40), lat, lon });
  }
  return saida.slice(0, 5);
}

export async function buscarLugares(texto: string): Promise<Lugar[]> {
  const q = texto.trim();
  if (q.length < 2) return [];
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=pt&format=json`);
  if (!r.ok) throw new Error("Não consegui procurar a cidade agora.");
  return lerLugares(await r.json());
}

const CHAVE_CLIMA = "vhome.clima";
interface Guardado { chave: string; quando: number; clima: Clima }
/** Clima com cópia guardada por 30 minutos (poupa bateria e dados). Sem internet, usa a última cópia. */
async function buscarClimaC(lat: number, lon: number, agora = Date.now()): Promise<Clima> {
  const chave = `${lat},${lon}`;
  let g: Guardado | null = null;
  try { const t = localStorage.getItem(CHAVE_CLIMA); if (t) { const p = JSON.parse(t) as Guardado; if (p && p.chave === chave && lerClima({ current: { temperature_2m: p.clima.temp, weather_code: p.clima.codigo, wind_speed_10m: p.clima.vento, is_day: p.clima.dia ? 1 : 0 }, daily: { temperature_2m_max: [p.clima.max], temperature_2m_min: [p.clima.min] } })) g = p; } } catch { g = null; }
  if (g && agora - g.quando < 30 * 60_000 && agora >= g.quando) return g.clima;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
    const c = r.ok ? lerClima(await r.json()) : null;
    if (!c) throw new Error("resposta inválida");
    try { localStorage.setItem(CHAVE_CLIMA, JSON.stringify({ chave, quando: agora, clima: c })); } catch { /* sem espaço: só não guarda */ }
    return c;
  } catch (e) {
    if (g) return g.clima;
    throw e instanceof Error ? e : new Error("Sem clima agora.");
  }
}

/** "14:30", "Dia todo", ou "amanhã 09:00" para o cartão da agenda. */
export function horaDoEvento(e: Evento, agora = new Date()): string {
  if (e.diaTodo) return "Dia todo";
  const ini = new Date(e.inicio);
  const hh = ini.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const mesmoDia = ini.toDateString() === agora.toDateString();
  return mesmoDia ? hh : `amanhã ${hh}`;
}

/** Ponteiros do relógio analógico em graus (0 = 12 horas). */
export function angulosDoRelogio(d: Date): { hora: number; minuto: number } {
  const m = d.getMinutes();
  return { hora: ((d.getHours() % 12) + m / 60) * 30, minuto: m * 6 };
}

/** Dias de hoje até a data AAAA-MM-DD (negativo = já passou). Conta por dia do calendário, sem depender de horário de verão. */
export function diasAte(data: string, hoje = new Date()): number {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86_400_000);
}
/** Semanas do mês (domingo a segunda...): cada linha tem 7 posições, com null fora do mês. */
export function gradeDoMes(ano: number, mes: number): (number | null)[][] {
  const primeiro = (new Date(ano, mes, 1).getDay() - inicioSemana + 7) % 7;
  const total = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (celulas.length % 7) celulas.push(null);
  const linhas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) linhas.push(celulas.slice(i, i + 7));
  return linhas;
}
export const FRASES = [
  "Um passo pequeno hoje ainda é um passo.", "Comece pelo mais simples e o resto se organiza.", "Descansar também faz parte do trabalho.",
  "O que você repete todo dia vira quem você é.", "Foco em uma coisa de cada vez.", "Hoje é um bom dia para terminar algo.",
  "Pergunte, teste, ajuste, siga.", "Feito é melhor do que perfeito.", "Cuide de quem cuida de você.",
  "Água, ar e uma pausa: reinicia a cabeça.", "Quem planeja o dia tem mais dia.", "Pequenas vitórias somam grandes resultados.",
  "Sua versão de amanhã agradece o que você fizer hoje.", "Calma também é velocidade.", "Aprender devagar ainda é aprender.",
  "Organize a bagunça e a ideia aparece.", "O melhor momento para começar é agora.", "Gentileza não custa nada e vale muito.",
  "Respire fundo e volte para o que importa.", "Todo grande projeto começou com uma lista.", "Errar faz parte; desistir é opcional.",
  "Menos telas, mais vida real por uns minutos.", "Celebre o que já deu certo esta semana.", "Boas ideias gostam de caderno aberto.",
  "Consistência vence empolgação.", "Dê um passo, depois outro.", "Hoje: uma tarefa que você vem adiando.",
  "Quem escuta bem resolve melhor.", "Sua energia é limitada: escolha onde gastar.", "O dia rende mais com a primeira hora bem usada.",
  "Sorrir de manhã muda o resto do dia.",
] as const;
/** Mesma frase o dia todo; muda à meia-noite. */
export function fraseDoDia(d = new Date()): string {
  const dia = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return FRASES[((dia % FRASES.length) + FRASES.length) % FRASES.length]!;
}
/** Mostra minutos e segundos como 25:00. */
export const minutosSegundos = (s: number): string => { const t = Math.max(0, Math.ceil(s)); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };

export interface Previsao { horas: { h: number; temp: number; codigo: number }[]; dias: { data: string; max: number; min: number; codigo: number }[] }
/** Valida a previsão por hora e por dia do Open-Meteo. `agora` em texto local "AAAA-MM-DDTHH" para escolher a hora de partida. */
export function lerPrevisao(j: unknown, agoraLocal: string): Previsao | null {
  if (!j || typeof j !== "object") return null;
  const o = j as { hourly?: Record<string, unknown>; daily?: Record<string, unknown> };
  const h = o.hourly, d = o.daily;
  if (!h || !d || !Array.isArray(h.time) || !Array.isArray(h.temperature_2m) || !Array.isArray(h.weather_code) || !Array.isArray(d.time) || !Array.isArray(d.temperature_2m_max) || !Array.isArray(d.temperature_2m_min) || !Array.isArray(d.weather_code)) return null;
  const horas: Previsao["horas"] = [];
  const inicio = (h.time as unknown[]).findIndex((t) => typeof t === "string" && t.slice(0, 13) >= agoraLocal);
  for (let i = Math.max(0, inicio); i < h.time.length && horas.length < 8; i++) {
    const t = h.time[i], temp = num(h.temperature_2m[i]), cod = num(h.weather_code[i]);
    if (typeof t !== "string" || temp === null || cod === null) continue;
    horas.push({ h: Number(t.slice(11, 13)), temp: Math.round(temp), codigo: cod });
  }
  const dias: Previsao["dias"] = [];
  for (let i = 0; i < d.time.length && dias.length < 6; i++) {
    const t = d.time[i], mx = num(d.temperature_2m_max[i]), mn = num(d.temperature_2m_min[i]), cod = num(d.weather_code[i]);
    if (typeof t !== "string" || mx === null || mn === null || cod === null) continue;
    dias.push({ data: t, max: Math.round(mx), min: Math.round(mn), codigo: cod });
  }
  return horas.length && dias.length ? { horas, dias } : null;
}
const CHAVE_PREV = "vhome.previsao";
async function buscarPrevisaoC(lat: number, lon: number, agora = new Date()): Promise<Previsao> {
  const chave = `${lat},${lon}`;
  const local = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}T${String(agora.getHours()).padStart(2, "0")}`;
  let g: { chave: string; quando: number; dados: unknown } | null = null;
  try { const t = localStorage.getItem(CHAVE_PREV); if (t) { const p = JSON.parse(t); if (p && p.chave === chave) g = p; } } catch { /* cópia ruim: ignora */ }
  if (g && agora.getTime() - g.quando < 30 * 60_000 && agora.getTime() >= g.quando) { const p = lerPrevisao(g.dados, local); if (p) return p; }
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`);
    const j = r.ok ? await r.json() : null;
    const p = lerPrevisao(j, local);
    if (!p) throw new Error("resposta inválida");
    try { localStorage.setItem(CHAVE_PREV, JSON.stringify({ chave, quando: agora.getTime(), dados: j })); } catch { /* sem espaço */ }
    return p;
  } catch (e) {
    const p = g ? lerPrevisao(g.dados, local) : null;
    if (p) return p;
    throw e instanceof Error ? e : new Error("Sem previsão agora.");
  }
}
export const saudacao = (d = new Date()): string => (d.getHours() < 5 ? "Boa madrugada" : d.getHours() < 12 ? "Bom dia" : d.getHours() < 18 ? "Boa tarde" : "Boa noite");
/** Quanto do dia já passou, de 0 a 100. */
export const progressoDoDia = (d = new Date()): number => Math.min(100, Math.floor(((d.getHours() * 60 + d.getMinutes()) / 1440) * 100));
/** Domingo a sábado da semana de `d`, como números do dia do mês. */
export function diasDaSemana(d = new Date()): { dia: number; hoje: boolean }[] {
  const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() - inicioSemana + 7) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i); return { dia: x.getDate(), hoje: x.getDate() === d.getDate() && x.getMonth() === d.getMonth() }; });
}

/** Clima já na unidade escolhida. */
export async function buscarClima(lat: number, lon: number, agora = Date.now()): Promise<Clima> {
  const c = await buscarClimaC(lat, lon, agora);
  return unidadeTemp === "c" ? c : { ...c, temp: paraUnidade(c.temp), max: paraUnidade(c.max), min: paraUnidade(c.min) };
}
/** Previsão já na unidade escolhida. */
export async function buscarPrevisao(lat: number, lon: number, agora = new Date()): Promise<Previsao> {
  const p = await buscarPrevisaoC(lat, lon, agora);
  return unidadeTemp === "c" ? p : { horas: p.horas.map((h) => ({ ...h, temp: paraUnidade(h.temp) })), dias: p.dias.map((d) => ({ ...d, max: paraUnidade(d.max), min: paraUnidade(d.min) })) };
}
