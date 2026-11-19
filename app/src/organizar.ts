// Pede ao servidor para a IA separar os apps em categorias. Só vão NOMES de apps e de categorias (nada pessoal).
import { SERVIDOR, ehNativo } from "./atualizacao";
import { categoriaDe } from "./categorias.ts";
import type { AppInfo, Banco } from "./dados.ts";

export const MAX_APPS_IA = 400;

/** Mapa { pacote: idDaCategoria } vindo da IA. Lança Error com texto simples para mostrar à pessoa. */
export async function organizarComIA(banco: Banco, apps: AppInfo[]): Promise<Record<string, string>> {
  const lista = apps.filter((a) => !banco.ocultos.includes(a.pacote) && !banco.manuais.includes(a.pacote)).slice(0, MAX_APPS_IA);
  if (!lista.length) return {};
  if (!ehNativo()) {
    // modo de demonstração (navegador / teste visual): resposta de mentirinha, sem rede, para dar para ver a tela
    await new Promise((r) => setTimeout(r, 400));
    const mapa: Record<string, string> = {};
    lista.forEach((a, i) => { if (i % 4 === 1) mapa[a.pacote] = categoriaDe(banco, a) === "produtividade" ? "ferramentas" : "produtividade"; });
    return mapa;
  }
  let r: Response;
  try {
    r = await fetch(`${SERVIDOR}/organizar`, {
      method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({ categorias: banco.categorias.map((c) => ({ id: c.id, nome: c.nome })), apps: lista.map((a) => ({ pacote: a.pacote, nome: a.nome })) }),
    });
  } catch { throw new Error("Sem internet agora. A organização do aparelho continua valendo."); }
  if (r.status === 429) throw new Error("Muitos pedidos seguidos. Tente de novo daqui a pouco.");
  if (r.status === 503) throw new Error("A IA ainda não está ligada no servidor.");
  if (!r.ok) throw new Error("A IA não respondeu agora. Tente de novo.");
  const j = (await r.json().catch(() => null)) as { mapa?: unknown } | null;
  const mapa: Record<string, string> = {};
  if (j?.mapa && typeof j.mapa === "object") for (const [p, c] of Object.entries(j.mapa as Record<string, unknown>)) if (typeof c === "string") mapa[p] = c;
  return mapa;
}
