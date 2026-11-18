import { useEffect, useMemo, useRef, useState } from "react";
import { agruparPorLetra, buscar, ordenar, type AppInfo, type EstiloGaveta } from "../dados.ts";
import { Icone } from "../icones";
import { IconeApp } from "./IconeApp";

/** Gaveta: todos os apps (menos os ocultos), em ordem alfabética, com busca e as letras na lateral. */
export function Gaveta({ apps, estilo, buscaInicial, aoFechar, aoAbrir, aoMenu }: { apps: AppInfo[]; estilo: EstiloGaveta; buscaInicial: boolean; aoFechar: () => void; aoAbrir: (p: string) => void; aoMenu: (p: string) => void }) {
  const [q, setQ] = useState("");
  const rolagem = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => { if (buscaInicial) campo.current?.focus(); }, [buscaInicial]);
  const grupos = useMemo(() => agruparPorLetra(apps), [apps]);
  const achados = useMemo(() => (q.trim() ? buscar(apps, q) : null), [apps, q]);
  const irParaLetra = (l: string) => { const el = rolagem.current?.querySelector<HTMLElement>(`[data-letra="${l}"]`); if (el && rolagem.current) rolagem.current.scrollTo({ top: el.offsetTop - rolagem.current.offsetTop, behavior: "smooth" }); };

  const celula = (a: AppInfo) => (estilo === "lista"
    ? <IconeApp key={a.pacote} app={a} rotulo className="app-linha" aoAbrir={() => aoAbrir(a.pacote)} aoLonga={() => aoMenu(a.pacote)} />
    : <IconeApp key={a.pacote} app={a} rotulo className="app-cel app-cel-grade" aoAbrir={() => aoAbrir(a.pacote)} aoLonga={() => aoMenu(a.pacote)} />);
  const bloco = (lista: AppInfo[]) => <div className={estilo === "lista" ? "gaveta-lista" : "gaveta-grade"}>{lista.map(celula)}</div>;

  return (
    <div className="gaveta" role="dialog" aria-label="Todos os apps">
      <header className="gaveta-topo">
        <label className="gaveta-busca"><Icone nome="pesquisa" tam={20} />
          <input ref={campo} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar apps" aria-label="Pesquisar apps" enterKeyHint="go" autoComplete="off" autoCorrect="off" spellCheck={false}
            onKeyDown={(e) => { if (e.key === "Enter" && achados && achados[0]) aoAbrir(achados[0].pacote); }} />
          {q && <button type="button" aria-label="Limpar a busca" onClick={() => { setQ(""); campo.current?.focus(); }} className="grid size-9 flex-none place-items-center text-suave"><Icone nome="fechar" tam={18} /></button>}
        </label>
        <button type="button" onClick={aoFechar} aria-label="Fechar a gaveta" className="botao-vidro"><Icone nome="fechar" /></button>
      </header>
      <div className="gaveta-corpo" ref={rolagem}>
        {achados ? (achados.length ? bloco(achados) : <p className="gaveta-vazia">Nenhum app com “{q.trim()}”.</p>)
          : estilo === "lista"
            ? grupos.map((g) => <section key={g.letra} data-letra={g.letra}><h3 className="gaveta-letra">{g.letra}</h3>{bloco(g.apps)}</section>)
            : bloco(ordenar(apps))}
      </div>
      {!achados && estilo === "lista" && grupos.length > 1 && (
        <nav className="gaveta-letras" aria-label="Letras">{grupos.map((g) => <button key={g.letra} type="button" onClick={() => irParaLetra(g.letra)} aria-label={`Ir para a letra ${g.letra}`}>{g.letra}</button>)}</nav>
      )}
    </div>
  );
}
