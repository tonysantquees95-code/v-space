import { useEffect, useRef, useState } from "react";
import { CATEGORIAS_PADRAO, type AppInfo, type Banco } from "../dados.ts";
import { appsDaCategoria, contagens } from "../categorias.ts";
import { Icone } from "../icones";
import { usePressaoLonga } from "../ui";
import { IconeApp, PastaCel } from "./IconeApp";
import { FaixaWidgets } from "./Widgets";

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
  aoGaveta: (busca: boolean) => void; aoEstudio: () => void; aoMenuVazio: () => void; papel: string | null;
  aoMenuFavorito?: (pacote: string) => void; aoMenuCategoria?: (pacote: string) => void; aoAdicionarFavorito?: () => void; aoAdicionarNaCategoria?: (id: string) => void; aoOrganizar?: () => void; aoNovaCategoria?: () => void; abaInicial?: string;
}

/** Trilho + página: a tela inicial só com widgets e favoritos; cada categoria é uma página. */
function CorpoCategorias({ banco, porPacote, aoAbrirApp, aoMenuFavorito, aoMenuCategoria, aoGaveta, aoMenuVazio, aoAdicionarFavorito, aoAdicionarNaCategoria, aoOrganizar, aoNovaCategoria, abaInicial }: Props) {
  const [aba, setAba] = useState(abaInicial ?? "inicio");
  const vazio = usePressaoLonga(aoMenuVazio);
  const t = banco.tema;
  const todos = [...porPacote.values()];
  const cont = contagens(banco, todos);
  const padrao = new Set(CATEGORIAS_PADRAO.map((c) => c.id));
  // categoria que a pessoa criou aparece mesmo vazia; as de fábrica só quando têm app
  const visiveis = banco.categorias.filter((c) => (cont[c.id] ?? 0) > 0 || c.id === aba || !padrao.has(c.id));
  const ativa = aba === "inicio" ? null : banco.categorias.find((c) => c.id === aba) ?? null;
  const nada = () => undefined;
  const soNoVazio = (e: { target: unknown; currentTarget: unknown }) => e.target === e.currentTarget;
  const lista = ativa ? appsDaCategoria(banco, todos, ativa.id) : banco.favoritos.map((p) => porPacote.get(p)).filter((a): a is AppInfo => !!a && !banco.ocultos.includes(a.pacote));
  const eventosVazio = { onPointerDown: (e: React.PointerEvent) => { if (soNoVazio(e)) vazio.onPointerDown(e); }, onPointerMove: vazio.onPointerMove, onPointerUp: vazio.onPointerUp, onPointerLeave: vazio.onPointerLeave, onPointerCancel: vazio.onPointerCancel, onContextMenu: (e: React.MouseEvent) => { if (soNoVazio(e)) vazio.onContextMenu(e); else e.preventDefault(); } };
  const pode = !banco.bloqueado;
  // deslizar para o lado troca de categoria (favoritos ← → categorias, na ordem do trilho)
  const ordem = ["inicio", ...visiveis.map((c) => c.id)];
  const arrasto = useRef<{ x: number; y: number } | null>(null);
  const trocar = (delta: 1 | -1) => { const k = ordem.indexOf(aba); const n = ordem[k + delta]; if (n) setAba(n); };
  return (
    <div className="cat-area"
      onTouchStart={(e) => { const c = e.touches[0]!; arrasto.current = (e.target as Element).closest?.(".widgets") ? null : { x: c.clientX, y: c.clientY }; }}
      onTouchEnd={(e) => { const s = arrasto.current; arrasto.current = null; if (!s) return; const c = e.changedTouches[0]!; const dx = c.clientX - s.x, dy = c.clientY - s.y; if (Math.abs(dx) > 70 && Math.abs(dy) < 55) trocar(dx < 0 ? 1 : -1); }}>
      <div className="cat-corpo" {...eventosVazio}>
        {ativa ? (
          <header className="cat-cabeca"><h2 className="cat-titulo">{ativa.nome}</h2><p className="cat-sub">{lista.length} {lista.length === 1 ? "app" : "apps"}</p></header>
        ) : (
          <><FaixaWidgets widgets={banco.widgets} /><h2 className="cat-secao">Favoritos</h2></>
        )}
        <div className="cat-grade" {...eventosVazio}>
          {lista.map((a) => <IconeApp key={a.pacote} app={a} rotulo={t.rotulos} className="app-cel" aoAbrir={() => aoAbrirApp(a.pacote)} aoLonga={() => (ativa ? (aoMenuCategoria ?? nada) : (aoMenuFavorito ?? nada))(a.pacote)} />)}
          {pode && <button type="button" className="app-cel" onClick={() => (ativa ? (aoAdicionarNaCategoria ?? nada)(ativa.id) : (aoAdicionarFavorito ?? nada)())} aria-label={ativa ? `Adicionar apps a ${ativa.nome}` : "Adicionar favoritos"}>
            <span className="glifo glifo-adiciona" aria-hidden><Icone nome="mais" tam={26} /></span>{t.rotulos && <span className="app-rotulo">Adiciona</span>}
          </button>}
        </div>
        {!ativa && !lista.length && !pode && <p className="cat-vazio">Nenhum favorito ainda.</p>}
      </div>
      <nav className="trilho" aria-label="Categorias">
        <button type="button" className="trilho-item" aria-pressed={aba === "inicio"} aria-label="Favoritos e widgets" onClick={() => setAba("inicio")}><Icone nome="estrela" tam={22} /></button>
        {visiveis.map((c) => <button key={c.id} type="button" className="trilho-item" aria-pressed={aba === c.id} aria-label={`${c.nome}, ${cont[c.id] ?? 0} apps`} onClick={() => setAba(c.id)}><Icone nome={c.icone} tam={22} /></button>)}
        {pode && <button type="button" className="trilho-item trilho-tracejado" aria-label="Nova categoria" onClick={aoNovaCategoria ?? nada}><Icone nome="mais" tam={20} /></button>}
        <button type="button" className="trilho-item" aria-label="Organizar com IA" onClick={aoOrganizar ?? nada}><Icone nome="brilho" tam={22} /></button>
        <button type="button" className="trilho-item" aria-label="Pesquisar apps" onClick={() => aoGaveta(true)}><Icone nome="pesquisa" tam={22} /></button>
      </nav>
    </div>
  );
}

export function Inicio(props: Props) {
  const { banco, porPacote, aoAbrirApp, aoMenuApp, aoAbrirPasta, aoGaveta, aoEstudio, aoMenuVazio, papel } = props;
  const agora = useRelogio();
  const pager = useRef<HTMLDivElement>(null);
  const [pg, setPg] = useState(0);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const vazio = usePressaoLonga(aoMenuVazio);
  const soNoVazio = (e: { target: unknown; currentTarget: unknown }) => e.target === e.currentTarget;
  const { colunas, linhas, paginas, dock, pastas } = banco.layout;
  const t = banco.tema;

  const irPara = (i: number) => { const el = pager.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };

  return (
    <div className="inicio" onTouchStart={(e) => { const c = e.touches[0]!; const r = (e.target as Element).closest?.(".cat-corpo"); toque.current = r && r.scrollHeight > r.clientHeight + 4 ? null : { x: c.clientX, y: c.clientY }; }}
      onTouchEnd={(e) => { const i = toque.current; toque.current = null; if (!i) return; const c = e.changedTouches[0]!; const dx = c.clientX - i.x, dy = c.clientY - i.y; if (dy < -70 && Math.abs(dx) < 60 && banco.gesto !== "nada") aoGaveta(banco.gesto === "pesquisa"); }}>
      {t.fundo === "foto" && papel && <><div className="papel" aria-hidden style={{ backgroundImage: `url(${papel})`, filter: `blur(${t.desfoque}px)` }} /><div className="papel-escuro" aria-hidden style={{ opacity: t.escuro / 100 }} /></>}
      <header className="inicio-topo">
        {banco.relogio ? <div className="relogio"><div className="relogio-hora num">{hora(agora)}</div><div className="relogio-data">{data(agora)}</div></div> : <div />}
        <button type="button" onClick={aoEstudio} aria-label="Abrir o Estúdio" className="botao-vidro"><Icone nome="estudio" /></button>
      </header>

      {banco.modo === "categorias" ? <CorpoCategorias {...props} /> : (
        <>
      <FaixaWidgets widgets={banco.widgets} />

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
        </>
      )}
    </div>
  );
}
