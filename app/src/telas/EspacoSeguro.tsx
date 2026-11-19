import type { AppInfo } from "../dados.ts";
import { Icone } from "../icones";
import { Botao } from "../ui";
import { Glifo } from "./IconeApp";

/**
 * Espaço seguro: tela só com os apps que a pessoa escolheu (banco, governo). Sem widgets, sem selos de notificação,
 * sem player de música e sem busca em contatos. Os apps abrem direto, sem nada do V-Space por cima.
 */
export function EspacoSeguro({ apps, aoAbrir, aoSair, aoEscolher, acessoNotificacoes }: { apps: AppInfo[]; aoAbrir: (pacote: string) => void; aoSair: () => void; aoEscolher: () => void; acessoNotificacoes: boolean | null }) {
  return (
    <div className="seguro" role="dialog" aria-modal="true" aria-label="Espaço seguro">
      <header className="seguro-topo">
        <span className="seguro-selo"><Icone nome="escudo" tam={20} />Espaço seguro</span>
        <button type="button" onClick={aoSair} aria-label="Sair do Espaço seguro" className="botao-vidro"><Icone nome="fechar" /></button>
      </header>
      <p className="seguro-aviso">Aqui só aparecem os apps que você escolheu. O V-Space não mostra widgets, números de notificação nem música neste espaço.</p>
      {acessoNotificacoes && <p className="seguro-aviso seguro-alerta">O acesso às notificações do V-Space está ligado no Android. Para o máximo de proteção, desligue em Estúdio › Configurações › Atalhos.</p>}
      <div className="seguro-lista">
        {apps.length === 0 ? <p className="text-sm text-suave">Nenhum app escolhido ainda.</p> : apps.map((a) => (
          <button key={a.pacote} type="button" className="app-cel" aria-label={a.nome} onClick={() => aoAbrir(a.pacote)}><Glifo app={a} /><span className="app-rotulo">{a.nome}</span></button>
        ))}
      </div>
      <div className="seguro-rodape"><Botao onClick={aoEscolher}><Icone nome="ajustes" tam={18} />Escolher apps</Botao></div>
    </div>
  );
}
