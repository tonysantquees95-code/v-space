import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AppNativo } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  adicionarNaTela, bancoPadrao, criarPasta, layoutInicial, naTela, ocultar, paraODock, reconciliar, removerDaTela, renomearPasta, tirarDaPasta, tirarDoDock,
  type AppInfo, type Banco,
} from "./dados.ts";
import { guardarBanco, lerBanco } from "./armazem";
import { aplicarTema } from "./tema";
import { motor } from "./motor";
import { novasDesde, lerVisto, NOVIDADES, ultimoId } from "./novidades";
import { precisaApresentar } from "./apresentacao";
import { Inicio } from "./telas/Inicio";
import { Gaveta } from "./telas/Gaveta";
import { Estudio, type AbaEstudio } from "./telas/Estudio";
import { lerPapel } from "./papel";
import { Atualizacao } from "./telas/Atualizacao";
import { BUILD, ehNativo, haNovaVersao, marcarConferida, precisaConferir, procurarVersao, ultimaConferencia, type InfoVersao } from "./atualizacao";
import { EscolherParceiro, FolhaPasta, MenuApp, MenuVazio, type Origem } from "./telas/Menus";
import { Apresentacao, Termos, Tour } from "./telas/Apresentacao";
import { Novidades } from "./telas/Novidades";

interface MenuAberto { pacote: string; origem: Origem; pastaId?: string }

export default function App() {
  const primeira = useRef(lerBanco() === null);
  const [banco, setBanco] = useState<Banco>(() => lerBanco() ?? bancoPadrao());
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [apresentar, setApresentar] = useState(() => precisaApresentar());
  const [novidades, setNovidades] = useState(() => { const v = lerVisto(); return v !== null && v < ultimoId() ? novasDesde(v, NOVIDADES) : []; });
  const [gaveta, setGaveta] = useState<{ busca: boolean } | null>(null);
  const [estudio, setEstudio] = useState<false | AbaEstudio>(false);
  const [menuVazio, setMenuVazio] = useState(false);
  const [nova, setNova] = useState<InfoVersao | null>(null);
  const [papel, setPapel] = useState<string | null>(() => lerPapel());
  const [pastaAberta, setPastaAberta] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuAberto | null>(null);
  const [agrupar, setAgrupar] = useState<string | null>(null);
  const [rever, setRever] = useState<"tour" | "termos" | null>(null);
  const [aviso, setAviso] = useState("");
  const temporizador = useRef(0);

  const falar = useCallback((m: string) => { setAviso(m); window.clearTimeout(temporizador.current); temporizador.current = window.setTimeout(() => setAviso(""), 2600); }, []);
  useEffect(() => { const f = (e: Event) => falar(String((e as CustomEvent).detail ?? "")); window.addEventListener("demo-aviso", f); return () => window.removeEventListener("demo-aviso", f); }, [falar]);

  useEffect(() => { aplicarTema(banco.tema); guardarBanco(banco); }, [banco]);

  // versão nova: confere ao abrir (no máximo a cada 6 horas) e começa a baixar sozinha
  useEffect(() => {
    if (!ehNativo() || BUILD <= 0 || !precisaConferir(ultimaConferencia(), Date.now())) return;
    void procurarVersao().then((v) => { marcarConferida(); if (haNovaVersao(BUILD, v.numero)) setNova(v); }).catch(() => undefined);
  }, []);
  const procurarAgora = useCallback(async () => {
    if (!ehNativo() || BUILD <= 0) { falar("A atualização funciona no app instalado."); return; }
    try { const v = await procurarVersao(); marcarConferida(); if (haNovaVersao(BUILD, v.numero)) setNova(v); else falar("Você já está na versão mais nova."); }
    catch (e) { falar(e instanceof Error ? e.message : "Não consegui consultar agora."); }
  }, [falar]);

  // lista de apps do aparelho: carrega ao abrir e de novo quando algo é instalado ou removido
  const carregar = useCallback(async () => {
    try {
      const lista = await motor.apps();
      if (!lista.length) return; // erro do aparelho: não apaga o layout por causa de uma lista vazia
      setApps(lista);
      setBanco((b) => {
        const instalados = new Set(lista.map((a) => a.pacote));
        if (primeira.current) { primeira.current = false; return layoutInicial(lista, b); }
        return reconciliar(b, instalados);
      });
    } catch { falar("Não consegui ler a lista de apps."); }
  }, [falar]);
  useEffect(() => { void carregar(); return motor.aoMudarApps(() => { void carregar(); }); }, [carregar]);

  const porPacote = useMemo(() => new Map(apps.map((a) => [a.pacote, a])), [apps]);
  const visiveis = useMemo(() => apps.filter((a) => !banco.ocultos.includes(a.pacote)), [apps, banco.ocultos]);
  const mudar = useCallback((f: (b: Banco) => Banco) => setBanco(f), []);

  const abrir = useCallback((pacote: string) => {
    setGaveta(null); setPastaAberta(null);
    void motor.abrir(pacote).catch(() => falar(`Não consegui abrir ${porPacote.get(pacote)?.nome ?? "o app"}.`));
  }, [falar, porPacote]);

  // botão Voltar do Android: fecha o que estiver aberto; na tela inicial não faz nada (um launcher nunca "sai")
  const temCamada = !!(menu || agrupar || rever || pastaAberta || estudio || gaveta);
  const fecharTopo = useCallback(() => {
    if (nova) setNova(null); else if (menuVazio) setMenuVazio(false); else if (menu) setMenu(null); else if (agrupar) setAgrupar(null); else if (rever) setRever(null); else if (pastaAberta) setPastaAberta(null); else if (estudio) setEstudio(false); else if (gaveta) setGaveta(null);
  }, [menu, agrupar, rever, pastaAberta, estudio, gaveta]);
  const topo = useRef(fecharTopo); topo.current = fecharTopo;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = AppNativo.addListener("backButton", () => topo.current());
    return () => { void h.then((x) => x.remove()); };
  }, []);
  // botão início apertado com o V-Space já aberto: fecha as janelas e volta à tela inicial
  useEffect(() => {
    const f = () => { setMenuVazio(false); setMenu(null); setAgrupar(null); setRever(null); setNova(null); setPastaAberta(null); setEstudio(false); setGaveta(null); };
    window.addEventListener("vspaceinicio", f);
    return () => window.removeEventListener("vspaceinicio", f);
  }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape" && temCamada) fecharTopo(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [temCamada, fecharTopo]);

  if (apresentar) return <Apresentacao aoConcluir={() => setApresentar(false)} />;
  if (novidades.length) return <Novidades itens={novidades} aoFechar={() => setNovidades([])} />;

  const appDoMenu = menu ? porPacote.get(menu.pacote) : undefined;
  const pasta = pastaAberta ? banco.layout.pastas.find((p) => p.id === pastaAberta) : undefined;
  const alvoAgrupar = agrupar ? porPacote.get(agrupar) : undefined;
  const emPasta = new Set(banco.layout.pastas.flatMap((p) => p.apps));
  const candidatos = [...naTela(banco)].filter((p) => p !== agrupar && !emPasta.has(p)).map((p) => porPacote.get(p)).filter((a): a is AppInfo => !!a);

  const comAviso = (r: { banco: Banco; ok: boolean }, falha: string) => { setBanco(r.banco); if (!r.ok) falar(falha); };

  return (
    <>
      <Inicio banco={banco} porPacote={porPacote} aoAbrirApp={abrir} aoMenuApp={(pacote, origem) => setMenu({ pacote, origem })} aoAbrirPasta={setPastaAberta}
        aoGaveta={(busca) => setGaveta({ busca })} aoEstudio={() => setEstudio("temas")} aoMenuVazio={() => setMenuVazio(true)} papel={papel} />

      {menuVazio && <MenuVazio aoFechar={() => setMenuVazio(false)} aoPapel={() => setEstudio("papel")} aoWidgets={() => setEstudio("widgets")} aoApps={() => setGaveta({ busca: false })} aoIcones={() => setEstudio("icones")} aoGrade={() => setEstudio("inicio")} aoEstudio={() => setEstudio("temas")} />}

      {gaveta && <Gaveta apps={visiveis} estilo={banco.tema.gaveta} buscaInicial={gaveta.busca} aoFechar={() => setGaveta(null)} aoAbrir={abrir} aoMenu={(pacote) => setMenu({ pacote, origem: "gaveta" })} />}

      {pasta && !menu && <FolhaPasta pasta={pasta} rotulo={banco.tema.rotulos} apps={pasta.apps.map((a) => porPacote.get(a)).filter((a): a is AppInfo => !!a)}
        aoFechar={() => setPastaAberta(null)} aoRenomear={(n) => mudar((b) => renomearPasta(b, pasta.id, n))} aoAbrir={abrir} aoMenu={(pacote) => setMenu({ pacote, origem: "pasta", pastaId: pasta.id })} />}

      {nova && <Atualizacao nova={nova} aoFechar={() => setNova(null)} />}

      {estudio && <Estudio aoProcurar={procurarAgora} abaInicial={estudio} papel={papel} aoPapel={setPapel} banco={banco} apps={apps} aoMudar={mudar} aoFechar={() => setEstudio(false)} aviso={falar}
        aoRecomecar={() => mudar((b) => layoutInicial(apps, { ...bancoPadrao(), tema: b.tema, relogio: b.relogio, widgets: b.widgets }))} aoTour={() => setRever("tour")} aoTermos={() => setRever("termos")} />}

      {menu && appDoMenu && (
        <MenuApp app={appDoMenu} origem={menu.origem} noDock={banco.layout.dock.includes(menu.pacote)} naTela={naTela(banco).has(menu.pacote)} podeAgrupar={naTela(banco).size >= 2}
          aoFechar={() => setMenu(null)} aoDetalhes={() => void motor.detalhes(menu.pacote).catch(() => falar("Não consegui abrir as informações."))}
          aoRemover={() => mudar((b) => removerDaTela(b, menu.pacote))}
          aoParaODock={() => comAviso(paraODock(banco, menu.pacote), "O dock já tem 5 apps. Tire um para colocar outro.")}
          aoTirarDoDock={() => comAviso(tirarDoDock(banco, menu.pacote), "A tela inicial está cheia.")}
          aoAgrupar={() => setAgrupar(menu.pacote)}
          aoTirarDaPasta={() => comAviso(tirarDaPasta(banco, menu.pastaId ?? "", menu.pacote), "A tela inicial está cheia.")}
          aoPorNaTela={() => comAviso(adicionarNaTela(banco, menu.pacote), "A tela inicial está cheia.")}
          aoOcultar={() => { mudar((b) => ocultar(b, menu.pacote)); falar("App oculto. Para mostrar de novo: Estúdio › Gaveta."); }}
          aoDesinstalar={() => void motor.desinstalar(menu.pacote).catch(() => falar("Esse app não pode ser desinstalado aqui."))} />
      )}

      {alvoAgrupar && <EscolherParceiro app={alvoAgrupar} candidatos={candidatos} aoFechar={() => setAgrupar(null)} aoEscolher={(outro) => { mudar((b) => criarPasta(b, alvoAgrupar.pacote, outro, "Pasta")); setAgrupar(null); }} />}

      {rever === "tour" && <div className="fixed inset-0 z-50 flex flex-col bg-fundo"><div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pb-4 pt-[max(1.5rem,env(safe-area-inset-top))]"><Tour rotuloFinal="Fechar" aoTerminar={() => setRever(null)} aoFechar={() => setRever(null)} /></div></div>}
      {rever === "termos" && <Termos aoFechar={() => setRever(null)} />}

      {aviso && <div className="aviso-toast" role="status">{aviso}</div>}
    </>
  );
}

