import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icone } from "./icones";

export function Cartao({ titulo, children, className = "" }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4 ${className}`}>
      {titulo && <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-suave">{titulo}</h3>}
      {children}
    </section>
  );
}

export function Botao({ variante = "suave", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "suave" | "perigo" }) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--raio-botao,0.75rem)] px-4 text-sm font-medium transition disabled:opacity-40";
  const v = variante === "primario" ? "btn-primario bg-neon/90 text-fundo hover:bg-neon" : variante === "perigo" ? "border border-erro/40 text-erro hover:bg-erro/10" : "border border-borda text-texto hover:bg-white/5";
  return <button type="button" className={`${base} ${v} ${className}`} {...p} />;
}

export function Aviso({ tom = "aviso", children }: { tom?: "ok" | "aviso" | "erro"; children: ReactNode }) {
  const t = tom === "ok" ? "border-ok/30 bg-ok/10 text-ok" : tom === "erro" ? "border-erro/30 bg-erro/10 text-erro" : "border-aviso/30 bg-aviso/10 text-aviso";
  return <div role={tom === "erro" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-sm ${t}`}>{children}</div>;
}

/** Interruptor: o botão redondo anda de uma ponta à outra, sempre dentro da trilha. */
export function Interruptor({ ligado, aoMudar, rotulo }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} onClick={() => aoMudar(!ligado)}
      className={`relative block h-8 w-14 flex-none overflow-hidden rounded-full border transition-colors ${ligado ? "border-neon bg-neon" : "border-borda bg-white/15"}`}>
      <span className={`absolute left-0 top-1/2 block size-6 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-200 ${ligado ? "translate-x-[1.7rem]" : "translate-x-[0.2rem]"}`} />
    </button>
  );
}

export function Linha({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0"><div className="font-medium">{titulo}</div>{texto && <p className="text-sm text-suave">{texto}</p>}</div>
      {children}
    </div>
  );
}

/** Opções lado a lado (uma só escolhida): a escolhida fica preenchida, com borda forte e um visto; as outras ficam separadas e apagadas. */
export function Seletor<T extends string>({ valor, opcoes, aoMudar, rotulo }: { valor: T; opcoes: { id: T; nome: string }[]; aoMudar: (v: T) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-3">
      {opcoes.map((o) => {
        const sel = valor === o.id;
        return (
          <button key={o.id} type="button" aria-pressed={sel} onClick={() => aoMudar(o.id)}
            className={`flex min-h-11 items-center gap-2 rounded-[var(--raio-botao,0.75rem)] border-2 px-4 text-sm transition ${sel ? "border-neon bg-neon/25 font-bold text-white" : "border-white/20 bg-white/5 text-texto hover:bg-white/10"}`}>
            {sel && <span className="text-neon"><Icone nome="ok" tam={16} /></span>}{o.nome}
          </button>
        );
      })}
    </div>
  );
}

/** Menos e mais, com o número no meio. */
export function Passo({ valor, min, max, aoMudar, rotulo }: { valor: number; min: number; max: number; aoMudar: (v: number) => void; rotulo: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={rotulo}>
      <button type="button" aria-label={`Menos ${rotulo}`} disabled={valor <= min} onClick={() => aoMudar(valor - 1)} className="grid size-11 place-items-center rounded-full border border-borda disabled:opacity-30"><Icone nome="menos" tam={18} /></button>
      <span className="num w-8 text-center text-lg font-semibold">{valor}</span>
      <button type="button" aria-label={`Mais ${rotulo}`} disabled={valor >= max} onClick={() => aoMudar(valor + 1)} className="grid size-11 place-items-center rounded-full border border-borda disabled:opacity-30"><Icone nome="mais" tam={18} /></button>
    </div>
  );
}

/** Folha que sobe de baixo (no lugar de caixas cinza do sistema): segue o visual do app. */
export function Folha({ titulo, aoFechar, children, alta = false, classe = "" }: { titulo: string; aoFechar: () => void; children: ReactNode; alta?: boolean; classe?: string }) {
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") fechar.current(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  return (
    <div className={`folha-fundo ${classe} fixed inset-0 z-40 flex items-end justify-center bg-black/60`} onClick={aoFechar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}
        className={`folha flex w-full max-w-lg flex-col rounded-t-3xl border border-b-0 border-borda bg-painel ${alta ? "folha-alta" : "folha-baixa"}`}>
        <header className="flex flex-none items-center justify-between gap-2 px-5 pb-1 pt-4">
          <h2 className="min-w-0 truncate text-lg font-extrabold">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-11 flex-none place-items-center rounded-full text-suave hover:bg-white/5"><Icone nome="fechar" /></button>
        </header>
        <div className="rolagem min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

let vibracaoLigada = true;
export const ligarVibracao = (v: boolean): void => { vibracaoLigada = v; };

/** Aperto longo (ou botão direito do mouse): chama `aoLonga`; o toque curto continua sendo um clique normal. */
export function usePressaoLonga(aoLonga: () => void, ms = 480) {
  const t = useRef<number>(0);
  const pos = useRef<{ x: number; y: number } | null>(null);
  const longo = useRef(false);
  const limpar = () => { window.clearTimeout(t.current); pos.current = null; };
  const disparar = () => { if (longo.current) return; longo.current = true; limpar(); try { if (vibracaoLigada) navigator.vibrate?.(14); } catch { /* sem vibração */ } aoLonga(); };
  return {
    onPointerDown: (e: React.PointerEvent) => { longo.current = false; pos.current = { x: e.clientX, y: e.clientY }; t.current = window.setTimeout(disparar, ms); },
    onPointerMove: (e: React.PointerEvent) => { if (pos.current && Math.hypot(e.clientX - pos.current.x, e.clientY - pos.current.y) > 10) limpar(); },
    onPointerUp: limpar, onPointerLeave: limpar, onPointerCancel: limpar,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); disparar(); },
    /** true se este toque foi um aperto longo (e portanto não deve abrir o app) */
    foiLongo: () => { const v = longo.current; longo.current = false; return v; },
  };
}
