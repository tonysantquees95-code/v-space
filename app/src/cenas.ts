// Cenas: combinações prontas de tema, papel de parede e estilo (um toque muda a tela inteira). Nomes próprios da Vetorial.
import { ajustarTema, escolherTema, type Banco, type EstiloDock, type Forma, type PacoteIcones } from "./dados.ts";

export interface Cena { id: string; nome: string; tema: string; papel: string | null; forma: Forma; pacote: PacoteIcones; dock: EstiloDock }

export const CENAS: Cena[] = [
  { id: "neon-noturno", nome: "Neon noturno", tema: "vetorial", papel: "aurora", forma: "squircle", pacote: "original", dock: "vidro" },
  { id: "brasa-viva", nome: "Brasa viva", tema: "brasa", papel: "por-do-sol", forma: "circulo", pacote: "vivo", dock: "vidro" },
  { id: "mar-calmo", nome: "Mar calmo", tema: "noite", papel: "oceano", forma: "circulo", pacote: "mono", dock: "transparente" },
  { id: "mata-fechada", nome: "Mata fechada", tema: "floresta", papel: "floresta", forma: "quadrado", pacote: "tingido", dock: "solido" },
  { id: "nevoa-rosa", nome: "Névoa rosa", tema: "rosa", papel: "nebulosa", forma: "circulo", pacote: "original", dock: "vidro" },
  { id: "ouro-escuro", nome: "Ouro escuro", tema: "brasa", papel: "ouro", forma: "squircle", pacote: "mono", dock: "solido" },
];

/** Aplica a cena: tema base + forma, pacote, dock e (se tiver) o fundo de foto. `papelPronto` diz se o papel da cena foi gerado. */
export function aplicarCena(b: Banco, c: Cena, papelPronto: boolean): Banco {
  const base = escolherTema(b, c.tema);
  return ajustarTema(base, { forma: c.forma, pacote: c.pacote, dock: c.dock, ...(c.papel && papelPronto ? { fundo: "foto" as const, desfoque: 0, escuro: 25 } : {}) });
}
