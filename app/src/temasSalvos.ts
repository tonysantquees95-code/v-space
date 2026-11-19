// Temas guardados pela pessoa e o código para compartilhar/importar. Tudo passa por limparTema.
import { limparTema, type Tema } from "./dados.ts";

export interface TemaSalvo { id: string; nome: string; tema: Tema }
export const MAX_SALVOS = 12;
const CHAVE = "vhome.temas-salvos";
const PREFIXO = "VSPACE1:";

export function limparSalvos(x: unknown): TemaSalvo[] {
  if (!Array.isArray(x)) return [];
  const r: TemaSalvo[] = [];
  for (const e of x) {
    if (r.length >= MAX_SALVOS || !e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const nome = typeof o.nome === "string" ? o.nome.trim().slice(0, 24) : "";
    if (!nome || typeof o.id !== "string" || !/^[a-z0-9-]{1,30}$/.test(o.id)) continue;
    r.push({ id: o.id, nome, tema: limparTema(o.tema) });
  }
  return r;
}
export function lerSalvos(): TemaSalvo[] { try { return limparSalvos(JSON.parse(localStorage.getItem(CHAVE) ?? "[]")); } catch { return []; } }
export function gravarSalvos(l: TemaSalvo[]): boolean { try { localStorage.setItem(CHAVE, JSON.stringify(limparSalvos(l))); return true; } catch { return false; } }
/** Junta um tema novo à lista (o mais novo primeiro); null se a lista já está cheia. */
export function juntarSalvo(lista: TemaSalvo[], nome: string, tema: Tema, id = `t${Date.now().toString(36)}`): TemaSalvo[] | null {
  const n = nome.trim().slice(0, 24);
  if (!n || lista.length >= MAX_SALVOS) return null;
  return [{ id, nome: n, tema: limparTema(tema) }, ...lista];
}
export const tirarSalvo = (lista: TemaSalvo[], id: string): TemaSalvo[] => lista.filter((x) => x.id !== id);

const paraB64 = (s: string): string => { const b = new TextEncoder().encode(s); let t = ""; for (const x of b) t += String.fromCharCode(x); return btoa(t); };
const deB64 = (s: string): string => { const t = atob(s); return new TextDecoder().decode(Uint8Array.from(t, (ch) => ch.charCodeAt(0))); };
export const codigoDoTema = (t: Tema): string => PREFIXO + paraB64(JSON.stringify(limparTema(t)));
/** Lê um código de tema; null se não for válido. */
export function temaDoCodigo(texto: string): Tema | null {
  const s = texto.trim();
  if (!s.startsWith(PREFIXO) || s.length > 4000) return null;
  try { const o = JSON.parse(deB64(s.slice(PREFIXO.length))); return o && typeof o === "object" ? { ...limparTema(o), id: "personalizado" } : null; } catch { return null; }
}
