// Dados dos widgets: clima (Open-Meteo, sem chave), bateria e agenda (vêm do aparelho). A parte pura é testada no Node.
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
export async function buscarClima(lat: number, lon: number, agora = Date.now()): Promise<Clima> {
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
