// Papel de parede da tela inicial: a foto fica guardada no aparelho (reduzida), os ajustes (desfoque e escurecimento) ficam no tema.
// Sem imports de fora, para o teste do Node rodar a parte pura.
const CHAVE = "vhome.papel";
export const LADO_MAX = 1440;

/** Quanto reduzir uma foto para o maior lado ficar em `max` (nunca amplia). */
export function escalaPara(largura: number, altura: number, max = LADO_MAX): number {
  const m = Math.max(largura, altura);
  return m > max && m > 0 ? max / m : 1;
}

export function lerPapel(): string | null {
  try { const v = localStorage.getItem(CHAVE); return v && v.startsWith("data:image/") ? v : null; } catch { return null; }
}
/** false se o aparelho não deixou guardar (sem espaço). */
export function guardarPapel(url: string): boolean {
  try { localStorage.setItem(CHAVE, url); return true; } catch { return false; }
}
export function apagarPapel(): void { try { localStorage.removeItem(CHAVE); } catch { /* nada a apagar */ } }

/** Foto da galeria → imagem JPEG reduzida, em texto (data URL). null se não der para ler. */
export async function reduzir(arquivo: Blob): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(arquivo);
    const k = escalaPara(bmp.width, bmp.height);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } catch { return null; }
}

/** Abre a galeria do aparelho. null = a pessoa desistiu. */
export function escolherFoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const i = document.createElement("input");
    i.type = "file"; i.accept = "image/*";
    i.onchange = async () => { const f = i.files?.[0]; resolve(f ? await reduzir(f) : null); };
    i.oncancel = () => resolve(null);
    i.click();
  });
}

export interface Pronto { id: string; nome: string; cores: [string, string, string] }
export const PRONTOS: Pronto[] = [
  { id: "aurora", nome: "Aurora", cores: ["#0b1020", "#22d3ee", "#e879f9"] },
  { id: "por-do-sol", nome: "Pôr do sol", cores: ["#1a0b2e", "#fb923c", "#f43f5e"] },
  { id: "oceano", nome: "Oceano", cores: ["#031526", "#38bdf8", "#2dd4bf"] },
  { id: "floresta", nome: "Floresta", cores: ["#04100b", "#34d399", "#a3e635"] },
  { id: "nebulosa", nome: "Nebulosa", cores: ["#12081a", "#a78bfa", "#f472b6"] },
  { id: "ouro", nome: "Ouro", cores: ["#14080a", "#fbbf24", "#fb923c"] },
];

/** Desenha um papel pronto (degradê, brilhos e o V neon da Vetorial) e devolve a imagem em texto. `largura` define o tamanho (altura = 2×). */
export function desenharPronto(p: Pronto, largura = 720): string {
  const w = largura, h = largura * 2, [base, c1, c2] = p.cores;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const g1 = x.createRadialGradient(w * 0.15, h * 0.12, 0, w * 0.15, h * 0.12, h * 0.55); g1.addColorStop(0, c1 + "88"); g1.addColorStop(1, c1 + "00"); x.fillStyle = g1; x.fillRect(0, 0, w, h);
  const g2 = x.createRadialGradient(w * 0.9, h * 0.92, 0, w * 0.9, h * 0.92, h * 0.55); g2.addColorStop(0, c2 + "88"); g2.addColorStop(1, c2 + "00"); x.fillStyle = g2; x.fillRect(0, 0, w, h);
  x.save(); x.lineCap = "round"; x.lineJoin = "round"; x.shadowColor = c1; x.shadowBlur = w * 0.06; x.lineWidth = w * 0.03;
  const gl = x.createLinearGradient(w * 0.2, 0, w * 0.8, 0); gl.addColorStop(0, c1); gl.addColorStop(1, c2); x.strokeStyle = gl; x.globalAlpha = 0.55;
  x.beginPath(); x.moveTo(w * 0.22, h * 0.34); x.lineTo(w * 0.5, h * 0.62); x.lineTo(w * 0.78, h * 0.34); x.stroke(); x.restore();
  return c.toDataURL("image/jpeg", 0.85);
}

// ---- Favoritos: papéis guardados para usar de novo com um toque (ficam só neste aparelho)
const CHAVE_FAV = "vhome.papeis-fav";
export const MAX_FAVORITOS = 8;
export function lerFavoritos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_FAV) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.startsWith("data:image/")).slice(0, MAX_FAVORITOS) : [];
  } catch { return []; }
}
/** Junta o papel à lista (sem repetir; o mais novo vem primeiro). Devolve a lista nova, ou null se não coube no aparelho. */
export function juntarFavorito(lista: string[], url: string): string[] {
  return [url, ...lista.filter((x) => x !== url)].slice(0, MAX_FAVORITOS);
}
export function guardarFavoritos(lista: string[]): boolean {
  try { localStorage.setItem(CHAVE_FAV, JSON.stringify(lista)); return true; } catch { return false; }
}

/** Cor da luz sobre o papel: "sol" segue a hora (aurora quente, dia neutro, entardecer dourado, noite azul). `hora` de 0 a 24. */
export function luzDoPapel(luz: "nenhuma" | "sol" | "dia" | "noite", hora: number): { cor: string; alfa: number } {
  if (luz === "nenhuma") return { cor: "0,0,0", alfa: 0 };
  if (luz === "dia") return { cor: "255,244,214", alfa: 0.06 };
  if (luz === "noite") return { cor: "20,40,110", alfa: 0.32 };
  const h = ((hora % 24) + 24) % 24;
  if (h < 5 || h >= 20) return { cor: "20,40,110", alfa: 0.32 };
  if (h < 7.5) return { cor: "255,170,110", alfa: 0.2 };
  if (h < 16.5) return { cor: "255,244,214", alfa: 0.05 };
  if (h < 18.5) return { cor: "255,190,90", alfa: 0.2 };
  return { cor: "190,90,140", alfa: 0.22 };
}
