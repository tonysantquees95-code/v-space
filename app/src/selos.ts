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
let ligado = true;
export function ligarSelos(v: boolean): void { if (v !== ligado) { ligado = v; ouvintes.forEach((f) => f()); } }
export function useSelo(pacote: string): number { return useSyncExternalStore(assinar, () => (ligado ? atual[pacote] ?? 0 : 0), () => 0); }
let pontoNovo = false;
export function ligarPontoNovo(v: boolean): void { if (v !== pontoNovo) { pontoNovo = v; ouvintes.forEach((f) => f()); } }
export const usePontoNovoLigado = (): boolean => useSyncExternalStore(assinar, () => pontoNovo, () => false);
/** App instalado há menos de 3 dias e que ainda não foi aberto pelo V-Space. */
export const ehNovo = (instalado: number | undefined, usos: number, agora = Date.now()): boolean => !!instalado && usos === 0 && agora - instalado < 3 * 24 * 3600 * 1000 && agora >= instalado;
export const textoDoSelo = (n: number): string => (n > 99 ? "99+" : String(n));
