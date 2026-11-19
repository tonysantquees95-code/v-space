// Do Tema para o visual: variáveis CSS (cores, formato do botão, forma e tamanho dos ícones) e o fundo da tela inicial.
import type { Forma, Tema } from "./dados.ts";

export const RAIO_DO_ICONE: Record<Forma, string> = { original: "0", circulo: "50%", squircle: "30%", quadrado: "12%" };
export const RAIO_DO_BOTAO: Record<Tema["botoes"], string> = { degrade: "0.9rem", contorno: "999px", solido: "0.5rem" };

export function variaveisCss(t: Tema): Record<string, string> {
  return {
    "--color-neon": t.cor, "--color-magenta": t.cor2, "--raio-botao": RAIO_DO_BOTAO[t.botoes],
    "--icone-raio": RAIO_DO_ICONE[t.forma], "--cantos": `${t.cantos}px`, "--icone-tam": String(t.tamanho), "--fundo-cor": t.fundoCor,
  };
}

/** `fundo` só desenha o plano de trás; o resto da tela fica por cima, sempre legível. */
export function fundoCss(t: Tema): string {
  const base = t.fundoCor;
  switch (t.fundo) {
    case "aurora": return `radial-gradient(120% 70% at 15% 0%, ${t.cor}55, transparent 60%), radial-gradient(110% 70% at 100% 100%, ${t.cor2}4d, transparent 60%), ${base}`;
    case "neon": return `linear-gradient(160deg, ${t.cor}33 0%, transparent 45%), linear-gradient(340deg, ${t.cor2}44 0%, transparent 50%), ${base}`;
    case "noite": return `radial-gradient(90% 60% at 50% -10%, ${t.cor}22, transparent 70%), ${base}`;
    default: return base;
  }
}

export function aplicarTema(t: Tema, alvo: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(variaveisCss(t))) alvo.style.setProperty(k, v);
  alvo.style.setProperty("--fundo-inicial", fundoCss(t));
  alvo.dataset.botoes = t.botoes;
  alvo.dataset.forma = t.forma;
  alvo.dataset.dock = t.dock;
  alvo.dataset.pacote = t.pacote;
  alvo.dataset.pasta = t.pasta;
  alvo.dataset.superficie = t.superficie;
  alvo.dataset.pastaAbre = t.pastaAbre;
  alvo.style.setProperty("--sup-i", String(t.intensidade / 100));
}
