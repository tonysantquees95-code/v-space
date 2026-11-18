import { bancoPadrao, limparBanco, type Banco } from "./dados.ts";

const CHAVE = "vhome.banco";
/** null = primeira abertura (nunca guardou nada). */
export function lerBanco(): Banco | null {
  try { const t = localStorage.getItem(CHAVE); return t ? limparBanco(JSON.parse(t)) : null; } catch { return null; }
}
export function guardarBanco(b: Banco): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(b)); } catch { /* sem armazenamento: perde só a próxima abertura */ }
}
export const bancoOuPadrao = (): Banco => lerBanco() ?? bancoPadrao();
