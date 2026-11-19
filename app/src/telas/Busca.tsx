import { useEffect, useMemo, useRef, useState } from "react";
import type { AppInfo } from "../dados.ts";
import { appsRecentes, buscarAjustes, buscarApps, buscasRecentes, guardarBusca, limparBuscas, linksWeb, type Ajuste, type LinkWeb } from "../busca.ts";
import { Icone, type NomeIcone } from "../icones";
import { Glifo } from "./IconeApp";

type Aba = "tudo" | "apps" | "config" | "web";

function Linha({ icone, titulo, sub, aoClicar, glifo }: { icone?: NomeIcone; titulo: string; sub: string; aoClicar: () => void; glifo?: AppInfo }) {
  return (
    <button type="button" onClick={aoClicar} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-white/5">
      <span className="menu-glifo">{glifo ? <Glifo app={glifo} /> : <span className="grid size-10 place-items-center rounded-full bg-white/10"><Icone nome={icone ?? "pesquisa"} tam={20} /></span>}</span>
      <span className="min-w-0 flex-1"><span className="block truncate">{titulo}</span><span className="block truncate text-xs text-suave">{sub}</span></span>
    </button>
  );
}

/** Busca universal: apps, configurações do V-Space e web. Os melhores resultados ficam perto do teclado. */
export function Busca({ apps, aoFechar, aoAbrirApp, aoAjuste, aoWeb }: { apps: AppInfo[]; aoFechar: () => void; aoAbrirApp: (pacote: string) => void; aoAjuste: (destino: string) => void; aoWeb: (url: string) => void }) {
  const [q, setQ] = useState("");
  const [aba, setAba] = useState<Aba>("tudo");
  const [buscas, setBuscas] = useState<string[]>(() => buscasRecentes());
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => { campo.current?.focus(); }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [aoFechar]);

  const recentes = useMemo(() => appsRecentes(), []);
  const porPacote = useMemo(() => new Map(apps.map((a) => [a.pacote, a])), [apps]);
  const termo = q.trim();
  const achadosApps = useMemo(() => buscarApps(apps, termo, recentes), [apps, termo, recentes]);
  const achadosAjustes = useMemo(() => buscarAjustes(termo), [termo]);
  const web = useMemo(() => linksWeb(termo), [termo]);

  const abrirApp = (a: AppInfo) => { guardarBusca(termo); aoAbrirApp(a.pacote); };
  const abrirAjuste = (a: Ajuste) => { guardarBusca(termo); aoAjuste(a.destino); };
  const abrirWeb = (l: LinkWeb) => { guardarBusca(termo); aoWeb(l.url); };
  const melhor = achadosApps[0] ? { tipo: "app" as const, app: achadosApps[0] } : achadosAjustes[0] ? { tipo: "ajuste" as const, ajuste: achadosAjustes[0] } : web[0] ? { tipo: "web" as const, link: web[0] } : null;
  const abrirMelhor = () => { if (!melhor) return; if (melhor.tipo === "app") abrirApp(melhor.app); else if (melhor.tipo === "ajuste") abrirAjuste(melhor.ajuste); else abrirWeb(melhor.link); };

  const rotuloAba = (a: Aba, n?: number) => ({ tudo: "Tudo", apps: "Aplicativos", config: "Configurações", web: "Web" }[a] + (n !== undefined && a !== "tudo" && a !== "web" ? ` ${n}` : ""));
  const secao = (t: string, filhos: React.ReactNode) => <section className="mb-3"><h3 className="px-2 pb-1 text-sm text-suave">{t}</h3>{filhos}</section>;
  const verApps = aba === "tudo" ? achadosApps.slice(0, 6) : achadosApps;
  const verAjustes = aba === "tudo" ? achadosAjustes.slice(0, 3) : achadosAjustes;
  const verWeb = aba === "tudo" ? web.slice(0, 2) : web;

  return (
    <div className="busca" role="dialog" aria-modal="true" aria-label="Pesquisar">
      <div className="busca-lista">
        <div className="busca-conteudo">
          {!termo ? (
            <>
              {buscas.length > 0 && secao("Pesquisas recentes", (
                <div className="flex flex-wrap items-center gap-2 px-2">
                  {buscas.map((b) => <button key={b} type="button" onClick={() => setQ(b)} className="busca-chip"><Icone nome="pesquisa" tam={16} />{b}</button>)}
                  <button type="button" onClick={() => { limparBuscas(); setBuscas([]); }} className="ml-auto min-h-11 px-2 text-sm text-neon">Limpar</button>
                </div>
              ))}
              {secao("Aplicativos recentes", recentes.length ? (
                <div className="flex gap-2 overflow-x-auto px-1 pb-1">
                  {recentes.map((p) => porPacote.get(p)).filter((a): a is AppInfo => !!a).slice(0, 8).map((a) => (
                    <button key={a.pacote} type="button" aria-label={a.nome} onClick={() => abrirApp(a)} className="flex w-[72px] flex-none flex-col items-center gap-1 rounded-2xl py-1"><span className="menu-glifo"><Glifo app={a} /></span><span className="max-w-full truncate text-xs">{a.nome}</span></button>
                  ))}
                </div>
              ) : <p className="px-2 text-sm text-suave">Os apps que você abrir aparecem aqui.</p>)}
            </>
          ) : (
            <>
              {(aba === "tudo" || aba === "web") && secao(aba === "web" ? "Pesquisar em" : "Web", verWeb.map((l) => <Linha key={l.id} icone="pesquisa" titulo={l.nome} sub="Abre no seu navegador" aoClicar={() => abrirWeb(l)} />))}
              {(aba === "tudo" || aba === "config") && verAjustes.length > 0 && secao("Configurações do V-Space", verAjustes.map((a) => <Linha key={a.titulo} icone="engrenagem" titulo={a.titulo} sub={a.onde} aoClicar={() => abrirAjuste(a)} />))}
              {(aba === "tudo" || aba === "apps") && verApps.length > 0 && secao("Aplicativos", verApps.map((a) => <Linha key={a.pacote} glifo={a} titulo={a.nome} sub="Abrir aplicativo" aoClicar={() => abrirApp(a)} />))}
              {aba === "config" && !verAjustes.length && <p className="px-2 text-sm text-suave">Nenhuma configuração com “{termo}”.</p>}
              {aba === "apps" && !verApps.length && <p className="px-2 text-sm text-suave">Nenhum app com “{termo}”.</p>}
              {aba === "tudo" && melhor && secao("Melhor resultado · a tecla Pesquisar abre", (
                <div className="rounded-2xl border border-borda bg-white/5">
                  {melhor.tipo === "app" && <Linha glifo={melhor.app} titulo={melhor.app.nome} sub="Abrir aplicativo" aoClicar={() => abrirApp(melhor.app)} />}
                  {melhor.tipo === "ajuste" && <Linha icone="engrenagem" titulo={melhor.ajuste.titulo} sub={melhor.ajuste.onde} aoClicar={() => abrirAjuste(melhor.ajuste)} />}
                  {melhor.tipo === "web" && <Linha icone="pesquisa" titulo={melhor.link.nome} sub="Abre no seu navegador" aoClicar={() => abrirWeb(melhor.link)} />}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      {termo && (
        <div className="flex flex-none gap-2 overflow-x-auto px-3 pb-2" role="tablist" aria-label="Tipo de resultado">
          {(["tudo", "apps", "config", "web"] as Aba[]).map((a) => <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)} className="busca-chip busca-aba">{rotuloAba(a, a === "apps" ? achadosApps.length : a === "config" ? achadosAjustes.length : undefined)}</button>)}
        </div>
      )}
      <div className="busca-barra">
        <label className="busca-campo">
          <Icone nome="pesquisa" tam={20} />
          <input ref={campo} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquise qualquer coisa" aria-label="Pesquise qualquer coisa" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
            onKeyDown={(e) => { if (e.key === "Enter") abrirMelhor(); }} />
          {q ? <button type="button" aria-label="Limpar a busca" onClick={() => { setQ(""); campo.current?.focus(); }} className="grid size-9 flex-none place-items-center text-suave"><Icone nome="fechar" tam={18} /></button> : null}
        </label>
        <button type="button" onClick={aoFechar} aria-label="Fechar a pesquisa" className="botao-vidro"><Icone nome="fechar" /></button>
      </div>
    </div>
  );
}
