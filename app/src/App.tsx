import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AppNativo } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  adicionarNaPasta, adicionarNaTela, ajustarTema, bancoPadrao, criarPasta, layoutInicial, naTela, ocultar, paraODock, reconciliar, removerDaTela, renomearPasta, tirarDaPasta, tirarDoDock,
  type AppInfo, type Banco,
} from "./dados.ts";
import { ehDinamica } from "./dados.ts";
import { categoriaDe, criarCategoria, desfavoritar, favoritar, moverParaCategoria } from "./categorias.ts";
import { Organizar } from "./telas/Organizar";
import { Conta } from "./telas/Conta";
import { Busca } from "./telas/Busca";
import { guardarAppRecente } from "./busca.ts";
import { aparelhoLocal, entrarDepois, guardarSessao, marcarEntrarDepois, sair as sairDaConta, sessaoGuardada, type Sessao } from "./conta";
import { guardarBanco, lerBanco } from "./armazem";
import { aplicarTema } from "./tema";
import { motor } from "./motor";
import { novasDesde, lerVisto, NOVIDADES, ultimoId } from "./novidades";
import { precisaApresentar } from "./apresentacao";
import { Inicio } from "./telas/Inicio";
import { Gaveta } from "./telas/Gaveta";
import { Estudio, type AbaEstudio } from "./telas/Estudio";
import { desenharPronto, guardarPapel, lerPapel, PRONTOS } from "./papel";
import { Atualizacao } from "./telas/Atualizacao";
import { BUILD, ehNativo, haNovaVersao, marcarConferida, precisaConferir, procurarVersao, ultimaConferencia, type InfoVersao } from "./atualizacao";
import { CriarPasta, EscolherApps, EscolherCategoria, EscolherParceiro, FolhaPasta, MenuApp, MenuVazio, NovaCategoria, type Origem } from "./telas/Menus";
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
  const [criarPastaAberto, setCriarPastaAberto] = useState(false);
  const [favoritosAberto, setFavoritosAberto] = useState(false);
  const [addCat, setAddCat] = useState<string | null>(null);
  const [mover, setMover] = useState<string | null>(null);
  const [novaCat, setNovaCat] = useState(false);
  const [organizar, setOrganizar] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(() => sessaoGuardada());
  const [adiado, setAdiado] = useState(() => entrarDepois());
  const [pedirConta, setPedirConta] = useState(false);
  const [busca, setBusca] = useState(false);
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
        const r = reconciliar(b, instalados);
        // quem já usava o V-Space antes das categorias começa com o dock e os apps da primeira página como favoritos (uma vez só)
        try {
          if (!localStorage.getItem("vspace.favoritos-semeados")) {
            localStorage.setItem("vspace.favoritos-semeados", "1");
            if (!r.favoritos.length) { const base = [...r.layout.dock, ...(r.layout.paginas[0] ?? []).flatMap((it) => (it.tipo === "app" ? [it.pacote] : []))]; return { ...r, favoritos: [...new Set(base)].slice(0, 12) }; }
          }
        } catch { /* sem armazenamento: segue sem semear */ }
        return r;
      });
    } catch { falar("Não consegui ler a lista de apps."); }
  }, [falar]);
  useEffect(() => { void carregar(); return motor.aoMudarApps(() => { void carregar(); }); }, [carregar]);

  const porPacote = useMemo(() => new Map(apps.map((a) => [a.pacote, a])), [apps]);
  const visiveis = useMemo(() => apps.filter((a) => !banco.ocultos.includes(a.pacote)), [apps, banco.ocultos]);
  const mudar = useCallback((f: (b: Banco) => Banco) => setBanco(f), []);

  const abrir = useCallback((pacote: string) => {
    setGaveta(null); setPastaAberta(null); setBusca(false);
    guardarAppRecente(pacote);
    void motor.abrir(pacote).catch(() => falar(`Não consegui abrir ${porPacote.get(pacote)?.nome ?? "o app"}.`));
  }, [falar, porPacote]);

  // botão Voltar do Android: fecha o que estiver aberto; na tela inicial não faz nada (um launcher nunca "sai")
  const temCamada = !!(busca || pedirConta || menu || agrupar || rever || pastaAberta || estudio || gaveta || favoritosAberto || addCat || mover || novaCat || organizar);
  const fecharTopo = useCallback(() => {
    if (busca) setBusca(false); else if (pedirConta) setPedirConta(false); else if (organizar) setOrganizar(false); else if (novaCat) setNovaCat(false); else if (mover) setMover(null); else if (addCat) setAddCat(null); else if (favoritosAberto) setFavoritosAberto(false); else if (criarPastaAberto) setCriarPastaAberto(false); else if (nova) setNova(null); else if (menuVazio) setMenuVazio(false); else if (menu) setMenu(null); else if (agrupar) setAgrupar(null); else if (rever) setRever(null); else if (pastaAberta) setPastaAberta(null); else if (estudio) setEstudio(false); else if (gaveta) setGaveta(null);
  }, [menu, agrupar, rever, pastaAberta, estudio, gaveta, organizar, novaCat, mover, addCat, favoritosAberto, criarPastaAberto, nova, menuVazio]);
  const topo = useRef(fecharTopo); topo.current = fecharTopo;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = AppNativo.addListener("backButton", () => topo.current());
    return () => { void h.then((x) => x.remove()); };
  }, []);
  // botão início apertado com o V-Space já aberto: fecha as janelas e volta à tela inicial
  useEffect(() => {
    const f = () => { setBusca(false); setPedirConta(false); setOrganizar(false); setNovaCat(false); setMover(null); setAddCat(null); setFavoritosAberto(false); setMenuVazio(false); setCriarPastaAberto(false); setMenu(null); setAgrupar(null); setRever(null); setNova(null); setPastaAberta(null); setEstudio(false); setGaveta(null); };
    const barras = () => { void motor.barras().then((b) => { const s = document.documentElement.style; s.setProperty("--barra-topo", `${b.topo}px`); s.setProperty("--barra-base", `${b.base}px`); s.setProperty("--barra-esq", `${b.esq}px`); s.setProperty("--barra-dir", `${b.dir}px`); const vv = window.visualViewport; const web = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0; s.setProperty("--teclado", `${Math.max(b.teclado, web)}px`); }); };
    window.visualViewport?.addEventListener("resize", barras);
    barras(); window.addEventListener("vspacebarras", barras); window.addEventListener("resize", barras);
    window.addEventListener("vspaceinicio", f);
    return () => { window.removeEventListener("vspaceinicio", f); window.removeEventListener("vspacebarras", barras); window.removeEventListener("resize", barras); window.visualViewport?.removeEventListener("resize", barras); };
  }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape" && temCamada) fecharTopo(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [temCamada, fecharTopo]);

  if (apresentar) return <Apresentacao aoConcluir={() => setApresentar(false)} />;
  // Vetorial ID é o padrão da suíte: pede a conta uma vez. Sem internet dá para adiar, para o celular nunca ficar sem tela inicial.
  if (!sessao && !adiado) return <Conta aparelho={aparelhoLocal()} aoEntrar={(s) => { guardarSessao(s); setSessao(s); }} aoAdiar={() => { marcarEntrarDepois(); setAdiado(true); }} />;
  if (novidades.length) return <Novidades itens={novidades} aoFechar={() => setNovidades([])} />;

  const appDoMenu = menu ? porPacote.get(menu.pacote) : undefined;
  const pasta = pastaAberta ? banco.layout.pastas.find((p) => p.id === pastaAberta) : undefined;
  const alvoAgrupar = agrupar ? porPacote.get(agrupar) : undefined;
  const emPasta = new Set(banco.layout.pastas.flatMap((p) => p.apps));
  const candidatos = [...naTela(banco)].filter((p) => p !== agrupar && !emPasta.has(p)).map((p) => porPacote.get(p)).filter((a): a is AppInfo => !!a);

  const candidatos0 = [...naTela(banco)].filter((p) => !emPasta.has(p)).map((p) => porPacote.get(p)).filter((a): a is AppInfo => !!a);
  const criarVarias = (pacotes: string[], nome: string) => mudar((b) => {
    const [x, y, ...resto] = pacotes; if (!x || !y) return b;
    let r = criarPasta(b, x, y, nome);
    const pasta = r.layout.pastas.find((p) => p.apps.includes(x));
    if (pasta) for (const p of resto) r = adicionarNaPasta(r, pasta.id, p);
    return r;
  });
  const usarPronto = (id: string) => {
    const p = PRONTOS.find((x) => x.id === id); if (!p) return;
    const url = desenharPronto(p);
    if (!guardarPapel(url)) { falar("Não há espaço para guardar esse papel de parede."); return; }
    setPapel(url); mudar((b) => ajustarTema(b, { fundo: "foto" }));
  };
  const comAviso = (r: { banco: Banco; ok: boolean }, falha: string) => { setBanco(r.banco); if (!r.ok) falar(falha); };

  return (
    <>
      <Inicio banco={banco} aoMudarWidgets={(ws) => mudar((b) => ({ ...b, widgets: ws }))} porPacote={porPacote} aoAbrirApp={abrir} aoMenuApp={(pacote, origem) => setMenu({ pacote, origem })} aoAbrirPasta={setPastaAberta}
        aoGaveta={(abrirBusca) => (abrirBusca ? setBusca(true) : setGaveta({ busca: false }))} aoEstudio={() => setEstudio("temas")} aoMenuVazio={() => setMenuVazio(true)} papel={papel}
        aoMenuFavorito={(pacote) => setMenu({ pacote, origem: "favorito" })} aoMenuCategoria={(pacote) => setMenu({ pacote, origem: "categoria" })}
        aoAdicionarFavorito={() => setFavoritosAberto(true)} aoAdicionarNaCategoria={setAddCat} aoOrganizar={() => setOrganizar(true)} aoNovaCategoria={() => setNovaCat(true)} />

      {favoritosAberto && <EscolherApps titulo="Favoritos" texto="Toque nos apps que ficam na tela inicial." botao="Salvar favoritos" candidatos={visiveis} jaMarcados={banco.favoritos} aoFechar={() => setFavoritosAberto(false)}
        aoConfirmar={(p) => { mudar((b) => ({ ...b, favoritos: p.slice(0, 16) })); if (p.length > 16) falar("O máximo é 16 favoritos."); }} />}
      {addCat && (() => { const c = banco.categorias.find((x) => x.id === addCat); return c ? <EscolherApps titulo={`Adicionar a ${c.nome}`} texto="Toque nos apps que vão para esta categoria." botao="Mover para cá" candidatos={visiveis.filter((a) => categoriaDe(banco, a) !== c.id)}
        aoFechar={() => setAddCat(null)} aoConfirmar={(p) => mudar((b) => p.reduce((acc, x) => moverParaCategoria(acc, x, c.id), b))} /> : null; })()}
      {mover && porPacote.get(mover) && <EscolherCategoria app={porPacote.get(mover)!} categorias={banco.categorias.filter((c) => !ehDinamica(c))} atual={categoriaDe(banco, porPacote.get(mover)!)} aoFechar={() => setMover(null)} aoEscolher={(id) => mudar((b) => moverParaCategoria(b, mover, id))} />}
      {novaCat && <NovaCategoria aoFechar={() => setNovaCat(false)} aoSalvar={({ nome, icone, cor, conteudo }) => { const r = criarCategoria(banco, nome, icone, { cor, conteudo }); if (!r.ok) falar("Limite de categorias atingido."); else setBanco(r.banco); }} />}
      {organizar && <Organizar banco={banco} apps={apps} token={sessao?.token ?? ""} aoPedirConta={() => { setOrganizar(false); setPedirConta(true); }} aoMudar={mudar} aoFechar={() => setOrganizar(false)} />}
      {busca && <Busca apps={visiveis} aoFechar={() => setBusca(false)} aoAbrirApp={abrir}
        aoAjuste={(destino) => { setBusca(false); if (destino === "@organizar") setOrganizar(true); else { setGaveta(null); setEstudio(destino as AbaEstudio); } }}
        aoWeb={(url) => { setBusca(false); void motor.abrirUrl(url).catch(() => falar("Não consegui abrir o navegador.")); }} />}
      {pedirConta && <Conta aparelho={aparelhoLocal()} motivo="Entre com o Vetorial ID para usar a inteligência artificial." aoEntrar={(s) => { guardarSessao(s); setSessao(s); setPedirConta(false); setOrganizar(true); }} aoFechar={() => setPedirConta(false)} />}

      {menuVazio && <MenuVazio papel={papel} bloqueado={banco.bloqueado} aoFechar={() => setMenuVazio(false)} aoUsarPronto={usarPronto} aoPapel={() => setEstudio("papel")} aoWidgets={() => setEstudio("widgets")} aoApps={() => setGaveta({ busca: false })}
        aoPasta={() => setCriarPastaAberto(true)} aoGrade={() => setEstudio("inicio")} aoIcones={() => setEstudio("icones")} aoEstudio={() => setEstudio("temas")} aoBloquear={() => { mudar((b) => ({ ...b, bloqueado: !b.bloqueado })); falar(banco.bloqueado ? "Layout desbloqueado." : "Layout bloqueado."); }} />}

      {criarPastaAberto && <CriarPasta candidatos={candidatos0} aoFechar={() => setCriarPastaAberto(false)} aoCriar={criarVarias} />}

      {gaveta && <Gaveta apps={visiveis} estilo={banco.tema.gaveta} aoBuscar={() => setBusca(true)} aoOrganizar={() => setOrganizar(true)} aoFechar={() => setGaveta(null)} aoAbrir={abrir} aoMenu={(pacote) => setMenu({ pacote, origem: "gaveta" })} />}

      {pasta && !menu && <FolhaPasta pasta={pasta} rotulo={banco.tema.rotulos} apps={pasta.apps.map((a) => porPacote.get(a)).filter((a): a is AppInfo => !!a)}
        aoFechar={() => setPastaAberta(null)} aoRenomear={(n) => mudar((b) => renomearPasta(b, pasta.id, n))} aoAbrir={abrir} aoMenu={(pacote) => setMenu({ pacote, origem: "pasta", pastaId: pasta.id })} />}

      {nova && <Atualizacao nova={nova} aoFechar={() => setNova(null)} />}

      {estudio && <Estudio email={sessao?.email ?? ""} aoEntrarConta={() => setPedirConta(true)} aoSairDaConta={() => { if (sessao) void sairDaConta(sessao.token); guardarSessao(null); setSessao(null); setAdiado(false); setEstudio(false); }} aoOrganizar={() => setOrganizar(true)} aoProcurar={procurarAgora} abaInicial={estudio} papel={papel} aoPapel={setPapel} banco={banco} apps={apps} aoMudar={mudar} aoFechar={() => setEstudio(false)} aviso={falar}
        aoRecomecar={() => mudar((b) => layoutInicial(apps, { ...bancoPadrao(), tema: b.tema, relogio: b.relogio, widgets: b.widgets, gesto: b.gesto, bloqueado: b.bloqueado, musica: b.musica, faixa: b.faixa, modo: b.modo, categorias: b.categorias, atribuidos: b.atribuidos, manuais: b.manuais }))} aoTour={() => setRever("tour")} aoTermos={() => setRever("termos")} />}

      {menu && appDoMenu && (
        <MenuApp app={appDoMenu} origem={menu.origem} noDock={banco.layout.dock.includes(menu.pacote)} naTela={naTela(banco).has(menu.pacote)} bloqueado={banco.bloqueado} podeAgrupar={naTela(banco).size >= 2} favorito={banco.favoritos.includes(menu.pacote)}
          aoFavoritar={() => { if (banco.favoritos.includes(menu.pacote)) mudar((b) => desfavoritar(b, menu.pacote)); else comAviso(favoritar(banco, menu.pacote), "O máximo é 16 favoritos."); }} aoMover={() => setMover(menu.pacote)}
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

