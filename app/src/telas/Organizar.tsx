import { useState } from "react";
import { aplicarOrganizacao, organizarNoAparelho, previaOrganizacao } from "../categorias.ts";
import type { AppInfo, Banco } from "../dados.ts";
import { Icone } from "../icones";
import { organizarComIA } from "../organizar";
import { Aviso, Botao, Folha } from "../ui";
import { Glifo } from "./IconeApp";

type Fase = { f: "inicio" } | { f: "pensando" } | { f: "erro"; msg: string } | { f: "previa"; mapa: Record<string, string> } | { f: "feito"; antes: Banco; mudaram: number };

/** "Organizar com IA": pede, mostra o que vai mudar, aplica e dá para desfazer. Nada muda sem a pessoa tocar em Aplicar. */
export function Organizar({ banco, apps, aoMudar, aoFechar }: { banco: Banco; apps: AppInfo[]; aoMudar: (f: (b: Banco) => Banco) => void; aoFechar: () => void }) {
  const [fase, setFase] = useState<Fase>({ f: "inicio" });
  const nomeDe = (id: string) => banco.categorias.find((c) => c.id === id)?.nome ?? id;
  const pedir = async () => {
    setFase({ f: "pensando" });
    try { setFase({ f: "previa", mapa: await organizarComIA(banco, apps) }); }
    catch (e) { setFase({ f: "erro", msg: e instanceof Error ? e.message : "Não consegui organizar agora." }); }
  };
  const previa = fase.f === "previa" ? previaOrganizacao(banco, apps, fase.mapa) : [];
  return (
    <Folha titulo="Organizar com IA" aoFechar={aoFechar} alta={fase.f === "previa" && previa.length > 6}>
      <p className="mb-3 text-sm text-suave">Seus apps em ordem em segundos. Só os nomes dos apps são analisados; o que você mudou à mão não é mexido.</p>
      {fase.f === "inicio" && (
        <div className="space-y-3">
          <Botao variante="primario" className="w-full" onClick={() => void pedir()}><span className="inline-flex items-center gap-2"><Icone nome="brilho" tam={20} />Organizar agora</span></Botao>
          <Botao className="w-full" onClick={() => { aoMudar(organizarNoAparelho); aoFechar(); }}>Voltar à organização do aparelho</Botao>
        </div>
      )}
      {fase.f === "pensando" && <p role="status" className="py-6 text-center text-suave">Organizando seus apps…</p>}
      {fase.f === "erro" && (
        <div className="space-y-3">
          <Aviso tom="erro">{fase.msg}</Aviso>
          <Botao variante="primario" className="w-full" onClick={() => void pedir()}>Tentar de novo</Botao>
          <Botao className="w-full" onClick={aoFechar}>Fechar</Botao>
        </div>
      )}
      {fase.f === "previa" && (previa.length === 0 ? (
        <div className="space-y-3"><Aviso tom="ok">Já está tudo no lugar certo.</Aviso><Botao className="w-full" onClick={aoFechar}>Fechar</Botao></div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">{previa.length} {previa.length === 1 ? "app muda" : "apps mudam"} de categoria:</p>
          <ul className="flex flex-col">
            {previa.map((x) => (
              <li key={x.app.pacote} className="flex min-h-12 items-center gap-3 rounded-2xl px-1">
                <span className="menu-glifo"><Glifo app={x.app} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate">{x.app.nome}</span><span className="block truncate text-xs text-suave">{nomeDe(x.de)} → {nomeDe(x.para)}</span></span>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Botao className="flex-1" onClick={aoFechar}>Cancelar</Botao>
            <Botao variante="primario" className="flex-1" onClick={() => { const r = aplicarOrganizacao(banco, apps, fase.mapa); aoMudar((b) => aplicarOrganizacao(b, apps, fase.mapa).banco); setFase({ f: "feito", antes: banco, mudaram: r.mudaram }); }}>Aplicar</Botao>
          </div>
        </div>
      ))}
      {fase.f === "feito" && (
        <div className="space-y-3">
          <Aviso tom="ok">Pronto! {fase.mudaram} {fase.mudaram === 1 ? "app mudou" : "apps mudaram"} de categoria.</Aviso>
          <div className="flex gap-3">
            <Botao className="flex-1" onClick={() => { aoMudar((b) => ({ ...b, atribuidos: fase.antes.atribuidos, manuais: fase.antes.manuais })); aoFechar(); }}>Desfazer</Botao>
            <Botao variante="primario" className="flex-1" onClick={aoFechar}>Fechar</Botao>
          </div>
        </div>
      )}
    </Folha>
  );
}
