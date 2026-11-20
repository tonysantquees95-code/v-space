// Cenas da própria pessoa: guarda só as partes escolhidas da aparência (cores, ícones, superfície, ajustes do papel) e aplica depois.
import { limparTema, type Banco, type Tema } from "./dados.ts";

export type ParteCena = "cores" | "icones" | "superficie" | "papel";
export const PARTES_CENA: { id: ParteCena; nome: string; texto: string; campos: (keyof Tema)[] }[] = [
  { id: "cores", nome: "Cores e fundo", texto: "Cor principal, cor de apoio e fundo.", campos: ["cor", "cor2", "fundo", "fundoCor"] },
  { id: "icones", nome: "Ícones", texto: "Forma, tamanho, rótulos, pacote e saturação das cores.", campos: ["forma", "tamanho", "rotulos", "pacote", "cores"] },
  { id: "superficie", nome: "Superfície e dock", texto: "Vidro/acrílico, dock, pastas e cantos.", campos: ["dock", "superficie", "intensidade", "pasta", "pastaAbre", "cantos", "gaveta", "botoes"] },
  { id: "papel", nome: "Ajustes do papel", texto: "Desfoque, escurecimento, saturação, temperatura, vinheta e luz do dia.", campos: ["desfoque", "escuro", "saturacao", "temperatura", "vinheta", "luz"] },
];
export interface CenaMinha { id: string; nome: string; partes: ParteCena[]; valores: Partial<Tema> }
export const MAX_CENAS_MINHAS = 12;
const CHAVE = "vhome.cenas-minhas";
const CAMPOS = new Set<string>(PARTES_CENA.flatMap((p) => p.campos as string[]));

/** Pega do tema só os campos das partes escolhidas. */
export function recortarTema(t: Tema, partes: ParteCena[]): Partial<Tema> {
  const r: Record<string, unknown> = {};
  for (const p of PARTES_CENA) if (partes.includes(p.id)) for (const k of p.campos) r[k as string] = t[k];
  return r as Partial<Tema>;
}
export function limparCenasMinhas(x: unknown): CenaMinha[] {
  if (!Array.isArray(x)) return [];
  const r: CenaMinha[] = [];
  for (const e of x) {
    if (r.length >= MAX_CENAS_MINHAS || !e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const nome = typeof o.nome === "string" ? o.nome.trim().slice(0, 24) : "";
    if (!nome || typeof o.id !== "string" || !/^[a-z0-9-]{1,30}$/.test(o.id)) continue;
    const partes = (Array.isArray(o.partes) ? o.partes : []).filter((p): p is ParteCena => PARTES_CENA.some((q) => q.id === p));
    if (!partes.length || !o.valores || typeof o.valores !== "object") continue;
    const v: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(o.valores as Record<string, unknown>)) if (CAMPOS.has(k)) v[k] = val;
    r.push({ id: o.id, nome, partes: Array.from(new Set(partes)), valores: v as Partial<Tema> });
  }
  return r;
}
export function lerCenasMinhas(): CenaMinha[] { try { return limparCenasMinhas(JSON.parse(localStorage.getItem(CHAVE) ?? "[]")); } catch { return []; } }
export function gravarCenasMinhas(l: CenaMinha[]): boolean { try { localStorage.setItem(CHAVE, JSON.stringify(limparCenasMinhas(l))); return true; } catch { return false; } }
/** Junta uma cena nova (a mais nova primeiro); null se faltou nome, parte escolhida ou lugar. */
export function juntarCena(lista: CenaMinha[], nome: string, partes: ParteCena[], tema: Tema, id = `c${Date.now().toString(36)}`): CenaMinha[] | null {
  const n = nome.trim().slice(0, 24);
  if (!n || !partes.length || lista.length >= MAX_CENAS_MINHAS) return null;
  return [{ id, nome: n, partes: [...partes], valores: recortarTema(tema, partes) }, ...lista];
}
export const tirarCena = (lista: CenaMinha[], id: string): CenaMinha[] => lista.filter((c) => c.id !== id);
/** Aplica só as partes guardadas; o resto da aparência fica como está. */
export function aplicarCenaMinha(b: Banco, c: CenaMinha): Banco {
  return { ...b, tema: { ...limparTema({ ...b.tema, ...c.valores }), id: "personalizado" } };
}
