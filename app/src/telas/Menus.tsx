import { useState, type ReactNode } from "react";
import { ICONES_CATEGORIA, type AppInfo, type Categoria, type IconeCategoria, type Pasta } from "../dados.ts";
import { PRONTOS } from "../papel";
import { Icone, type NomeIcone } from "../icones";
import { Aviso, Botao, Folha } from "../ui";
import { Glifo, IconeApp } from "./IconeApp";

export type Origem = "tela" | "dock" | "gaveta" | "pasta" | "categoria" | "favorito";

function Opcao({ icone, texto, aoClicar, perigo = false }: { icone: NomeIcone; texto: string; aoClicar: () => void; perigo?: boolean }) {
  return (
    <button type="button" onClick={aoClicar} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-white/5 ${perigo ? "text-erro" : ""}`}>
      <Icone nome={icone} /><span>{texto}</span>
    </button>
  );
}

/** Opções do app (aperto longo). O que aparece depende de onde o app está. */
export function MenuApp({ app, origem, noDock, naTela, podeAgrupar, bloqueado = false, favorito = false, aoFavoritar, aoMover, aoFechar, aoDetalhes, aoRemover, aoParaODock, aoTirarDoDock, aoAgrupar, aoTirarDaPasta, aoPorNaTela, aoOcultar, aoDesinstalar }: {
  app: AppInfo; origem: Origem; noDock: boolean; naTela: boolean; podeAgrupar: boolean; bloqueado?: boolean; favorito?: boolean; aoFavoritar?: () => void; aoMover?: () => void; aoFechar: () => void;
  aoDetalhes: () => void; aoRemover: () => void; aoParaODock: () => void; aoTirarDoDock: () => void; aoAgrupar: () => void; aoTirarDaPasta: () => void; aoPorNaTela: () => void; aoOcultar: () => void; aoDesinstalar: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const acao = (f: () => void) => () => { f(); aoFechar(); };
  return (
    <Folha titulo={app.nome} aoFechar={aoFechar}>
      <div className="mb-2 flex items-center gap-3 px-1"><span className="menu-glifo"><Glifo app={app} /></span><span className="min-w-0 truncate text-sm text-suave">{app.pacote}</span></div>
      {confirmar ? (
        <div className="space-y-3 pt-1">
          <Aviso>Desinstalar {app.nome}? O Android vai pedir a sua confirmação.</Aviso>
          <div className="flex gap-3"><Botao className="flex-1" onClick={() => setConfirmar(false)}>Cancelar</Botao><Botao variante="perigo" className="flex-1" onClick={acao(aoDesinstalar)}>Desinstalar</Botao></div>
        </div>
      ) : (
        <div className="flex flex-col">
          {(origem === "categoria" || origem === "favorito" || origem === "gaveta") && aoFavoritar && <Opcao icone="estrela" texto={favorito ? "Tirar dos favoritos" : "Colocar nos favoritos"} aoClicar={acao(aoFavoritar)} />}
          {(origem === "categoria" || origem === "favorito" || origem === "gaveta") && aoMover && !bloqueado && <Opcao icone="pasta" texto="Mover para categoria…" aoClicar={acao(aoMover)} />}
          {origem === "pasta" && !bloqueado && <Opcao icone="tela" texto="Tirar da pasta" aoClicar={acao(aoTirarDaPasta)} />}
          {origem === "gaveta" && !naTela && !noDock && <Opcao icone="tela" texto="Colocar na tela inicial" aoClicar={acao(aoPorNaTela)} />}
          {origem === "gaveta" && !noDock && <Opcao icone="dock" texto="Colocar no dock" aoClicar={acao(aoParaODock)} />}
          {origem === "tela" && !bloqueado && <Opcao icone="dock" texto="Colocar no dock" aoClicar={acao(aoParaODock)} />}
          {origem === "tela" && !bloqueado && podeAgrupar && <Opcao icone="pasta" texto="Agrupar em pasta…" aoClicar={acao(aoAgrupar)} />}
          {origem === "dock" && !bloqueado && <Opcao icone="tela" texto="Tirar do dock" aoClicar={acao(aoTirarDoDock)} />}
          {origem === "tela" && !bloqueado && <Opcao icone="fechar" texto="Remover da tela inicial" aoClicar={acao(aoRemover)} />}
          <Opcao icone="info" texto="Informações do app" aoClicar={acao(aoDetalhes)} />
          <Opcao icone="ocultar" texto="Ocultar da gaveta" aoClicar={acao(aoOcultar)} />
          <Opcao icone="lixeira" texto="Desinstalar" perigo aoClicar={() => setConfirmar(true)} />
        </div>
      )}
    </Folha>
  );
}

/** Pasta aberta: nome editável e os apps dentro. */
export function FolhaPasta({ pasta, apps, rotulo, aoFechar, aoRenomear, aoAbrir, aoMenu }: { pasta: Pasta; apps: AppInfo[]; rotulo: boolean; aoFechar: () => void; aoRenomear: (nome: string) => void; aoAbrir: (p: string) => void; aoMenu: (p: string) => void }) {
  const [nome, setNome] = useState(pasta.nome);
  return (
    <Folha titulo={`Pasta ${pasta.nome}`} aoFechar={() => { if (nome.trim() && nome !== pasta.nome) aoRenomear(nome); aoFechar(); }}>
      <label className="mb-3 block text-sm text-suave">Nome da pasta
        <input value={nome} maxLength={24} onChange={(e) => setNome(e.target.value)} className="mt-1 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
      </label>
      <div className="gaveta-grade pb-2">{apps.map((a) => <IconeApp key={a.pacote} app={a} rotulo={rotulo} className="app-cel app-cel-grade" aoAbrir={() => aoAbrir(a.pacote)} aoLonga={() => aoMenu(a.pacote)} />)}</div>
    </Folha>
  );
}

/** Escolher com qual app da tela inicial formar a pasta. */
export function EscolherParceiro({ app, candidatos, aoFechar, aoEscolher }: { app: AppInfo; candidatos: AppInfo[]; aoFechar: () => void; aoEscolher: (pacote: string) => void }) {
  return (
    <Folha titulo={`Agrupar ${app.nome} com…`} aoFechar={aoFechar}>
      <ul className="flex flex-col">
        {candidatos.map((c): ReactNode => (
          <li key={c.pacote}><IconeApp app={c} rotulo className="app-linha" aoAbrir={() => aoEscolher(c.pacote)} aoLonga={() => aoEscolher(c.pacote)} /></li>
        ))}
      </ul>
    </Folha>
  );
}

/** Aperto longo na tela inicial vazia: papéis de parede à mão e atalhos para personalizar. */
export function MenuVazio({ papel, bloqueado, aoFechar, aoUsarPronto, aoPapel, aoWidgets, aoApps, aoPasta, aoGrade, aoIcones, aoEstudio, aoBloquear }: {
  papel: string | null; bloqueado: boolean; aoFechar: () => void; aoUsarPronto: (id: string) => void; aoPapel: () => void; aoWidgets: () => void; aoApps: () => void;
  aoPasta: () => void; aoGrade: () => void; aoIcones: () => void; aoEstudio: () => void; aoBloquear: () => void;
}) {
  const acao = (f: () => void) => () => { aoFechar(); f(); };
  return (
    <Folha titulo="Tela inicial" aoFechar={aoFechar}>
      <div className="menu-papeis" role="group" aria-label="Papéis de parede">
        {papel && <span className="menu-papel atual" style={{ backgroundImage: `url(${papel})` }} role="img" aria-label="Papel de parede atual"><Icone nome="ok" tam={18} /></span>}
        {PRONTOS.map((p) => <button key={p.id} type="button" aria-label={`Papel ${p.nome}`} className="menu-papel" style={{ background: `linear-gradient(160deg, ${p.cores[1]}99, ${p.cores[0]} 55%, ${p.cores[2]}88)` }} onClick={acao(() => aoUsarPronto(p.id))} />)}
      </div>
      <div className="flex flex-col">
        <Opcao icone="papel" texto="Editar papel de parede" aoClicar={acao(aoPapel)} />
        <Opcao icone="widgets" texto="Adicionar widget" aoClicar={acao(aoWidgets)} />
        <Opcao icone="gaveta" texto="Adicionar aplicativos" aoClicar={acao(aoApps)} />
        {!bloqueado && <Opcao icone="pasta" texto="Criar pasta" aoClicar={acao(aoPasta)} />}
        <Opcao icone="grade" texto="Editar tela inicial" aoClicar={acao(aoGrade)} />
        <Opcao icone="forma" texto="Personalizar ícones" aoClicar={acao(aoIcones)} />
        <Opcao icone="estudio" texto="Configurações do V-Space" aoClicar={acao(aoEstudio)} />
        <Opcao icone="cadeado" texto={bloqueado ? "Desbloquear layout" : "Bloquear layout"} aoClicar={acao(aoBloquear)} />
      </div>
    </Folha>
  );
}

/** Criar pasta: marque dois ou mais apps da tela inicial e dê um nome. */
export function CriarPasta({ candidatos, aoFechar, aoCriar }: { candidatos: AppInfo[]; aoFechar: () => void; aoCriar: (pacotes: string[], nome: string) => void }) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [nome, setNome] = useState("Pasta");
  const alternar = (p: string) => setMarcados((m) => (m.includes(p) ? m.filter((x) => x !== p) : [...m, p]));
  return (
    <Folha titulo="Criar pasta" aoFechar={aoFechar}>
      <label className="mb-3 block text-sm text-suave">Nome da pasta
        <input value={nome} maxLength={24} onChange={(e) => setNome(e.target.value)} className="mt-1 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
      </label>
      {candidatos.length < 2 ? <Aviso>Precisa de pelo menos dois apps soltos na tela inicial para formar uma pasta.</Aviso> : (
        <>
          <p className="mb-2 text-sm text-suave">Toque nos apps que vão para a pasta ({marcados.length} marcados).</p>
          <ul className="mb-3 flex flex-col">
            {candidatos.map((c) => (
              <li key={c.pacote}>
                <button type="button" aria-pressed={marcados.includes(c.pacote)} onClick={() => alternar(c.pacote)} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left ${marcados.includes(c.pacote) ? "bg-neon/15 text-neon" : "hover:bg-white/5"}`}>
                  <span className="menu-glifo"><Glifo app={c} /></span><span className="min-w-0 flex-1 truncate">{c.nome}</span>{marcados.includes(c.pacote) && <Icone nome="ok" tam={20} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <Botao variante="primario" className="w-full" disabled={marcados.length < 2} onClick={() => { aoCriar(marcados, nome); aoFechar(); }}>Criar pasta</Botao>
    </Folha>
  );
}

/** Em qual categoria o app fica. */
export function EscolherCategoria({ app, categorias, atual, aoFechar, aoEscolher }: { app: AppInfo; categorias: Categoria[]; atual: string; aoFechar: () => void; aoEscolher: (id: string) => void }) {
  return (
    <Folha titulo={`Mover ${app.nome} para…`} aoFechar={aoFechar}>
      <ul className="flex flex-col">
        {categorias.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => { aoEscolher(c.id); aoFechar(); }} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left ${c.id === atual ? "bg-neon/15 text-neon" : "hover:bg-white/5"}`}>
              <Icone nome={c.icone} /><span className="min-w-0 flex-1 truncate">{c.nome}</span>{c.id === atual && <Icone nome="ok" tam={20} />}
            </button>
          </li>
        ))}
      </ul>
    </Folha>
  );
}

/** Marcar vários apps de uma vez (favoritos, ou apps que vão para uma categoria). */
export function EscolherApps({ titulo, texto, botao, candidatos, jaMarcados = [], aoFechar, aoConfirmar }: { titulo: string; texto: string; botao: string; candidatos: AppInfo[]; jaMarcados?: string[]; aoFechar: () => void; aoConfirmar: (pacotes: string[]) => void }) {
  const [marcados, setMarcados] = useState<string[]>(jaMarcados);
  const [q, setQ] = useState("");
  const alternar = (p: string) => setMarcados((m) => (m.includes(p) ? m.filter((x) => x !== p) : [...m, p]));
  const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const lista = q.trim() ? candidatos.filter((c) => norm(c.nome).includes(norm(q.trim()))) : candidatos;
  return (
    <Folha titulo={titulo} aoFechar={aoFechar} alta>
      <p className="mb-2 text-sm text-suave">{texto} ({marcados.length} marcados)</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar apps" aria-label="Pesquisar apps" className="mb-2 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
      <ul className="mb-3 flex flex-col">
        {lista.map((c) => (
          <li key={c.pacote}>
            <button type="button" aria-pressed={marcados.includes(c.pacote)} onClick={() => alternar(c.pacote)} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left ${marcados.includes(c.pacote) ? "bg-neon/15 text-neon" : "hover:bg-white/5"}`}>
              <span className="menu-glifo"><Glifo app={c} /></span><span className="min-w-0 flex-1 truncate">{c.nome}</span>{marcados.includes(c.pacote) && <Icone nome="ok" tam={20} />}
            </button>
          </li>
        ))}
      </ul>
      <Botao variante="primario" className="w-full" onClick={() => { aoConfirmar(marcados); aoFechar(); }}>{botao}</Botao>
    </Folha>
  );
}

/** Nome e ícone de uma categoria nova (ou editada). */
export function NovaCategoria({ inicial, aoFechar, aoSalvar }: { inicial?: Categoria; aoFechar: () => void; aoSalvar: (nome: string, icone: IconeCategoria) => void }) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [icone, setIcone] = useState<IconeCategoria>(inicial?.icone ?? "pasta");
  return (
    <Folha titulo={inicial ? "Editar categoria" : "Nova categoria"} aoFechar={aoFechar}>
      <label className="mb-3 block text-sm text-suave">Nome
        <input value={nome} maxLength={24} autoFocus onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Trabalho" className="mt-1 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
      </label>
      <p className="mb-2 text-sm text-suave">Ícone</p>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {ICONES_CATEGORIA.map((i) => <button key={i} type="button" aria-pressed={icone === i} aria-label={i} onClick={() => setIcone(i)} className={`grid min-h-12 place-items-center rounded-2xl border ${icone === i ? "border-neon bg-neon/15 text-neon" : "border-borda"}`}><Icone nome={i} /></button>)}
      </div>
      <Botao variante="primario" className="w-full" disabled={!nome.trim()} onClick={() => { aoSalvar(nome, icone); aoFechar(); }}>Salvar</Botao>
    </Folha>
  );
}
