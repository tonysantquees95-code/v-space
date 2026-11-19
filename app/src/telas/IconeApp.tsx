import type { AppInfo, Pasta } from "../dados.ts";
import { usePressaoLonga } from "../ui";
import { ehNovo, textoDoSelo, usePontoNovoLigado, useSelo } from "../selos";
import { useIconeApp } from "../iconesApp";
import { usosDosApps } from "../busca.ts";

/** O desenho do ícone, na forma e no tamanho escolhidos no Estúdio. */
export function Glifo({ app, selo = false }: { app: AppInfo; selo?: boolean }) {
  const n = useSelo(selo ? app.pacote : "");
  const proprio = useIconeApp(app.pacote);
  const pontoLigado = usePontoNovoLigado();
  const novo = selo && pontoLigado && n === 0 && ehNovo(app.instalado, usosDosApps()[app.pacote] ?? 0);
  const imagem = proprio ?? app.icone;
  return (
    <span className="glifo" aria-hidden>
      {imagem ? <img src={imagem} alt="" draggable={false} /> : <span className="glifo-letra">{app.nome.charAt(0).toUpperCase()}</span>}
      {selo && n > 0 && <span className="selo">{textoDoSelo(n)}</span>}
      {novo && <span className="selo-novo" />}
    </span>
  );
}

export function IconeApp({ app, rotulo, aoAbrir, aoLonga, className = "app-cel" }: { app: AppInfo; rotulo: boolean; aoAbrir: () => void; aoLonga: () => void; className?: string }) {
  const { foiLongo, ...eventos } = usePressaoLonga(aoLonga);
  return (
    <button type="button" {...eventos} onClick={() => { if (!foiLongo()) aoAbrir(); }} className={className} aria-label={app.nome}>
      <Glifo app={app} selo />
      {rotulo && <span className="app-rotulo">{app.nome}</span>}
    </button>
  );
}

/** Pasta: até quatro ícones pequenos dentro de um quadrado com a mesma forma dos ícones. */
export function PastaCel({ pasta, apps, rotulo, aoAbrir }: { pasta: Pasta; apps: AppInfo[]; rotulo: boolean; aoAbrir: () => void }) {
  return (
    <button type="button" onClick={aoAbrir} className="app-cel" aria-label={`Pasta ${pasta.nome}`}>
      <span className="glifo glifo-pasta" aria-hidden>
        {apps.slice(0, 4).map((a) => <span key={a.pacote} className="mini">{a.icone ? <img src={a.icone} alt="" draggable={false} /> : null}</span>)}
      </span>
      {rotulo && <span className="app-rotulo">{pasta.nome}</span>}
    </button>
  );
}
