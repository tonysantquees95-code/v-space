import { useCallback, useEffect, useRef, useState } from "react";
import { baixar, instalar, progresso, type InfoVersao } from "../atualizacao";
import { Aviso, Botao, Folha } from "../ui";

const mb = (n: number) => `${(n / 1_048_576).toFixed(1).replace(".", ",")} MB`;

/** Versão nova: começa a baixar sozinha, mostra a barra e deixa a pessoa tocar em Instalar (o Android pede a confirmação). */
export function Atualizacao({ nova, aoFechar }: { nova: InfoVersao; aoFechar: () => void }) {
  const [fase, setFase] = useState<"baixando" | "pronta" | "erro">("baixando");
  const [feitos, setFeitos] = useState(0);
  const [total, setTotal] = useState(nova.tamanho);
  const [erro, setErro] = useState("");
  const comecou = useRef(false);

  const comecar = useCallback(async () => {
    setErro(""); setFase("baixando"); setFeitos(0);
    try { await baixar(nova); } catch (e) { setFase("erro"); setErro(e instanceof Error ? e.message : typeof e === "string" ? e : "Não consegui baixar agora."); }
  }, [nova]);
  useEffect(() => { if (!comecou.current) { comecou.current = true; void comecar(); } }, [comecar]);

  useEffect(() => {
    if (fase !== "baixando") return;
    let vivo = true;
    const t = window.setInterval(() => {
      void progresso().then((p) => {
        if (!vivo) return;
        setFeitos(p.feitos); if (p.total > 0) setTotal(p.total);
        if (p.estado === "pronta") setFase("pronta");
        else if (p.estado === "erro") { setFase("erro"); setErro(p.erro || "Não consegui baixar a atualização."); }
      }).catch(() => undefined);
    }, 500);
    return () => { vivo = false; window.clearInterval(t); };
  }, [fase]);

  const pct = fase === "pronta" ? 100 : total > 0 ? Math.min(100, Math.round((feitos / total) * 100)) : null;
  return (
    <Folha titulo="Atualização do V-Space" aoFechar={aoFechar}>
      <div className="space-y-3 pb-2">
        <p className="text-sm">Versão 1.{nova.numero} disponível.{nova.notas ? ` ${nova.notas}` : ""}</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Andamento do download" aria-valuenow={pct ?? undefined} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full bg-neon transition-all ${pct === null ? "w-1/3 animate-pulse" : ""}`} style={pct === null ? undefined : { width: `${pct}%` }} />
        </div>
        {fase === "baixando" && <p className="text-xs text-suave">Baixando{pct !== null ? ` · ${pct}%` : "…"}{total > 0 ? ` (${mb(feitos)} de ${mb(total)})` : ""}</p>}
        {fase === "pronta" && <Aviso tom="ok">Pronta para instalar. O Android vai pedir a sua confirmação.</Aviso>}
        {fase === "erro" && <Aviso tom="erro">{erro}</Aviso>}
        <div className="flex gap-3">
          <Botao className="flex-1" onClick={aoFechar}>Depois</Botao>
          {fase === "pronta" && <Botao variante="primario" className="flex-1" onClick={() => void instalar().catch((e: unknown) => { setFase("erro"); setErro(e instanceof Error ? e.message : typeof e === "string" ? e : "Não consegui instalar agora."); })}>Instalar agora</Botao>}
          {fase === "erro" && <Botao variante="primario" className="flex-1" onClick={() => void comecar()}>Tentar de novo</Botao>}
        </div>
      </div>
    </Folha>
  );
}
