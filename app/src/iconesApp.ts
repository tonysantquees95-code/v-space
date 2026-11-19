// Ícone próprio de cada app: a pessoa escolhe uma imagem da galeria; ela é recortada em quadrado, reduzida e guardada só neste aparelho.
import { useSyncExternalStore } from "react";

const CHAVE = "vhome.icones-app";
export const MAX_ICONES_APP = 60;
export const LADO_ICONE = 144;

let atual: Record<string, string> | null = null;
const ouvintes = new Set<() => void>();

/** Só aceita pacote de app e imagem em texto (data URL) de tamanho razoável. */
export function limparIcones(x: unknown): Record<string, string> {
  const r: Record<string, string> = {};
  if (!x || typeof x !== "object") return r;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (Object.keys(r).length >= MAX_ICONES_APP) break;
    if (/^[A-Za-z0-9._]{1,200}$/.test(k) && typeof v === "string" && v.startsWith("data:image/") && v.length < 60_000) r[k] = v;
  }
  return r;
}
export function lerIconesApp(): Record<string, string> {
  if (atual) return atual;
  try { atual = limparIcones(JSON.parse(localStorage.getItem(CHAVE) ?? "{}")); } catch { atual = {}; }
  return atual;
}
/** null = voltar ao ícone original. false se o aparelho não deixou guardar. */
export function definirIconeApp(pacote: string, url: string | null): boolean {
  const novo = { ...lerIconesApp() };
  if (url) novo[pacote] = url; else delete novo[pacote];
  const limpo = limparIcones(novo);
  try { localStorage.setItem(CHAVE, JSON.stringify(limpo)); } catch { return false; }
  atual = limpo; ouvintes.forEach((f) => f());
  return true;
}
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
export function useIconeApp(pacote: string): string | undefined { return useSyncExternalStore(assinar, () => lerIconesApp()[pacote], () => undefined); }

/** Abre a galeria e devolve a imagem recortada em quadrado. null = desistiu ou não deu para ler. */
export function escolherIcone(): Promise<string | null> {
  return new Promise((resolve) => {
    const i = document.createElement("input");
    i.type = "file"; i.accept = "image/*";
    i.onchange = async () => {
      const f = i.files?.[0];
      if (!f) { resolve(null); return; }
      try {
        const bmp = await createImageBitmap(f);
        const lado = Math.min(bmp.width, bmp.height);
        const c = document.createElement("canvas"); c.width = LADO_ICONE; c.height = LADO_ICONE;
        c.getContext("2d")!.drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, LADO_ICONE, LADO_ICONE);
        resolve(c.toDataURL("image/png"));
      } catch { resolve(null); }
    };
    i.oncancel = () => resolve(null);
    i.click();
  });
}
