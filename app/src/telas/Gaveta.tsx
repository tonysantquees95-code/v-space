import { useMemo, useRef } from "react";
import { agruparPorLetra, ordenar, type AppInfo, type EstiloGaveta } from "../dados.ts";
import { Icone } from "../icones";
import { IconeApp } from "./IconeApp";

/** Gaveta: todos os apps (menos os ocultos), em ordem alfabética, com busca e as letras na lateral. */
export function Gaveta({ apps, estilo, aoBuscar, aoOrganizar, aoFechar, aoAbrir, aoMenu }: { apps: AppInfo[]; estilo: EstiloGaveta; aoBuscar: () => void; aoOrganizar: () => void; aoFechar: () => void; aoAbrir: (p: string) => void; aoMenu: (p: string) => void }) {
  const rolagem = useRef<HTMLDivElement>(null);
  const grupos = useMemo(() => agruparPorLetra(apps), [apps]);
  const irParaLetra = (l: string) => { const el = rolagem.current?.querySelector<HTMLElement>(`[data-letra="${l}"]`); if (el && rolagem.current) rolagem.current.scrollTo({ top: el.offsetTop - rolagem.current.offsetTop, behavior: "smooth" }); };

  const celula = (a: AppInfo) => (estilo === "lista"
    ? <IconeApp key={a.pacote} app={a} rotulo className="app-linha" aoAbrir={() => aoAbrir(a.pacote)} aoLonga={() => aoMenu(a.pacote)} />
    : <IconeApp key={a.pacote} app={a} rotulo className="app-cel app-cel-grade" aoAbrir={() => aoAbrir(a.pacote)} aoLonga={() => aoMenu(a.pacote)} />);
  const bloco = (lista: AppInfo[]) => <div className={estilo === "lista" ? "gaveta-lista" : "gaveta-grade"}>{lista.map(celula)}</div>;

  return (
    <div className="gaveta" role="dialog" aria-label="Todos os apps">
      <header className="gaveta-topo">
        <button type="button" onClick={aoBuscar} aria-label="Pesquisar" className="gaveta-busca text-left"><Icone nome="pesquisa" tam={20} /><span className="min-w-0 flex-1 truncate text-suave">Pesquisar em {apps.length} apps</span></button>
        <button type="button" onClick={aoFechar} aria-label="Fechar a gaveta" className="botao-vidro"><Icone nome="fechar" /></button>
      </header>
      <div className="px-4 pb-1"><button type="button" onClick={aoOrganizar} className="busca-chip"><Icone nome="brilho" tam={16} />Organizar em categorias</button></div>
      <div className="gaveta-corpo" ref={rolagem}>
        {estilo === "lista"
          ? grupos.map((g) => <section key={g.letra} data-letra={g.letra}><h3 className="gaveta-letra">{g.letra}</h3>{bloco(g.apps)}</section>)
          : bloco(ordenar(apps))}
      </div>
      {estilo === "lista" && grupos.length > 1 && (
        <nav className="gaveta-letras" aria-label="Letras">{grupos.map((g) => <button key={g.letra} type="button" onClick={() => irParaLetra(g.letra)} aria-label={`Ir para a letra ${g.letra}`}>{g.letra}</button>)}</nav>
      )}
    </div>
  );
}
