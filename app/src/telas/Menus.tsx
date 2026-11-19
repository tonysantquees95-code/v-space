import { useState, type ReactNode } from "react";
import type { AppInfo, Pasta } from "../dados.ts";
import { Icone, type NomeIcone } from "../icones";
import { Aviso, Botao, Folha } from "../ui";
import { Glifo, IconeApp } from "./IconeApp";

export type Origem = "tela" | "dock" | "gaveta" | "pasta";

function Opcao({ icone, texto, aoClicar, perigo = false }: { icone: NomeIcone; texto: string; aoClicar: () => void; perigo?: boolean }) {
  return (
    <button type="button" onClick={aoClicar} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-white/5 ${perigo ? "text-erro" : ""}`}>
      <Icone nome={icone} /><span>{texto}</span>
    </button>
  );
}

/** Opções do app (aperto longo). O que aparece depende de onde o app está. */
export function MenuApp({ app, origem, noDock, naTela, podeAgrupar, aoFechar, aoDetalhes, aoRemover, aoParaODock, aoTirarDoDock, aoAgrupar, aoTirarDaPasta, aoPorNaTela, aoOcultar, aoDesinstalar }: {
  app: AppInfo; origem: Origem; noDock: boolean; naTela: boolean; podeAgrupar: boolean; aoFechar: () => void;
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
          {origem === "pasta" && <Opcao icone="tela" texto="Tirar da pasta" aoClicar={acao(aoTirarDaPasta)} />}
          {origem === "gaveta" && !naTela && !noDock && <Opcao icone="tela" texto="Colocar na tela inicial" aoClicar={acao(aoPorNaTela)} />}
          {origem === "gaveta" && !noDock && <Opcao icone="dock" texto="Colocar no dock" aoClicar={acao(aoParaODock)} />}
          {origem === "tela" && <Opcao icone="dock" texto="Colocar no dock" aoClicar={acao(aoParaODock)} />}
          {origem === "tela" && podeAgrupar && <Opcao icone="pasta" texto="Agrupar em pasta…" aoClicar={acao(aoAgrupar)} />}
          {origem === "dock" && <Opcao icone="tela" texto="Tirar do dock" aoClicar={acao(aoTirarDoDock)} />}
          {origem === "tela" && <Opcao icone="fechar" texto="Remover da tela inicial" aoClicar={acao(aoRemover)} />}
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

/** Aperto longo na tela inicial vazia: atalhos para personalizar. */
export function MenuVazio({ aoFechar, aoPapel, aoWidgets, aoApps, aoIcones, aoGrade, aoEstudio }: { aoFechar: () => void; aoPapel: () => void; aoWidgets: () => void; aoApps: () => void; aoIcones: () => void; aoGrade: () => void; aoEstudio: () => void }) {
  const acao = (f: () => void) => () => { aoFechar(); f(); };
  return (
    <Folha titulo="Tela inicial" aoFechar={aoFechar}>
      <div className="flex flex-col">
        <Opcao icone="papel" texto="Papel de parede" aoClicar={acao(aoPapel)} />
        <Opcao icone="widgets" texto="Widgets" aoClicar={acao(aoWidgets)} />
        <Opcao icone="gaveta" texto="Adicionar aplicativos" aoClicar={acao(aoApps)} />
        <Opcao icone="forma" texto="Personalizar ícones" aoClicar={acao(aoIcones)} />
        <Opcao icone="grade" texto="Grade da tela inicial" aoClicar={acao(aoGrade)} />
        <Opcao icone="estudio" texto="Abrir o Estúdio" aoClicar={acao(aoEstudio)} />
      </div>
    </Folha>
  );
}
