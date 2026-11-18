import type { AppInfo, Pasta } from "../dados.ts";
import { usePressaoLonga } from "../ui";

/** O desenho do ícone, na forma e no tamanho escolhidos no Estúdio. */
export function Glifo({ app }: { app: AppInfo }) {
  return (
    <span className="glifo" aria-hidden>
      {app.icone ? <img src={app.icone} alt="" draggable={false} /> : <span className="glifo-letra">{app.nome.charAt(0).toUpperCase()}</span>}
    </span>
  );
}

export function IconeApp({ app, rotulo, aoAbrir, aoLonga, className = "app-cel" }: { app: AppInfo; rotulo: boolean; aoAbrir: () => void; aoLonga: () => void; className?: string }) {
  const { foiLongo, ...eventos } = usePressaoLonga(aoLonga);
  return (
    <button type="button" {...eventos} onClick={() => { if (!foiLongo()) aoAbrir(); }} className={className} aria-label={app.nome}>
      <Glifo app={app} />
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
