// Selos de notificação nos ícones: só a contagem por app (o texto das notificações nunca é lido).
import { useSyncExternalStore } from "react";

let atual: Record<string, number> = {};
const ouvintes = new Set<() => void>();
export function definirSelos(novo: Record<string, number>): void {
  const a = JSON.stringify(atual), b = JSON.stringify(novo);
  if (a === b) return;
  atual = novo;
  ouvintes.forEach((f) => f());
}
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
export function useSelo(pacote: string): number { return useSyncExternalStore(assinar, () => atual[pacote] ?? 0, () => 0); }
export const textoDoSelo = (n: number): string => (n > 99 ? "99+" : String(n));
