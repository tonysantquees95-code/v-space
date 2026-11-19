// Atualização do V-Space (padrão da suíte): pergunta ao servidor da Vênus qual é a versão mais nova e compara com a instalada.
import { Capacitor, registerPlugin } from "@capacitor/core";

export interface InfoVersao { numero: number; tag: string; notas: string; tamanho: number; sha256: string; url: string }
export interface Progresso { estado: "parada" | "baixando" | "pronta" | "erro"; feitos: number; total: number; erro: string }

export const SERVIDOR = "https://venus-servidor.tonysantquees95.workers.dev";
const REPOSITORIO = "tonysantquees95-code/v-space";
const CHAVE = "vhome.atualizacao.conferida";

/** Número do build (run do CI) gravado na compilação. 0 = desenvolvimento/demonstração. */
export const BUILD: number = (() => { const n = Number((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BUILD); return Number.isInteger(n) && n > 0 ? n : 0; })();
export const haNovaVersao = (instalada: number, nova: number | undefined | null): boolean => instalada > 0 && !!nova && nova > instalada;
export const precisaConferir = (ultimo: number, agora: number, horas = 6): boolean => !ultimo || agora - ultimo >= horas * 3_600_000 || agora < ultimo;
export const ehNativo = (): boolean => Capacitor.isNativePlatform();

/** Só aceita endereços https do GitHub (o app nunca baixa de outro lugar). */
export function versaoValida(v: unknown): InfoVersao | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.numero !== "number" || !Number.isInteger(o.numero) || typeof o.url !== "string") return null;
  let host = "";
  try { const u = new URL(o.url); if (u.protocol !== "https:") return null; host = u.hostname; } catch { return null; }
  if (!(host === "github.com" || host.endsWith(".github.com") || host.endsWith(".githubusercontent.com"))) return null;
  return { numero: o.numero, tag: String(o.tag ?? ""), notas: String(o.notas ?? "").slice(0, 600), tamanho: Number(o.tamanho) || 0, sha256: typeof o.sha256 === "string" && /^[0-9a-f]{64}$/i.test(o.sha256) ? o.sha256.toLowerCase() : "", url: o.url };
}

async function doGithub(): Promise<InfoVersao | null> {
  const r = await fetch(`https://api.github.com/repos/${REPOSITORIO}/releases/latest`, { cache: "no-store", headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) return null;
  const o = (await r.json()) as { tag_name?: string; body?: string; assets?: { name?: string; size?: number; digest?: string; browser_download_url?: string }[] };
  const m = /^v?1\.(\d+)$/.exec(o.tag_name ?? "");
  const arq = (o.assets ?? []).find((a) => /^V-Space\.apk$/i.test(a.name ?? ""));
  if (!m || !arq) return null;
  const dig = String(arq.digest ?? "");
  return versaoValida({ numero: Number(m[1]), tag: o.tag_name, notas: o.body, tamanho: arq.size, sha256: dig.toLowerCase().startsWith("sha256:") ? dig.slice(7) : "", url: arq.browser_download_url });
}

export async function procurarVersao(): Promise<InfoVersao> {
  try { const r = await fetch(`${SERVIDOR}/atualizacao?app=vspace-android`, { cache: "no-store" }); if (r.ok) { const v = versaoValida(await r.json()); if (v) return v; } } catch { /* cai para o GitHub */ }
  try { const v = await doGithub(); if (v) return v; } catch { /* sem internet */ }
  throw new Error("Não consegui consultar as atualizações agora. Confira a internet e tente de novo.");
}

interface PluginAtu { baixarAtualizacao(o: { url: string; sha256: string; tamanho: number }): Promise<void>; progressoAtualizacao(): Promise<Progresso>; instalarBaixada(): Promise<void> }
const plugin = (): PluginAtu => registerPlugin<PluginAtu>("Atualizador");
export const baixar = (v: InfoVersao) => plugin().baixarAtualizacao({ url: v.url, sha256: v.sha256, tamanho: v.tamanho });
export const progresso = () => plugin().progressoAtualizacao();
export const instalar = () => plugin().instalarBaixada();

export function marcarConferida(): void { try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* confere de novo na próxima */ } }
export function ultimaConferencia(): number { try { return Number(localStorage.getItem(CHAVE)) || 0; } catch { return 0; } }
