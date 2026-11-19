import type { CSSProperties, ReactElement, SVGProps } from "react";

/** Ícones de linha no padrão da suíte Vetorial: traço, ponta e junta vêm das variáveis CSS (--icone-traco etc.). */
const estilo: CSSProperties = {
  strokeWidth: "var(--icone-traco, 1.8)",
  strokeLinecap: "var(--icone-ponta, round)" as CSSProperties["strokeLinecap"],
  strokeLinejoin: "var(--icone-junta, round)" as CSSProperties["strokeLinejoin"],
};
function Svg({ children, tam = 24, style, ...r }: SVGProps<SVGSVGElement> & { tam?: number }) {
  return <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...r} style={{ ...estilo, ...style }}>{children}</svg>;
}

export type NomeIcone = "widgets" | "papel" | "cadeado" | "pesquisa" | "gaveta" | "estudio" | "fechar" | "pasta" | "info" | "lixeira" | "ocultar" | "mostrar" | "dock" | "tela" | "voltar" | "ok" | "mais" | "menos" | "grade" | "backup" | "restaurar" | "tema" | "forma" | "escudo" | "sobre" | "seta";

const DESENHOS: Record<NomeIcone, ReactElement> = {
  pesquisa: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  gaveta: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" /></>,
  estudio: <><path d="M4 20c1.8 0 3-1 3-2.6 0-1.4 1.1-2.4 2.4-2.4S12 16 12 17.4C12 19 10.8 20 9 20z" /><path d="m11.5 14.5 8-9.2a1.8 1.8 0 0 0-2.6-2.4l-9.2 8" /></>,
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  pasta: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.2" /></>,
  lixeira: <><path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7" /><path d="M10 11v5M14 11v5" /></>,
  ocultar: <><path d="M3 12s3.5-6 9-6c1.5 0 2.8.4 4 1M21 12s-3.5 6-9 6c-1.5 0-2.8-.4-4-1" /><path d="m4 4 16 16" /></>,
  mostrar: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.6" /></>,
  dock: <><rect x="3.5" y="5" width="17" height="14" rx="2.6" /><path d="M7 15.5h10" /></>,
  tela: <><rect x="6.5" y="3" width="11" height="18" rx="2.6" /><path d="M10.5 18h3" /></>,
  voltar: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  ok: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  mais: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  grade: <path d="M4 8.5h16M4 15.5h16M8.5 4v16M15.5 4v16" />,
  backup: <><path d="M12 15V4.5M8 8l4-4 4 4" /><path d="M5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V14" /></>,
  restaurar: <><path d="M12 4.5V15M8 11.5l4 4 4-4" /><path d="M5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V14" /></>,
  tema: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M12 12h8.5" /></>,
  forma: <><rect x="3.5" y="3.5" width="9" height="9" rx="3" /><circle cx="16.5" cy="16.5" r="4" /></>,
  escudo: <path d="M12 3 5 5.8v5.6c0 4.2 2.9 7.6 7 9.1 4.1-1.5 7-4.9 7-9.1V5.8z" />,
  sobre: <><circle cx="12" cy="12" r="8.5" /><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" /></>,
  seta: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  widgets: <><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="2" /><rect x="3.5" y="13" width="17" height="7.5" rx="2" /></>,
  papel: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.6" /><circle cx="9" cy="10" r="1.7" /><path d="m4.5 17 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" /></>,
  cadeado: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
};

export function Icone({ nome, tam = 24, className }: { nome: NomeIcone; tam?: number; className?: string }) {
  return <Svg tam={tam} className={className}>{DESENHOS[nome]}</Svg>;
}

/** O V da Vetorial: dois traços arredondados com o degradê da suíte (cor do tema). */
export function LogoV({ tam = 40 }: { tam?: number }) {
  return <img src="/v.png" width={tam} height={tam} alt="V-Space" style={{ objectFit: "contain" }} draggable={false} />;
}
