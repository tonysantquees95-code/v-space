import { useEffect, useRef, useState } from "react";
import type { AppInfo, Banco } from "../dados.ts";
import { Icone } from "../icones";
import { usePressaoLonga } from "../ui";
import { IconeApp, PastaCel } from "./IconeApp";

function useRelogio(): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setAgora(new Date()), 20_000); return () => window.clearInterval(t); }, []);
  return agora;
}
const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const data = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

interface Props {
  banco: Banco; porPacote: Map<string, AppInfo>;
  aoAbrirApp: (pacote: string) => void; aoMenuApp: (pacote: string, origem: "tela" | "dock") => void; aoAbrirPasta: (id: string) => void;
  aoGaveta: (busca: boolean) => void; aoEstudio: () => void;
}

export function Inicio({ banco, porPacote, aoAbrirApp, aoMenuApp, aoAbrirPasta, aoGaveta, aoEstudio }: Props) {
  const agora = useRelogio();
  const pager = useRef<HTMLDivElement>(null);
  const [pg, setPg] = useState(0);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const vazio = usePressaoLonga(aoEstudio);
  const soNoVazio = (e: { target: unknown; currentTarget: unknown }) => e.target === e.currentTarget;
  const { colunas, linhas, paginas, dock, pastas } = banco.layout;
  const t = banco.tema;

  const irPara = (i: number) => { const el = pager.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };

  return (
    <div className="inicio" onTouchStart={(e) => { const c = e.touches[0]!; toque.current = { x: c.clientX, y: c.clientY }; }}
      onTouchEnd={(e) => { const i = toque.current; toque.current = null; if (!i) return; const c = e.changedTouches[0]!; const dx = c.clientX - i.x, dy = c.clientY - i.y; if (dy < -70 && Math.abs(dx) < 60) aoGaveta(false); }}>
      <header className="inicio-topo">
        {banco.relogio ? <div className="relogio"><div className="relogio-hora num">{hora(agora)}</div><div className="relogio-data">{data(agora)}</div></div> : <div />}
        <button type="button" onClick={aoEstudio} aria-label="Abrir o Estúdio" className="botao-vidro"><Icone nome="estudio" /></button>
      </header>

      <div className="pager" ref={pager} onScroll={(e) => { const el = e.currentTarget; setPg(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}>
        {paginas.map((itens, i) => (
          <section key={i} className="pagina" aria-label={`Página ${i + 1} de ${paginas.length}`} style={{ "--cols": colunas, "--rows": linhas } as React.CSSProperties}
            onPointerDown={(e) => { if (soNoVazio(e)) vazio.onPointerDown(e); }} onPointerMove={vazio.onPointerMove} onPointerUp={vazio.onPointerUp} onPointerLeave={vazio.onPointerLeave} onPointerCancel={vazio.onPointerCancel}
            onContextMenu={(e) => { if (soNoVazio(e)) vazio.onContextMenu(e); else e.preventDefault(); }}>
            {itens.map((it) => {
              if (it.tipo === "pasta") {
                const p = pastas.find((x) => x.id === it.id);
                if (!p) return null;
                return <div className="cel" key={`p-${p.id}`}><PastaCel pasta={p} rotulo={t.rotulos} apps={p.apps.map((a) => porPacote.get(a)).filter((a): a is AppInfo => !!a)} aoAbrir={() => aoAbrirPasta(p.id)} /></div>;
              }
              const a = porPacote.get(it.pacote);
              if (!a) return null;
              return <div className="cel" key={it.pacote}><IconeApp app={a} rotulo={t.rotulos} aoAbrir={() => aoAbrirApp(a.pacote)} aoLonga={() => aoMenuApp(a.pacote, "tela")} /></div>;
            })}
          </section>
        ))}
      </div>

      {paginas.length > 1 && (
        <div className="pontos" role="tablist" aria-label="Páginas">
          {paginas.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === pg} aria-label={`Ir para a página ${i + 1}`} onClick={() => irPara(i)} className="ponto"><span className={i === pg ? "ativo" : ""} /></button>)}
        </div>
      )}

      <button type="button" className="busca-pilula" onClick={() => aoGaveta(true)}><Icone nome="pesquisa" tam={20} /><span>Pesquisar apps</span></button>

      <nav className="dock" aria-label="Dock">
        {dock.map((p) => { const a = porPacote.get(p); return a ? <IconeApp key={p} app={a} rotulo={false} className="dock-cel" aoAbrir={() => aoAbrirApp(p)} aoLonga={() => aoMenuApp(p, "dock")} /> : null; })}
        <button type="button" className="dock-cel" onClick={() => aoGaveta(false)} aria-label="Todos os apps"><span className="glifo glifo-gaveta" aria-hidden><Icone nome="gaveta" tam={26} /></span></button>
      </nav>
    </div>
  );
}
