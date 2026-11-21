import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FeedbackDoApp } from "./FeedbackDoApp";
import {
  adicionarWidget, ajustarTema, CANTOS, COLUNAS, DESFOQUE, ESCURO, SATURACAO, TEMPERATURA, VINHETA, APLICAR_EM, LUZES, ANIM_BLOQUEIO, ITENS_MENU, type CoresIcones, type FundoExterno, type UnidadeTemp, type AcaoGesto, PASTA_ABRE, SUPERFICIES, type AnimBloqueio, type PastaAbre, type Superficie, ORDENS, type OrdemGaveta, type AplicarEm, type Luz, escolherTema, exportar, importar, LINHAS, MAX_WIDGETS, TAMANHO_WIDGET, mostrar, mudarGrade, NOMES_DOS_TEMAS, NOMES_WIDGET, ordenar,
  reconciliar, removerWidget, TAMANHO_ICONE, TEMAS, TIPOS_WIDGET,
  MAX_CATEGORIAS, MAX_FAVORITOS, CATEGORIA_RESERVA, type Categoria, type ModoInicio,
  type AppInfo, type Banco, type EstiloBotao, type EstiloDock, type EstiloGaveta, type EstiloPasta, type Forma, type Fundo, type Gesto, type PacoteIcones, type TipoWidget,
} from "../dados.ts";
import { CENAS, aplicarCena } from "../cenas";
import { codigoDoTema, gravarSalvos, juntarSalvo, lerSalvos, temaDoCodigo, tirarSalvo, MAX_SALVOS, type TemaSalvo } from "../temasSalvos";
import { PARTES_CENA, aplicarCenaMinha, gravarCenasMinhas, juntarCena, lerCenasMinhas, tirarCena, MAX_CENAS_MINHAS, type CenaMinha, type ParteCena } from "../cenasMinhas";
import { definirIconeApp, escolherIcone, useIconeApp } from "../iconesApp";
import { Glifo } from "./IconeApp";
import { fundoCss } from "../tema";
import { motor, type ExternoInfo } from "../motor";
import { Icone, type NomeIcone } from "../icones";
import { apagarPapel, desenharPronto, escolherFoto, guardarFavoritos, guardarPapel, juntarFavorito, lerFavoritos, MAX_FAVORITOS as MAX_PAPEIS_FAV, PRONTOS } from "../papel";
import { buscarLugares, type Lugar } from "../widgets";
import { PreviaWidget } from "./Widgets";
import { useRef as useRefP, useState as useStateP, type ReactNode as NodeP } from "react";

/** Mostra a prévia no tamanho natural e encolhe para caber na metade da tela, mantendo a proporção entre os widgets. */
function PreviaEscalada({ w, h, children }: { w: number; h: number; children: NodeP }) {
  const caixa = useRefP<HTMLDivElement>(null);
  const [escala, setEscala] = useStateP(0.5);
  const largura = w * 83 - 8, altura = h * 72 - 8;
  useLayoutEffect(() => {
    const el = caixa.current; if (!el) return;
    const medir = () => setEscala(Math.min(1, el.clientWidth / 332));
    medir();
    const ro = new ResizeObserver(medir); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={caixa} className="previa-escala" style={{ height: altura * escala }}>
      <div style={{ width: largura, height: altura, transform: `scale(${escala})`, transformOrigin: "top left", display: "flex" }}>{children}</div>
    </div>
  );
}
import { Aviso, Botao, Cartao, Interruptor, Linha, Passo, Seletor } from "../ui";
import { Inicio } from "./Inicio";
import { apagarCategoria, contagens, criarCategoria, editarCategoria, reordenarCategoria } from "../categorias.ts";
import { NovaCategoria } from "./Menus";
import { usosDosApps } from "../busca.ts";

/** Atalhos de entrada (menus e botões abrem o editor já na parte certa). */
export type AbaEstudio = "temas" | "widgets" | "papel" | "icones" | "inicio" | "categorias" | `${string}/${string}`;
type Secao = "temas" | "inicio" | "categorias" | "apps" | "papel" | "widgets" | "config";
interface Parte { id: string; nome: string; icone: NomeIcone }
interface DefSecao { id: Secao; nome: string; icone: NomeIcone; partes: Parte[] }

const NOMES_MENU: Record<(typeof ITENS_MENU)[number], string> = { papel: "Editar papel de parede", widgets: "Adicionar widget", apps: "Adicionar aplicativos", atalhos: "Adicionar atalhos", pasta: "Criar pasta", grade: "Editar tela inicial", icones: "Personalizar ícones", temas: "Temas", estudio: "Configurações do V-Space", bloquear: "Bloquear layout" };
const SECOES: DefSecao[] = [
  { id: "temas", nome: "Temas", icone: "tema", partes: [{ id: "escolha", nome: "Escolha", icone: "ok" }, { id: "cenas", nome: "Cenas", icone: "cena" }, { id: "cores", nome: "Cores", icone: "paleta" }, { id: "salvos", nome: "Salvos", icone: "estrela" }, { id: "compartilhar", nome: "Compartilhar", icone: "compartilhar" }] },
  { id: "inicio", nome: "Início", icone: "tela", partes: [{ id: "grade", nome: "Disposição", icone: "grade" }, { id: "icones", nome: "Ícones", icone: "forma" }, { id: "superficie", nome: "Superfície", icone: "superficie" }, { id: "dock", nome: "Dock", icone: "dock" }, { id: "pastas", nome: "Pastas", icone: "pasta" }, { id: "musica", nome: "Música", icone: "nota" }] },
  { id: "categorias", nome: "Categorias", icone: "pasta", partes: [{ id: "modo", nome: "Tela inicial", icone: "tela" }, { id: "lista", nome: "Suas categorias", icone: "lista" }] },
  { id: "apps", nome: "Aplicativos", icone: "gaveta", partes: [{ id: "gaveta", nome: "Disposição", icone: "gaveta" }, { id: "geral", nome: "Geral", icone: "ajustes" }, { id: "icones", nome: "Ícones", icone: "forma" }, { id: "ocultos", nome: "Ocultos", icone: "ocultar" }] },
  { id: "papel", nome: "Papel de parede", icone: "papel", partes: [{ id: "escolha", nome: "Escolha", icone: "papel" }, { id: "luz", nome: "Luz do dia", icone: "tema" }, { id: "favoritos", nome: "Favoritos", icone: "ok" }, { id: "fontes", nome: "Fontes", icone: "papel" }, { id: "geral", nome: "Geral", icone: "ajustes" }, { id: "ajustes", nome: "Editor", icone: "ajustes" }] },
  { id: "widgets", nome: "Widgets", icone: "widgets", partes: [{ id: "adicionar", nome: "Adicionar", icone: "mais" }, { id: "gerenciar", nome: "Gerenciar", icone: "lista" }, { id: "geral", nome: "Geral", icone: "ajustes" }] },
  { id: "config", nome: "Configurações", icone: "engrenagem", partes: [{ id: "conta", nome: "Conta", icone: "social" }, { id: "geral", nome: "Geral", icone: "ajustes" }, { id: "gestos", nome: "Gestos", icone: "gesto" }, { id: "menu", nome: "Menu", icone: "grade" }, { id: "atalhos", nome: "Atalhos", icone: "nota" }, { id: "privacidade", nome: "Privacidade", icone: "olho" }, { id: "backup", nome: "Backup", icone: "backup" }, { id: "seguro", nome: "Espaço seguro", icone: "cofre" }, { id: "padrao", nome: "Launcher", icone: "casa" }, { id: "sobre", nome: "Sobre", icone: "info" }] },
];
const ENTRADA: Record<string, [Secao, string]> = { temas: ["temas", "escolha"], widgets: ["widgets", "adicionar"], papel: ["papel", "escolha"], icones: ["inicio", "icones"], inicio: ["inicio", "grade"], categorias: ["categorias", "lista"] };

const CORES = ["#22d3ee", "#38bdf8", "#8ab4ff", "#a78bfa", "#e879f9", "#f472b6", "#fb7185", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#2dd4bf", "#ffffff"];
const FUNDOS_ESCUROS = ["#000000", "#05070d", "#0b1020", "#12081a", "#14080a", "#04100b", "#101010", "#1a1033"];
const FORMAS: { id: Forma; nome: string }[] = [{ id: "original", nome: "Original" }, { id: "circulo", nome: "Círculo" }, { id: "squircle", nome: "Arredondado" }, { id: "quadrado", nome: "Quadrado" }];
const FUNDOS: { id: Fundo; nome: string }[] = [{ id: "aurora", nome: "Aurora" }, { id: "neon", nome: "Neon" }, { id: "noite", nome: "Noite" }, { id: "cor", nome: "Cor lisa" }];
const PACOTES: { id: PacoteIcones; nome: string }[] = [{ id: "original", nome: "Original" }, { id: "mono", nome: "Monocromático" }, { id: "tingido", nome: "Tingido" }, { id: "vivo", nome: "Vivo" }];
const DOCKS: { id: EstiloDock; nome: string }[] = [{ id: "vidro", nome: "Vidro" }, { id: "solido", nome: "Sólido" }, { id: "transparente", nome: "Transparente" }];
const PASTAS: { id: EstiloPasta; nome: string }[] = [{ id: "vidro", nome: "Vidro" }, { id: "solida", nome: "Sólida" }, { id: "contorno", nome: "Contorno" }];
const GESTOS: { id: Gesto; nome: string }[] = [{ id: "gaveta", nome: "Gaveta de apps" }, { id: "pesquisa", nome: "Pesquisar" }, { id: "nada", nome: "Nada" }];

function Paleta({ valor, cores, aoEscolher, rotulo }: { valor: string; cores: string[]; aoEscolher: (c: string) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {cores.map((c) => (
        <button key={c} type="button" aria-label={`${rotulo} ${c}`} aria-pressed={valor === c} onClick={() => aoEscolher(c)}
          className={`grid size-11 place-items-center rounded-full border-2 ${valor === c ? "border-white" : "border-white/15"}`} style={{ background: c }}>{valor === c && <span className="text-[#04121c]"><Icone nome="ok" tam={18} /></span>}</button>
      ))}
    </div>
  );
}

/** A tela inicial de verdade, em miniatura: muda ao vivo enquanto você mexe. Tocar nela volta para a tela inicial. */
function Previa({ banco, porPacote, papel, aoVoltar }: { banco: Banco; porPacote: Map<string, AppInfo>; papel: string | null; aoVoltar: () => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.4);
  const proporcao = Math.min(2.2, Math.max(1.6, (typeof window === "undefined" ? 2 : window.innerHeight / Math.max(1, window.innerWidth))));
  const L = 360, A = Math.round(L * proporcao);
  useLayoutEffect(() => {
    const el = caixa.current; if (!el) return;
    const medir = () => { const h = el.clientHeight, l = el.clientWidth; if (h > 0 && l > 0) setK(Math.min(h / A, l / L)); };
    medir();
    const o = new ResizeObserver(medir); o.observe(el);
    return () => o.disconnect();
  }, [A]);
  const nada = () => undefined;
  return (
    <div className="editor-previa" ref={caixa} role="button" tabIndex={0} aria-label="Voltar para a tela inicial" title="Toque para voltar à tela inicial" onClick={aoVoltar} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); aoVoltar(); } }}>
      <div className="previa-moldura" style={{ width: L * k, height: A * k }} {...{ inert: true }}>
        <div className="previa-tela" style={{ width: L, height: A, transform: `scale(${k})` }}>
          <Inicio banco={banco} porPacote={porPacote} aoAbrirApp={nada} aoMenuApp={nada} aoAbrirPasta={nada} aoGaveta={nada} aoEstudio={nada} aoMenuVazio={nada} papel={papel} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  banco: Banco; apps: AppInfo[]; aoMudar: (f: (b: Banco) => Banco) => void; aoFechar: () => void; aviso: (m: string) => void;
  aoRecomecar: () => void; aoTour: () => void; aoTermos: () => void;
  email: string; aoEntrarConta: () => void; aoSairDaConta: () => void; aoOrganizar: () => void; aoProcurar: () => Promise<void>; aoAbrirSeguro: () => void; abaInicial: AbaEstudio; papel: string | null; aoPapel: (p: string | null) => void;
}

/** O Estúdio: a tela inicial em miniatura no alto, as seções nas laterais e as opções embaixo. */
export function Estudio({ banco, apps, aoMudar, aoFechar, aviso, aoRecomecar, aoTour, aoTermos, abaInicial, papel, aoPapel, aoProcurar, aoAbrirSeguro, aoOrganizar, email, aoEntrarConta, aoSairDaConta }: Props) {
  const [minhas, setMinhas] = useState<CenaMinha[]>(() => lerCenasMinhas());
  const [feedback, setFeedback] = useState(false);
  const [nomeCena, setNomeCena] = useState("");
  const [partesCena, setPartesCena] = useState<ParteCena[]>(["cores", "icones", "superficie"]);
  const guardarCena = () => {
    const l = juntarCena(minhas, nomeCena, partesCena, banco.tema);
    if (!l) { aviso(!nomeCena.trim() ? "Dê um nome à cena." : !partesCena.length ? "Escolha pelo menos uma parte." : `Já são ${MAX_CENAS_MINHAS} cenas. Apague uma.`); return; }
    if (!gravarCenasMinhas(l)) { aviso("Não há espaço para guardar a cena."); return; }
    setMinhas(l); setNomeCena(""); aviso("Cena guardada.");
  };
  const [salvos, setSalvos] = useState<TemaSalvo[]>(() => lerSalvos());
  const [nomeSalvo, setNomeSalvo] = useState("");
  const [codigoImp, setCodigoImp] = useState("");
  const guardarTema = () => {
    const l = juntarSalvo(salvos, nomeSalvo, banco.tema);
    if (!l) { aviso(nomeSalvo.trim() ? `Já são ${MAX_SALVOS} temas guardados. Apague um.` : "Dê um nome ao tema."); return; }
    if (!gravarSalvos(l)) { aviso("Não há espaço para guardar o tema."); return; }
    setSalvos(l); setNomeSalvo(""); aviso("Tema guardado.");
  };
  const [editCat, setEditCat] = useState<Categoria | "nova" | null>(null);
  const [entrada] = useState<[Secao, string]>(() => { const e = ENTRADA[abaInicial]; if (e) return e; const [s, p] = abaInicial.split("/"); const sec = SECOES.find((x) => x.id === s); return sec && sec.partes.some((x) => x.id === p) ? [sec.id, p!] : ["temas", "escolha"]; });
  const [secao, setSecao] = useState<Secao>(entrada[0]);
  const [parte, setParte] = useState<string>(entrada[1]);
  const [padrao, setPadrao] = useState<boolean | null>(null);
  const [confirmaZero, setConfirmaZero] = useState(false);
  const [erro, setErro] = useState("");
  const [cidade, setCidade] = useState("");
  const [buscaW, setBuscaW] = useState("");
  const [appW, setAppW] = useState("");
  const [externos, setExternos] = useStateP<ExternoInfo[] | null>(null);
  const [criandoExterno, setCriandoExterno] = useStateP("");
  useEffect(() => { if (secao === "widgets" && parte === "adicionar" && externos === null) void motor.widgetsExternos().then(setExternos); }, [secao, parte, externos]);
  const incluirExterno = async (x: ExternoInfo) => {
    if (banco.widgets.length >= MAX_WIDGETS) { setErro(`Cabem até ${MAX_WIDGETS} widgets. Remova um para colocar outro.`); return; }
    setErro(""); setCriandoExterno(x.provider);
    try {
      const r = await motor.criarWidgetExterno(x.provider);
      aoMudar((b) => adicionarWidget(b, { tipo: "externo", provider: x.provider, appId: r.id, titulo: `${x.app}: ${x.nome}`.slice(0, 60), w: r.w, h: r.h }).banco);
      aviso(`${x.nome} adicionado.`);
    } catch (e) { setErro(e instanceof Error && e.message ? e.message : "Não consegui adicionar esse widget."); }
    setCriandoExterno("");
  };
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [procurando, setProcurando] = useState(false);
  const [musicaOk, setMusicaOk] = useState<boolean | null>(null);
  useEffect(() => { if (secao === "config" && parte === "atalhos") { const ler = () => { void motor.musicaPermitida().then(setMusicaOk); }; ler(); document.addEventListener("visibilitychange", ler); return () => document.removeEventListener("visibilitychange", ler); } }, [secao, parte]);
  useEffect(() => { void motor.ehPadrao().then(setPadrao).catch(() => setPadrao(null)); }, []);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);
  const porPacote = useMemo(() => new Map(apps.map((a) => [a.pacote, a])), [apps]);
  const t = banco.tema;
  const def = SECOES.find((s) => s.id === secao)!;
  const ocultos = ordenar(apps.filter((a) => banco.ocultos.includes(a.pacote)));
  const cheio = banco.widgets.length >= MAX_WIDGETS;
  const ir = (s: Secao) => { setSecao(s); setParte(SECOES.find((x) => x.id === s)!.partes[0]!.id); setErro(""); };
  const nomeDaParte = def.partes.find((p) => p.id === parte)?.nome ?? "";

  const usarPapel = (url: string | null) => {
    if (!url) { setErro("Não consegui abrir essa imagem."); return false; }
    if (!guardarPapel(url)) { setErro("Não há espaço para guardar esse papel de parede."); return false; }
    setErro(""); aoPapel(url); return true;
  };
  const daGaleria = async () => { const u = await escolherFoto(); if (u && usarPapel(u)) aoMudar((b) => ajustarTema(b, { fundo: "foto" })); };
  const [favoritos, setFavoritos] = useState<string[]>(() => lerFavoritos());
  const guardarAtual = () => {
    if (!papel) { aviso("Escolha uma foto primeiro."); return; }
    const nova = juntarFavorito(favoritos, papel);
    if (!guardarFavoritos(nova)) { aviso("Não há espaço para guardar mais um favorito."); return; }
    setFavoritos(nova); aviso("Papel guardado nos favoritos.");
  };
  const tirarFavorito = (i: number) => { const nova = favoritos.filter((_, k) => k !== i); guardarFavoritos(nova); setFavoritos(nova); };
  const usarFavorito = (u: string) => { if (usarPapel(u)) aoMudar((b) => ajustarTema(b, { fundo: "foto" })); };
  const aplicarAndroid = async (destino: "inicio" | "bloqueio" | "ambas") => {
    if (!papel) { aviso("Escolha uma foto primeiro."); return; }
    aviso((await motor.definirPapelSistema(papel, destino)) ? "Papel aplicado no Android." : "O Android não deixou trocar o papel de parede.");
  };
  const semPapel = () => { apagarPapel(); aoPapel(null); aoMudar((b) => ajustarTema(b, { fundo: "aurora" })); aviso("Papel de parede removido."); };
  const comCena = (id: string) => {
    const c = CENAS.find((x) => x.id === id); if (!c) return;
    const p = c.papel ? PRONTOS.find((x) => x.id === c.papel) : undefined;
    const ok = p ? usarPapel(desenharPronto(p)) : false;
    aoMudar((b) => aplicarCena(b, c, ok)); aviso(`Cena ${c.nome} aplicada.`);
  };
  const incluir = (tipo: TipoWidget, extra: { cidade?: string; lat?: number; lon?: number } = {}) => {
    if (!adicionarWidget(banco, { tipo, ...extra }).ok) { setErro(`Cabem até ${MAX_WIDGETS} widgets. Remova um para colocar outro.`); return; }
    setErro(""); aoMudar((b) => adicionarWidget(b, { tipo, ...extra }).banco); aviso(`${NOMES_WIDGET[tipo]} adicionado.`);
  };
  const procurarCidade = async () => {
    setErro(""); setProcurando(true);
    try { const l = await buscarLugares(cidade); setLugares(l); if (!l.length) setErro("Não achei essa cidade. Tente outro nome."); }
    catch { setErro("Não consegui procurar a cidade agora."); setLugares(null); }
    finally { setProcurando(false); }
  };
  const salvar = async () => {
    setErro("");
    const dia = new Date().toISOString().slice(0, 10);
    try { const ok = await motor.salvarArquivo(`vetorial-home-backup-${dia}.json`, exportar(banco)); aviso(ok ? "Backup salvo." : "Não salvei o backup."); } catch { setErro("Não consegui salvar o backup agora."); }
  };
  const restaurar = async () => {
    setErro("");
    try {
      const texto = await motor.lerArquivo();
      if (texto === null) return;
      const b = importar(texto);
      if (!b) { setErro("Esse arquivo não é um backup do V-Space."); return; }
      aoMudar(() => reconciliar(b, new Set(apps.map((a) => a.pacote))));
      aviso("Backup restaurado.");
    } catch { setErro("Não consegui ler o arquivo."); }
  };

  const painel = (() => {
    const id = `${secao}/${parte}`;
    switch (id) {
      case "temas/escolha": return (
        <div className="grid grid-cols-2 gap-3">
          {TEMAS.map((x) => (
            <button key={x.id} type="button" aria-pressed={t.id === x.id} onClick={() => aoMudar((b) => escolherTema(b, x.id))} className={`overflow-hidden rounded-2xl border-2 text-left ${t.id === x.id ? "border-neon" : "border-borda"}`}>
              <span className="block h-16" style={{ background: fundoCss(x) }}><span className="flex h-full items-end gap-1 p-2"><i className="size-4 rounded-full" style={{ background: x.cor }} /><i className="size-4 rounded-full" style={{ background: x.cor2 }} /></span></span>
              <span className="block px-3 py-2 text-sm font-medium">{NOMES_DOS_TEMAS[x.id]}</span>
            </button>
          ))}
        </div>
      );
      case "temas/cenas": return (
        <div className="space-y-3">
          <Cartao titulo="Nova cena">
            <p className="mb-3 text-sm text-suave">Guarde só as partes da aparência atual que você escolher. Ao aplicar, o resto não muda.</p>
            {PARTES_CENA.map((p) => <Linha key={p.id} titulo={p.nome} texto={p.texto}><Interruptor rotulo={p.nome} ligado={partesCena.includes(p.id)} aoMudar={(v) => setPartesCena((a) => (v ? [...a, p.id] : a.filter((x) => x !== p.id)))} /></Linha>)}
            <label className="mt-3 block text-sm text-suave">Nome da cena
              <input value={nomeCena} maxLength={24} onChange={(e) => setNomeCena(e.target.value)} className="mt-1 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
            </label>
            <Botao variante="primario" className="mt-3" onClick={guardarCena}>Guardar cena</Botao>
          </Cartao>
          {minhas.length > 0 && (
            <Cartao titulo={`Minhas cenas (${minhas.length}/${MAX_CENAS_MINHAS})`}>
              <ul className="space-y-1">{minhas.map((m) => <li key={m.id} className="flex min-h-12 items-center justify-between gap-3"><span className="min-w-0"><b className="block truncate">{m.nome}</b><span className="block truncate text-xs text-suave">{m.partes.map((x) => PARTES_CENA.find((q) => q.id === x)?.nome).join(", ")}</span></span><span className="flex shrink-0 gap-2"><Botao onClick={() => { aoMudar((b) => aplicarCenaMinha(b, m)); aviso(`Cena ${m.nome} aplicada.`); }} aria-label={`Aplicar cena ${m.nome}`}>Aplicar</Botao><Botao variante="perigo" onClick={() => { const l = tirarCena(minhas, m.id); gravarCenasMinhas(l); setMinhas(l); }} aria-label={`Apagar cena ${m.nome}`}>Apagar</Botao></span></li>)}</ul>
            </Cartao>
          )}
          <p className="text-sm text-suave">Cenas prontas: um toque muda o tema, o papel de parede e o estilo dos ícones de uma vez. Dá para ajustar depois.</p>
          <div className="grid grid-cols-2 gap-3">
            {CENAS.map((c) => { const p = PRONTOS.find((x) => x.id === c.papel); return (
              <button key={c.id} type="button" aria-label={`Cena ${c.nome}`} onClick={() => comCena(c.id)} className="overflow-hidden rounded-2xl border-2 border-borda text-left">
                <span className="block h-20" style={{ background: p ? `linear-gradient(160deg, ${p.cores[1]}aa, ${p.cores[0]} 55%, ${p.cores[2]}99)` : "#0b1020" }} />
                <span className="block px-3 py-2 text-sm font-medium">{c.nome}</span>
              </button>
            ); })}
          </div>
        </div>
      );
      case "temas/salvos": return (
        <div className="space-y-4">
          <Cartao titulo="Guardar o tema de agora">
            <label className="block text-sm text-suave">Nome
              <input value={nomeSalvo} maxLength={24} onChange={(e) => setNomeSalvo(e.target.value)} className="mt-1 min-h-11 w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
            </label>
            <Botao variante="primario" className="mt-3" onClick={guardarTema}>Guardar tema</Botao>
          </Cartao>
          <Cartao titulo={`Meus temas (${salvos.length}/${MAX_SALVOS})`}>
            {salvos.length === 0 ? <p className="text-sm text-suave">Nenhum tema guardado ainda.</p>
              : <ul className="space-y-1">{salvos.map((s) => <li key={s.id} className="flex min-h-12 items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-3"><i className="size-5 flex-none rounded-full" style={{ background: s.tema.cor }} /><span className="min-w-0 truncate">{s.nome}</span></span><span className="flex shrink-0 gap-2"><Botao onClick={() => { aoMudar((b) => ({ ...b, tema: { ...s.tema } })); aviso(`Tema ${s.nome} aplicado.`); }} aria-label={`Usar tema ${s.nome}`}>Usar</Botao><Botao variante="perigo" onClick={() => { const l = tirarSalvo(salvos, s.id); gravarSalvos(l); setSalvos(l); }} aria-label={`Apagar tema ${s.nome}`}>Apagar</Botao></span></li>)}</ul>}
          </Cartao>
        </div>
      );
      case "temas/compartilhar": return (
        <div className="space-y-4">
          <Cartao titulo="Compartilhar meu tema">
            <p className="mb-3 text-sm text-suave">Copie o código e mande para um amigo. Ele cola em “Importar”.</p>
            <Botao variante="primario" onClick={() => { void navigator.clipboard?.writeText(codigoDoTema(t)).then(() => aviso("Código copiado."), () => aviso("Não deu para copiar.")); }}>Copiar código do tema</Botao>
          </Cartao>
          <Cartao titulo="Importar tema">
            <textarea aria-label="Código do tema" value={codigoImp} onChange={(e) => setCodigoImp(e.target.value)} rows={3} className="w-full rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 p-3 text-sm text-texto outline-none focus:border-neon" placeholder="Cole aqui o código (VSPACE1:…)" />
            <Botao variante="primario" className="mt-3" onClick={() => { const x = temaDoCodigo(codigoImp); if (!x) { aviso("Esse código não é válido."); return; } aoMudar((b) => ({ ...b, tema: x })); setCodigoImp(""); aviso("Tema importado."); }}>Importar</Botao>
          </Cartao>
          <Cartao titulo="Animação de bloqueio">
            <Seletor<AnimBloqueio> rotulo="Animação ao travar o layout" valor={t.animBloqueio} opcoes={[{ id: "cadeado", nome: "Cadeado" }, { id: "pulso", nome: "Pulso" }, { id: "brilho", nome: "Brilho" }, { id: "nenhuma", nome: "Nenhuma" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { animBloqueio: v }))} />
          </Cartao>
        </div>
      );
      case "temas/cores": return (
        <div className="space-y-4">
          <Cartao titulo="Saturação das cores">
            <Seletor<CoresIcones> rotulo="Saturação das cores" valor={t.cores} opcoes={[{ id: "plenas", nome: "Cores plenas" }, { id: "suave", nome: "Suave" }, { id: "esmaecido", nome: "Esmaecido" }, { id: "pb", nome: "Preto e branco" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { cores: v }))} />
            <p className="mt-3 text-sm text-suave">Muda a cor dos ícones dos apps. O papel de parede e os widgets continuam como estão.</p>
          </Cartao>
          <Cartao titulo="Cor principal"><Paleta rotulo="Cor principal" valor={t.cor} cores={CORES} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { cor: c }))} /></Cartao>
          <Cartao titulo="Cor de apoio"><Paleta rotulo="Cor de apoio" valor={t.cor2} cores={CORES} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { cor2: c }))} /></Cartao>
          <Cartao titulo="Fundo (sem foto)">
            <Seletor<Fundo> rotulo="Estilo do fundo" valor={t.fundo} opcoes={FUNDOS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { fundo: v }))} />
            <div className="mt-3"><Paleta rotulo="Cor do fundo" valor={t.fundoCor} cores={FUNDOS_ESCUROS} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { fundoCor: c }))} /></div>
          </Cartao>
        </div>
      );
      case "categorias/modo": return (
        <div className="space-y-4">
          <Cartao titulo="Como a tela inicial aparece">
            <Seletor<ModoInicio> rotulo="Tela inicial" valor={banco.modo} opcoes={[{ id: "categorias", nome: "Categorias" }, { id: "grade", nome: "Grade de apps" }, { id: "blocos", nome: "Blocos" }, { id: "minimalista", nome: "Minimalista" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, modo: v }))} />
            <p className="mt-2 text-sm text-suave">{({ categorias: "Só widgets e favoritos na tela; os outros apps ficam nas categorias, no trilho da lateral.", grade: "Os apps ficam espalhados em páginas, com dock embaixo.", blocos: "Cada categoria vira um bloco colorido. Toque no bloco para ver os apps dela.", minimalista: "Hora e data grandes, seus widgets e os favoritos só como texto." } as const)[banco.modo]}</p>
          </Cartao>
          <Cartao titulo={`Favoritos (${banco.favoritos.length} de ${MAX_FAVORITOS})`}>
            <p className="mb-2 text-sm text-suave">Para mudar, segure um app e escolha “Colocar nos favoritos”, ou toque em Adiciona na tela inicial.</p>
            <Botao disabled={!banco.favoritos.length} onClick={() => aoMudar((b) => ({ ...b, favoritos: [] }))}>Limpar favoritos</Botao>
          </Cartao>
        </div>
      );
      case "categorias/lista": {
        const cont = contagens(banco, apps, usosDosApps());
        return (
          <div className="space-y-4">
            <Botao variante="primario" className="w-full" onClick={aoOrganizar}><span className="inline-flex items-center gap-2"><Icone nome="brilho" tam={20} />Organizar com IA</span></Botao>
            <Cartao titulo={`Categorias (${banco.categorias.length} de ${MAX_CATEGORIAS})`}>
              <ul className="space-y-1">
                {banco.categorias.map((c, i) => (
                  <li key={c.id} className="flex min-h-12 items-center gap-2">
                    <Icone nome={c.icone} /><span className="min-w-0 flex-1 truncate">{c.nome} <span className="text-xs text-suave">· {cont[c.id] ?? 0}</span></span>
                    <button type="button" aria-label={`Subir ${c.nome}`} disabled={i === 0} onClick={() => aoMudar((b) => reordenarCategoria(b, c.id, -1))} className="grid size-10 place-items-center rounded-full border border-borda disabled:opacity-40"><span className="rotate-90"><Icone nome="voltar" tam={18} /></span></button>
                    <button type="button" aria-label={`Descer ${c.nome}`} disabled={i === banco.categorias.length - 1} onClick={() => aoMudar((b) => reordenarCategoria(b, c.id, 1))} className="grid size-10 place-items-center rounded-full border border-borda disabled:opacity-40"><span className="-rotate-90"><Icone nome="voltar" tam={18} /></span></button>
                    <button type="button" aria-label={`Editar ${c.nome}`} onClick={() => setEditCat(c)} className="grid size-10 place-items-center rounded-full border border-borda"><Icone nome="estudio" tam={18} /></button>
                    {c.id !== CATEGORIA_RESERVA && <button type="button" aria-label={`Apagar ${c.nome}`} onClick={() => aoMudar((b) => apagarCategoria(b, c.id))} className="grid size-10 place-items-center rounded-full border border-borda text-erro"><Icone nome="lixeira" tam={18} /></button>}
                  </li>
                ))}
              </ul>
              <Botao className="mt-3 w-full" disabled={banco.categorias.length >= MAX_CATEGORIAS} onClick={() => setEditCat("nova")}>Nova categoria</Botao>
              <p className="mt-2 text-sm text-suave">Apagar uma categoria não apaga apps: eles voltam para a categoria certa ou para “Ferramentas e mais”.</p>
            </Cartao>
          </div>
        );
      }
      case "inicio/grade": return (
        <div className="space-y-4">
          <Cartao titulo="Grade">
            <Linha titulo="Colunas"><Passo rotulo="colunas" valor={banco.layout.colunas} min={COLUNAS.min} max={COLUNAS.max} aoMudar={(v) => aoMudar((b) => mudarGrade(b, v, b.layout.linhas))} /></Linha>
            <Linha titulo="Linhas"><Passo rotulo="linhas" valor={banco.layout.linhas} min={LINHAS.min} max={LINHAS.max} aoMudar={(v) => aoMudar((b) => mudarGrade(b, b.layout.colunas, v))} /></Linha>
          </Cartao>
          <Cartao><Linha titulo="Relógio" texto="Hora e data no alto da tela inicial."><Interruptor rotulo="Relógio" ligado={banco.relogio} aoMudar={(v) => aoMudar((b) => ({ ...b, relogio: v }))} /></Linha></Cartao>
        </div>
      );
      case "inicio/icones": return (
        <div className="space-y-4">
          <Cartao titulo="Forma"><Seletor<Forma> rotulo="Forma dos ícones" valor={t.forma} opcoes={FORMAS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { forma: v }))} /></Cartao>
          <Cartao titulo="Pacote de ícones"><Seletor<PacoteIcones> rotulo="Pacote de ícones" valor={t.pacote} opcoes={PACOTES} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { pacote: v }))} /></Cartao>
          <Cartao titulo="Tamanho"><div className="flex items-center gap-3"><input type="range" aria-label="Tamanho dos ícones" className="w-full" min={TAMANHO_ICONE.min} max={TAMANHO_ICONE.max} step={2} value={t.tamanho} onChange={(e) => aoMudar((b) => ajustarTema(b, { tamanho: Number(e.target.value) }))} /><span className="num w-10 text-right text-sm">{t.tamanho}</span></div></Cartao>
          <Cartao><Linha titulo="Nomes dos apps" texto="Mostra o nome embaixo de cada ícone."><Interruptor rotulo="Nomes dos apps" ligado={t.rotulos} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { rotulos: v }))} /></Linha></Cartao>
        </div>
      );
      case "inicio/musica": return (
        <div className="space-y-4">
          <Cartao><Linha titulo="Controles de música" texto="Mostra o player acima dos favoritos enquanto algo toca."><Interruptor rotulo="Controles de música" ligado={banco.musica} aoMudar={(v) => aoMudar((b) => ({ ...b, musica: v }))} /></Linha></Cartao>
          <Cartao titulo="Largura do player"><Seletor<string> rotulo="Largura do player" valor={banco.musicaOpc.largura} opcoes={[{ id: "1/2", nome: "1/2" }, { id: "3/5", nome: "3/5" }, { id: "1/1", nome: "1/1" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, musicaOpc: { ...b.musicaOpc, largura: v === "1/2" || v === "3/5" ? v : "1/1" } }))} /></Cartao>
          <Cartao titulo="Alinhamento do player"><Seletor<string> rotulo="Alinhamento do player" valor={banco.musicaOpc.alinhar} opcoes={[{ id: "esquerda", nome: "Esquerda" }, { id: "direita", nome: "Direita" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, musicaOpc: { ...b.musicaOpc, alinhar: v === "direita" ? "direita" : "esquerda" } }))} /></Cartao>
          <Cartao><Linha titulo="Mostrar botão da faixa anterior"><Interruptor rotulo="Mostrar botão da faixa anterior" ligado={banco.musicaOpc.anterior} aoMudar={(v) => aoMudar((b) => ({ ...b, musicaOpc: { ...b.musicaOpc, anterior: v } }))} /></Linha></Cartao>
          <Cartao><Linha titulo="Mostrar capa do álbum"><Interruptor rotulo="Mostrar capa do álbum" ligado={banco.musicaOpc.capa} aoMudar={(v) => aoMudar((b) => ({ ...b, musicaOpc: { ...b.musicaOpc, capa: v } }))} /></Linha></Cartao>
        </div>
      );
      case "inicio/superficie": return (
        <div className="space-y-4">
          <Cartao titulo="Material">
            <Seletor<Superficie> rotulo="Material do dock e dos widgets" valor={t.superficie} opcoes={[{ id: "vidro", nome: "Vidro" }, { id: "acrilico", nome: "Acrílico" }, { id: "cor", nome: "Cor do tema" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { superficie: v }))} />
            <p className="mb-2 mt-3 text-sm text-suave">Intensidade</p>
            <div className="flex items-center gap-3"><input type="range" aria-label="Intensidade da superfície" className="w-full" min={0} max={100} value={t.intensidade} onChange={(e) => aoMudar((b) => ajustarTema(b, { intensidade: Number(e.target.value) }))} /><span className="num w-10 text-right text-sm">{t.intensidade}</span></div>
          </Cartao>
          <Cartao titulo="Cantos">
            <p className="mb-2 text-sm text-suave">Arredondamento dos widgets, do dock e das janelas.</p>
            <div className="flex items-center gap-3"><input type="range" aria-label="Cantos" className="w-full" min={CANTOS.min} max={CANTOS.max} value={t.cantos} onChange={(e) => aoMudar((b) => ajustarTema(b, { cantos: Number(e.target.value) }))} /><span className="num w-10 text-right text-sm">{t.cantos}</span></div>
          </Cartao>
          <Cartao titulo="Botões"><Seletor<EstiloBotao> rotulo="Estilo dos botões" valor={t.botoes} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { botoes: v }))} opcoes={[{ id: "degrade", nome: "Degradê" }, { id: "contorno", nome: "Contorno" }, { id: "solido", nome: "Sólido" }]} /></Cartao>
        </div>
      );
      case "inicio/dock": return <Cartao titulo="Estilo do dock"><Seletor<EstiloDock> rotulo="Estilo do dock" valor={t.dock} opcoes={DOCKS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { dock: v }))} /></Cartao>;
      case "inicio/pastas": return (
        <div className="space-y-4">
          <Cartao titulo="Estilo das pastas"><Seletor<EstiloPasta> rotulo="Estilo das pastas" valor={t.pasta} opcoes={PASTAS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { pasta: v }))} /></Cartao>
          <Cartao titulo="Abrir pasta como"><Seletor<PastaAbre> rotulo="Abrir pasta como" valor={t.pastaAbre} opcoes={[{ id: "folha", nome: "Folha (de baixo)" }, { id: "janela", nome: "Janela (no meio)" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { pastaAbre: v }))} /></Cartao>
          <p className="text-sm text-suave">Para criar uma pasta, segure um espaço vazio da tela inicial e toque em Criar pasta.</p>
        </div>
      );
      case "apps/gaveta": return (
        <div className="space-y-4">
          <Cartao titulo="Estilo da gaveta"><Seletor<EstiloGaveta> rotulo="Estilo da gaveta" valor={t.gaveta} opcoes={[{ id: "lista", nome: "Lista com letras" }, { id: "grade", nome: "Grade" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { gaveta: v }))} /></Cartao>
          <Cartao titulo="Ordem dos apps">
            <Seletor<OrdemGaveta> rotulo="Ordem dos apps" valor={t.ordem} opcoes={[{ id: "az", nome: "A–Z" }, { id: "za", nome: "Z–A" }, { id: "novos", nome: "Instalados mais recentes" }, { id: "antigos", nome: "Instalados mais antigos" }, { id: "usados", nome: "Usados recentemente" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { ordem: v }))} />
            <p className="mt-3 text-sm text-suave">A–Z mostra as letras na lateral. As outras ordens mostram uma lista só. “Usados recentemente” conta os apps que você abre pelo V-Space.</p>
          </Cartao>
        </div>
      );
      case "apps/geral": return (
        <div className="space-y-4">
          <Cartao><Linha titulo="Selos de notificação" texto="Bolinha com o número de notificações nos ícones. Precisa do acesso às notificações."><Interruptor rotulo="Selos de notificação" ligado={t.selos} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { selos: v }))} /></Linha></Cartao>
          <Cartao><Linha titulo="Apps novos" texto="Mostra um ponto nos apps instalados há menos de 3 dias, até você abrir."><Interruptor rotulo="Apps novos" ligado={t.pontoNovo} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { pontoNovo: v }))} /></Linha></Cartao>
        </div>
      );
      case "apps/icones": return (
        <Cartao titulo="Ícone de cada app">
          <p className="mb-3 text-sm text-suave">Escolha uma imagem da galeria para ser o ícone de um app, só no V-Space. Dá para voltar ao original.</p>
          <ul className="space-y-1">
            {[...apps].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((a) => <LinhaIcone key={a.pacote} app={a} aviso={aviso} />)}
          </ul>
        </Cartao>
      );
      case "apps/ocultos": return (
        <Cartao titulo={`Apps ocultos (${ocultos.length})`}>
          {ocultos.length === 0 ? <p className="text-sm text-suave">Nenhum app oculto. Segure um app e escolha “Ocultar da gaveta”.</p>
            : <ul className="space-y-1">{ocultos.map((a) => <li key={a.pacote} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{a.nome}</span><Botao onClick={() => aoMudar((b) => mostrar(b, a.pacote))}><Icone nome="mostrar" tam={18} />Mostrar</Botao></li>)}</ul>}
        </Cartao>
      );
      case "papel/escolha": return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Botao variante="primario" onClick={() => void daGaleria()}><Icone nome="papel" tam={18} />Escolher da galeria</Botao>
            {t.fundo === "foto" && <Botao onClick={guardarAtual}><Icone nome="ok" tam={18} />Guardar nos favoritos</Botao>}
            {t.fundo === "foto" && <Botao onClick={semPapel}>Remover papel</Botao>}
          </div>
          <Cartao titulo="Papéis da Vetorial">
            <div className="grid grid-cols-3 gap-2">
              {PRONTOS.map((p) => <button key={p.id} type="button" aria-label={`Papel ${p.nome}`} className="papel-pronto" style={{ background: `linear-gradient(160deg, ${p.cores[1]}99, ${p.cores[0]} 55%, ${p.cores[2]}88)` }} onClick={() => { if (usarPapel(desenharPronto(p))) aoMudar((b) => ajustarTema(b, { fundo: "foto" })); }}><span>{p.nome}</span></button>)}
            </div>
          </Cartao>
        </div>
      );
      case "papel/luz": return (
        <div className="space-y-4">
          <Cartao titulo="Luz do dia">
            <p className="mb-3 text-sm text-suave">O papel recebe a cor da luz do sol de agora: quente ao amanhecer, clara ao meio-dia, dourada ao entardecer e azulada à noite.</p>
            <Seletor<Luz> rotulo="Luz do dia" valor={t.luz} opcoes={LUZES.map((v) => ({ id: v, nome: ({ nenhuma: "Desligada", sol: "Seguir sol", dia: "Dia", noite: "Noite" } as Record<Luz, string>)[v] }))} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { luz: v }))} />
          </Cartao>
        </div>
      );
      case "papel/favoritos": return (
        <div className="space-y-4">
          <Cartao titulo={`Favoritos (${favoritos.length} de ${MAX_PAPEIS_FAV})`}>
            {favoritos.length === 0 ? <p className="text-sm text-suave">Ainda não há favoritos. Guarde o papel que você está usando para voltar a ele com um toque.</p>
              : <div className="grid grid-cols-3 gap-2">{favoritos.map((u, i) => (
                <div key={i} className="relative">
                  <button type="button" aria-label={`Usar favorito ${i + 1}`} className="papel-pronto" style={{ backgroundImage: `url(${u})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={() => usarFavorito(u)} />
                  <button type="button" aria-label={`Remover favorito ${i + 1}`} className="fav-tirar" onClick={() => tirarFavorito(i)}><Icone nome="fechar" tam={14} /></button>
                </div>))}</div>}
            <div className="mt-3"><Botao variante="primario" onClick={guardarAtual}><Icone nome="ok" tam={18} />Guardar o papel atual</Botao></div>
          </Cartao>
        </div>
      );
      case "papel/fontes": return (
        <div className="space-y-4">
          <Cartao titulo="Carregar fotos"><p className="mb-3 text-sm text-suave">Escolha uma imagem da galeria do aparelho.</p><Botao onClick={() => void daGaleria()}><Icone nome="papel" tam={18} />Escolher da galeria</Botao></Cartao>
          <Cartao titulo="Papéis da Vetorial"><p className="mb-3 text-sm text-suave">Degradês prontos, na aba Escolha.</p><Botao onClick={() => setParte("escolha")}>Ver papéis prontos</Botao></Cartao>
          <Cartao titulo="Aplicar no Android"><p className="mb-3 text-sm text-suave">Usa o papel atual também fora do V-Space.</p>
            <div className="flex flex-wrap gap-2"><Botao onClick={() => void aplicarAndroid("inicio")}>Tela inicial</Botao><Botao onClick={() => void aplicarAndroid("bloqueio")}>Tela de bloqueio</Botao><Botao onClick={() => void aplicarAndroid("ambas")}>Ambas</Botao></div>
          </Cartao>
        </div>
      );
      case "papel/geral": return (
        <div className="space-y-4">
          <Cartao><Linha titulo="Papel de parede diário" texto="Troca o papel por um dos favoritos uma vez por dia."><Interruptor rotulo="Papel de parede diário" ligado={t.papelDiario} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { papelDiario: v }))} /></Linha></Cartao>
          <Cartao titulo="Aplicar papel de parede a">
            <Seletor<AplicarEm> rotulo="Aplicar papel de parede a" valor={t.aplicarEm} opcoes={APLICAR_EM.map((v) => ({ id: v, nome: ({ pergunta: "Sempre pergunta", inicio: "Tela inicial", bloqueio: "Tela de bloqueio", ambas: "Ambas" } as Record<AplicarEm, string>)[v] }))} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { aplicarEm: v }))} />
          </Cartao>
        </div>
      );
      case "papel/ajustes": return t.fundo === "foto" && papel ? (
        <Cartao titulo="Ajustes">
          <label className="mb-3 block text-sm text-suave">Desfoque
            <input type="range" aria-label="Desfoque" className="mt-1 w-full" min={DESFOQUE.min} max={DESFOQUE.max} value={t.desfoque} onChange={(ev) => aoMudar((b) => ajustarTema(b, { desfoque: Number(ev.target.value) }))} />
          </label>
          <label className="mb-3 block text-sm text-suave">Escurecimento
            <input type="range" aria-label="Escurecimento" className="mt-1 w-full" min={ESCURO.min} max={ESCURO.max} value={t.escuro} onChange={(ev) => aoMudar((b) => ajustarTema(b, { escuro: Number(ev.target.value) }))} />
          </label>
          <label className="mb-3 block text-sm text-suave">Saturação das cores
            <input type="range" aria-label="Saturação" className="mt-1 w-full" min={SATURACAO.min} max={SATURACAO.max} value={t.saturacao} onChange={(ev) => aoMudar((b) => ajustarTema(b, { saturacao: Number(ev.target.value) }))} />
          </label>
          <label className="mb-3 block text-sm text-suave">Temperatura (fria ← → quente)
            <input type="range" aria-label="Temperatura" className="mt-1 w-full" min={TEMPERATURA.min} max={TEMPERATURA.max} value={t.temperatura} onChange={(ev) => aoMudar((b) => ajustarTema(b, { temperatura: Number(ev.target.value) }))} />
          </label>
          <label className="block text-sm text-suave">Vinheta (bordas escuras)
            <input type="range" aria-label="Vinheta" className="mt-1 w-full" min={VINHETA.min} max={VINHETA.max} value={t.vinheta} onChange={(ev) => aoMudar((b) => ajustarTema(b, { vinheta: Number(ev.target.value) }))} />
          </label>
        </Cartao>
      ) : <p className="text-sm text-suave">Escolha um papel de parede primeiro (parte “Escolha”) para ajustar o desfoque e o escurecimento.</p>;
      case "widgets/adicionar": return (
        <div className="galeria-grade">
          <div className="galeria-aviso">
            <label className="busca-widgets"><Icone nome="pesquisa" tam={18} /><input type="search" aria-label="Widgets de pesquisa" placeholder="Widgets de pesquisa" value={buscaW} onChange={(e) => setBuscaW(e.target.value)} /></label>
            <p className="mt-2 text-sm text-suave">Veja como cada widget fica e o tamanho dele. Depois, segure o widget na tela inicial para mover, redimensionar ou mudar o estilo ({banco.widgets.length} de {MAX_WIDGETS}).</p>
            <div className="widget-estilos mt-2" role="group" aria-label="Filtrar por app">
              {["", "V-Space", ...Array.from(new Set((externos ?? []).map((x) => x.app))).sort((p, q) => p.localeCompare(q, "pt-BR"))].map((n) => <button key={n || "todos"} type="button" className="busca-chip" aria-pressed={appW === n} onClick={() => setAppW(n)}>{n || "Todos os aplicativos"}</button>)}
            </div>
          </div>
          {TIPOS_WIDGET.filter((x) => (appW === "" || appW === "V-Space") && NOMES_WIDGET[x].toLowerCase().includes(buscaW.trim().toLowerCase())).map((x) => {
            const tam = TAMANHO_WIDGET[x];
            return (
              <Cartao key={x} className={x === "clima" ? "galeria-larga" : "galeria-item"}>
                <div className="galeria-caixa" aria-label={`Prévia de ${NOMES_WIDGET[x]}, tamanho ${tam.w} por ${tam.h}`} role="img"><PreviaEscalada w={tam.w} h={tam.h}><PreviaWidget tipo={x} /></PreviaEscalada></div>
                <div className="galeria-info"><span className="min-w-0"><b className="block truncate">{NOMES_WIDGET[x]}</b><span className="text-xs text-suave">V-Space</span></span><span className="galeria-tam">{tam.w}×{tam.h}</span></div>
                {x === "agenda" && <p className="mt-2 text-xs text-suave">Pede permissão para ler seus compromissos (só leitura) na primeira vez.</p>}
                {x === "clima" ? (
                  <>
                    <p className="my-2 text-sm text-suave">Digite a cidade. O nome dela é enviado ao serviço Open-Meteo só para achar o tempo; nada mais sai do aparelho.</p>
                    <div className="flex gap-2">
                      <input value={cidade} maxLength={40} aria-label="Cidade" placeholder="Ex.: Porto Alegre" onChange={(ev) => setCidade(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") void procurarCidade(); }}
                        className="min-h-11 min-w-0 flex-1 rounded-[var(--raio-botao,0.75rem)] border border-borda bg-black/30 px-3 text-texto outline-none focus:border-neon" />
                      <Botao variante="primario" disabled={procurando || cidade.trim().length < 2} onClick={() => void procurarCidade()}>{procurando ? "Procurando…" : "Procurar"}</Botao>
                    </div>
                    {lugares && lugares.length > 0 && <ul className="mt-3 space-y-1">{lugares.map((l) => <li key={`${l.lat},${l.lon}`}><button type="button" disabled={cheio} onClick={() => { incluir("clima", { cidade: l.nome, lat: l.lat, lon: l.lon }); setLugares(null); setCidade(""); }} className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-left hover:bg-white/5 disabled:opacity-40"><Icone nome="mais" tam={18} /><span className="min-w-0 truncate">{l.nome}</span></button></li>)}</ul>}
                  </>
                ) : <div className="mt-2"><Botao variante="primario" disabled={cheio} aria-label={`Adicionar ${NOMES_WIDGET[x].toLowerCase()}`} onClick={() => incluir(x)}><Icone nome="mais" tam={16} />Adicionar</Botao></div>}
              </Cartao>
            );
          })}
          <div className="galeria-aviso">
            <h3 className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-suave">Widgets dos seus apps</h3>
            <p className="mt-1 text-sm text-suave">São os widgets de verdade dos apps instalados (Agenda, Bem-estar Digital…). O Android pode pedir permissão ao adicionar. Segure um deles na tela inicial para mover, mudar o tamanho ou remover.</p>
            {externos === null && <p className="mt-2 text-sm text-suave">Procurando…</p>}
            {externos !== null && externos.length === 0 && <p className="mt-2 text-sm text-suave">{motor.nome === "android" ? "Nenhum widget de app encontrado." : "Disponível no aparelho."}</p>}
          </div>
          {(externos ?? []).filter((x) => (appW === "" || appW === x.app) && `${x.nome} ${x.app}`.toLowerCase().includes(buscaW.trim().toLowerCase())).map((x) => (
            <Cartao key={x.provider} className="galeria-item">
              <div className="galeria-caixa" role="img" aria-label={`Prévia de ${x.nome}, tamanho ${x.w} por ${x.h}`}>
                <PreviaEscalada w={x.w} h={x.h}>{x.previa ? <img src={`data:image/png;base64,${x.previa}`} alt="" draggable={false} className="externo-previa" /> : <div className="externo"><b className="truncate">{x.nome}</b></div>}</PreviaEscalada>
              </div>
              <div className="galeria-info"><span className="min-w-0"><b className="block truncate">{x.nome}</b><span className="block truncate text-xs text-suave">{x.app}</span></span><span className="galeria-tam">{x.w}×{x.h}</span></div>
              <div className="mt-2"><Botao variante="primario" disabled={cheio || criandoExterno !== ""} aria-label={`Adicionar ${x.app}: ${x.nome}`} onClick={() => void incluirExterno(x)}><Icone nome="mais" tam={16} />{criandoExterno === x.provider ? "Adicionando…" : "Adicionar"}</Botao></div>
            </Cartao>
          ))}
        </div>
      );
      case "widgets/geral": return (
        <div className="space-y-4">
          <Cartao titulo="Unidade de temperatura"><Seletor<UnidadeTemp> rotulo="Unidade de temperatura" valor={banco.prefsWidgets.unidade} opcoes={[{ id: "c", nome: "Celsius (°C)" }, { id: "f", nome: "Fahrenheit (°F)" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, prefsWidgets: { ...b.prefsWidgets, unidade: v } }))} /></Cartao>
          <Cartao titulo="Primeiro dia da semana"><Seletor<string> rotulo="Primeiro dia da semana" valor={String(banco.prefsWidgets.semana)} opcoes={[{ id: "0", nome: "Domingo" }, { id: "1", nome: "Segunda-feira" }, { id: "6", nome: "Sábado" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, prefsWidgets: { ...b.prefsWidgets, semana: Number(v) === 1 ? 1 : Number(v) === 6 ? 6 : 0 } }))} /></Cartao>
          <Cartao titulo="Fundo atrás dos widgets de outros apps">
            <Seletor<FundoExterno> rotulo="Fundo dos widgets de outros apps" valor={banco.prefsWidgets.fundoExterno} opcoes={[{ id: "inicio", nome: "Padrão" }, { id: "nenhum", nome: "Nenhum" }, { id: "vidro", nome: "Vidro" }, { id: "cor", nome: "Cor" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, prefsWidgets: { ...b.prefsWidgets, fundoExterno: v } }))} />
            <p className="mt-3 text-sm text-suave">Vale para os widgets de verdade dos apps instalados. A temperatura vale para todos os widgets de clima; ao mudar, abra a tela inicial de novo para atualizar.</p>
          </Cartao>
        </div>
      );
      case "widgets/gerenciar": return (
        <Cartao titulo={`No seu início (${banco.widgets.length} de ${MAX_WIDGETS})`}>
          {banco.widgets.length === 0 ? <p className="text-sm text-suave">Nenhum widget ainda. Vá em “Adicionar”.</p>
            : <ul className="space-y-1">{banco.widgets.map((x) => <li key={x.id} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{x.tipo === "externo" && x.titulo ? x.titulo : NOMES_WIDGET[x.tipo]}{x.cidade ? ` · ${x.cidade}` : ""}</span><Botao aria-label={`Remover ${NOMES_WIDGET[x.tipo]}`} onClick={() => aoMudar((b) => removerWidget(b, x.id))}><Icone nome="lixeira" tam={18} />Remover</Botao></li>)}</ul>}
        </Cartao>
      );
      case "config/conta": return (
        <Cartao titulo="Vetorial ID">
          {email ? (
            <div className="space-y-3"><p className="text-sm">Você está conectado como <b className="break-all">{email}</b>. A mesma conta vale para todos os apps da Vetorial Tech.</p><Botao onClick={aoSairDaConta}>Sair da conta</Botao></div>
          ) : (
            <div className="space-y-3"><p className="text-sm text-suave">Você ainda não entrou. A conta libera a inteligência artificial (Organizar com IA).</p><Botao variante="primario" onClick={aoEntrarConta}>Entrar com o Vetorial ID</Botao></div>
          )}
        </Cartao>
      );
      case "config/gestos": return (
        <div className="space-y-4">
          <Cartao titulo="Deslizar para cima"><Seletor<Gesto> rotulo="Deslizar para cima" valor={banco.gesto} opcoes={GESTOS} aoMudar={(v) => aoMudar((b) => ({ ...b, gesto: v }))} /></Cartao>
          <Cartao titulo="Deslizar para baixo"><Seletor<AcaoGesto> rotulo="Deslizar para baixo" valor={banco.gestos.baixo} opcoes={[{ id: "nada", nome: "Nada" }, { id: "gaveta", nome: "Todos os apps" }, { id: "pesquisa", nome: "Pesquisar" }, { id: "estudio", nome: "Abrir o Estúdio" }, { id: "seguro", nome: "Espaço seguro" }, { id: "bloquear", nome: "Bloquear/liberar layout" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, gestos: { ...b.gestos, baixo: v } }))} /></Cartao>
          <Cartao titulo="Toque duplo na tela vazia"><Seletor<AcaoGesto> rotulo="Toque duplo" valor={banco.gestos.duplo} opcoes={[{ id: "nada", nome: "Nada" }, { id: "gaveta", nome: "Todos os apps" }, { id: "pesquisa", nome: "Pesquisar" }, { id: "estudio", nome: "Abrir o Estúdio" }, { id: "seguro", nome: "Espaço seguro" }, { id: "bloquear", nome: "Bloquear/liberar layout" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, gestos: { ...b.gestos, duplo: v } }))} /></Cartao>
          <Cartao titulo="Dois dedos para cima"><Seletor<AcaoGesto> rotulo="Dois dedos para cima" valor={banco.gestos.doisCima} opcoes={[{ id: "nada", nome: "Nada" }, { id: "gaveta", nome: "Todos os apps" }, { id: "pesquisa", nome: "Pesquisar" }, { id: "estudio", nome: "Abrir o Estúdio" }, { id: "seguro", nome: "Espaço seguro" }, { id: "bloquear", nome: "Bloquear/liberar layout" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, gestos: { ...b.gestos, doisCima: v } }))} /></Cartao>
          <Cartao titulo="Dois dedos para baixo"><Seletor<AcaoGesto> rotulo="Dois dedos para baixo" valor={banco.gestos.doisBaixo} opcoes={[{ id: "nada", nome: "Nada" }, { id: "gaveta", nome: "Todos os apps" }, { id: "pesquisa", nome: "Pesquisar" }, { id: "estudio", nome: "Abrir o Estúdio" }, { id: "seguro", nome: "Espaço seguro" }, { id: "bloquear", nome: "Bloquear/liberar layout" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, gestos: { ...b.gestos, doisBaixo: v } }))} /></Cartao>
          <Cartao><Linha titulo="Bloquear layout" texto="Impede tirar, mover ou agrupar apps da tela inicial sem querer."><Interruptor rotulo="Bloquear layout" ligado={banco.bloqueado} aoMudar={(v) => aoMudar((b) => ({ ...b, bloqueado: v }))} /></Linha></Cartao>
          <p className="text-sm text-suave">Gestos pelas bordas da tela, apertar o aparelho e abrir a barra de notificações precisam de permissões especiais do Android e não estão disponíveis.</p>
        </div>
      );
      case "config/geral": return (
        <div className="space-y-4">
          <Cartao><Linha titulo="Vibrar ao segurar" texto="Uma vibração curta quando o aperto longo abre um menu."><Interruptor rotulo="Vibrar ao segurar" ligado={banco.vibrar} aoMudar={(v) => aoMudar((b) => ({ ...b, vibrar: v }))} /></Linha></Cartao>
          <Cartao><Linha titulo="Relógio" texto="Hora e data no alto da tela inicial."><Interruptor rotulo="Relógio da tela inicial" ligado={banco.relogio} aoMudar={(v) => aoMudar((b) => ({ ...b, relogio: v }))} /></Linha></Cartao>
          <Cartao><Linha titulo="Selos de notificação" texto="Número de notificações nos ícones."><Interruptor rotulo="Selos nos ícones" ligado={t.selos} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { selos: v }))} /></Linha></Cartao>
        </div>
      );
      case "config/menu": return (
        <Cartao titulo="Menu de segurar na tela inicial">
          <p className="mb-3 text-sm text-suave">Escolha o que aparece quando você segura um espaço vazio da tela inicial.</p>
          {ITENS_MENU.map((id) => <Linha key={id} titulo={NOMES_MENU[id]}><Interruptor rotulo={NOMES_MENU[id]} ligado={!banco.menuOculto.includes(id)} aoMudar={(v) => aoMudar((b) => ({ ...b, menuOculto: v ? b.menuOculto.filter((x) => x !== id) : [...b.menuOculto, id] }))} /></Linha>)}
        </Cartao>
      );
      case "config/privacidade": return (
        <div className="space-y-4">
          <Cartao titulo="O que fica no aparelho">
            <p className="text-sm text-suave">Seu layout, tema, papel de parede, ícones e temas guardados ficam só neste aparelho. Nada disso é enviado a ninguém, a não ser que você use a conta para guardar o backup.</p>
          </Cartao>
          <Cartao titulo="Permissões que o V-Space pede">
            <p className="text-sm text-suave">Cada uma é pedida só quando você usa a função: lista de apps, acesso às notificações (selos e música), contatos (busca), calendário (widget), papel de parede do Android e confirmação do aparelho (Espaço seguro). Você pode tirar qualquer uma nas configurações do Android.</p>
          </Cartao>
          <Botao onClick={aoTermos}>Ler os termos de uso</Botao>
        </div>
      );
      case "config/seguro": return (
        <div className="space-y-4">
          <Cartao titulo="Espaço seguro">
            <p className="text-sm text-suave">Uma tela só com os apps que você escolher (banco, governo). Nela o V-Space não mostra widgets, números de notificação nem música. Abre com o desbloqueio do aparelho (digital, PIN ou padrão) e fecha sozinha quando você sai do V-Space.</p>
            <div className="mt-3"><Botao variante="primario" onClick={aoAbrirSeguro}><Icone nome="escudo" tam={18} />Abrir o Espaço seguro</Botao></div>
            <p className="mt-3 text-sm text-suave">Atalho: deslize com dois dedos para baixo na tela inicial.</p>
          </Cartao>
          <Cartao titulo={`Apps do Espaço seguro (${banco.seguro.length})`}>
            <ul className="space-y-1">
              {[...apps].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((a) => (
                <li key={a.pacote} className="flex min-h-11 items-center justify-between gap-3"><span className="min-w-0 truncate">{a.nome}</span>
                  <Interruptor rotulo={`${a.nome} no Espaço seguro`} ligado={banco.seguro.includes(a.pacote)} aoMudar={(v) => aoMudar((b) => ({ ...b, seguro: v ? [...b.seguro.filter((x) => x !== a.pacote), a.pacote].slice(0, 60) : b.seguro.filter((x) => x !== a.pacote) }))} /></li>
              ))}
            </ul>
          </Cartao>
        </div>
      );
      case "config/atalhos": return (
        <div className="space-y-4">
          <Cartao titulo="Faixa de atalhos">
            <Linha titulo="Mostrar na tela inicial" texto="Bateria, Wi-Fi, rede móvel, temperatura (do widget de clima) e volume. Cada um abre a tela certa do aparelho."><Interruptor rotulo="Mostrar a faixa de atalhos" ligado={banco.faixa} aoMudar={(v) => aoMudar((b) => ({ ...b, faixa: v }))} /></Linha>
          </Cartao>
          <Cartao titulo="Música tocando">
            <Linha titulo="Mostrar o player" texto="Quando algo toca (Deezer, YouTube Music, Spotify…), aparece entre os widgets e os favoritos, com voltar, pausar e avançar."><Interruptor rotulo="Mostrar o player de música" ligado={banco.musica} aoMudar={(v) => aoMudar((b) => ({ ...b, musica: v }))} /></Linha>
            {musicaOk === false && (
              <div className="mt-3 space-y-2">
                <Aviso>Para saber o que está tocando, o Android pede que você libere o V-Space em “Acesso às notificações”. O V-Space só vê o título, o artista e os botões do player e conta as notificações de cada app (o selo no ícone); não lê nem guarda o texto, e nada sai do aparelho.</Aviso>
                <Botao variante="primario" onClick={() => void motor.pedirMusica()}><Icone nome="escudo" tam={18} />Liberar o acesso</Botao>
              </div>
            )}
            {musicaOk === true && <p className="mt-2 text-sm text-suave">Acesso liberado. O player aparece sozinho quando algo estiver tocando.</p>}
          </Cartao>
        </div>
      );
      case "config/backup": return (
        <div className="space-y-4">
          <Cartao titulo="Backup do layout e do tema">
            <p className="mb-3 text-sm text-suave">Guarda a tela inicial, o dock, as pastas, os widgets e o tema num arquivo. Você escolhe onde salvar. O papel de parede não entra no backup.</p>
            <div className="flex flex-wrap gap-3"><Botao variante="primario" onClick={() => void salvar()}><Icone nome="backup" tam={18} />Salvar backup</Botao><Botao onClick={() => void restaurar()}><Icone nome="restaurar" tam={18} />Restaurar backup</Botao></div>
          </Cartao>
          <Cartao titulo="Recomeçar">
            {confirmaZero ? (
              <div className="space-y-3"><Aviso>Isso refaz a tela inicial do zero (o tema continua). Seus apps não são apagados.</Aviso><div className="flex gap-3"><Botao className="flex-1" onClick={() => setConfirmaZero(false)}>Cancelar</Botao><Botao variante="perigo" className="flex-1" onClick={() => { aoRecomecar(); setConfirmaZero(false); aviso("Tela inicial refeita."); }}>Refazer</Botao></div></div>
            ) : <Botao variante="perigo" onClick={() => setConfirmaZero(true)}>Refazer a tela inicial</Botao>}
          </Cartao>
        </div>
      );
      case "config/padrao": return (
        <Cartao titulo="Launcher padrão">
          <p className="mb-3 text-sm text-suave">{padrao === null ? "Não consegui conferir agora." : padrao ? "O V-Space é o launcher padrão deste celular." : "O V-Space ainda não é o launcher padrão."}</p>
          <div className="flex flex-wrap gap-3">
            {padrao === false && <Botao variante="primario" onClick={() => void motor.pedirPadrao()}>Tornar padrão</Botao>}
            <Botao onClick={() => void motor.abrirAjustesInicio()}>Voltar ao launcher anterior</Botao>
          </div>
          <p className="mt-3 text-xs text-suave">Seu layout fica guardado: ao voltar para o V-Space, está tudo como você deixou.</p>
        </Cartao>
      );
      case "config/sobre": return (
        <div className="space-y-4">
          <Cartao titulo="V-Space"><p className="text-sm text-suave">O launcher da suíte Vetorial. Sua tela inicial, do seu jeito. Nesta fase está em testes (beta): conte o que achou ou o que deu errado, isso nos ajuda a melhorar. Versão {import.meta.env.VITE_BUILD ? `1.${String(import.meta.env.VITE_BUILD)}` : "de desenvolvimento"}.</p></Cartao>
          <div className="flex flex-col gap-2"><Botao onClick={() => void aoProcurar()}>Procurar atualização</Botao><Botao onClick={aoTour}>Rever a apresentação</Botao><Botao onClick={aoTermos}>Termos de uso</Botao><Botao onClick={() => setFeedback(true)}>Enviar feedback</Botao><Botao onClick={() => setFeedback(true)}>Reportar um erro</Botao></div>
          {feedback && <FeedbackDoApp aoFechar={() => setFeedback(false)} />}
        </div>
      );
      default: return null;
    }
  })();

  return (
    <div className="editor" role="dialog" aria-modal="true" aria-label="Estúdio">
      <header className="editor-cab">
        <h2 className="min-w-0 truncate text-lg font-extrabold">Estúdio</h2>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-11 flex-none place-items-center rounded-full text-suave hover:bg-white/5"><Icone nome="fechar" /></button>
      </header>
      <div className="editor-topo">
        <div role="tablist" aria-label="Seções do Estúdio" aria-orientation="vertical" className="editor-col">
          {SECOES.map((s) => <button key={s.id} role="tab" type="button" aria-selected={secao === s.id} onClick={() => ir(s.id)} className="editor-item"><span className="editor-icone"><Icone nome={s.icone} tam={26} /></span><span>{s.nome}</span></button>)}
        </div>
        <Previa banco={banco} porPacote={porPacote} papel={papel} aoVoltar={aoFechar} />
        <div role="tablist" aria-label={`Partes de ${def.nome}`} aria-orientation="vertical" className="editor-col">
          {def.partes.map((p) => <button key={p.id} role="tab" type="button" aria-selected={parte === p.id} onClick={() => { setParte(p.id); setErro(""); }} className="editor-item"><span className="editor-icone"><Icone nome={p.icone} tam={26} /></span><span>{p.nome}</span></button>)}
        </div>
      </div>
      <section className="editor-painel" aria-label={`${def.nome}: ${nomeDaParte}`}>
        <div className="mx-auto w-full max-w-xl">
        <p className="text-sm text-suave">{def.nome}</p>
        <h3 className="mb-3 text-2xl font-extrabold">{nomeDaParte}</h3>
        {erro && <div className="mb-3"><Aviso tom="erro">{erro}</Aviso></div>}
        <div className="space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{painel}</div>
        </div>
      </section>
      {editCat && <NovaCategoria inicial={editCat === "nova" ? undefined : editCat} aoFechar={() => setEditCat(null)}
        aoSalvar={({ nome, icone, cor, conteudo }) => aoMudar((b) => (editCat === "nova" ? criarCategoria(b, nome, icone, { cor, conteudo }).banco : editarCategoria(b, editCat.id, { nome, icone, cor: cor ?? null, conteudo })))} />}
    </div>
  );
}

function LinhaIcone({ app, aviso }: { app: AppInfo; aviso: (m: string) => void }) {
  const proprio = useIconeApp(app.pacote);
  const trocar = async () => {
    const u = await escolherIcone();
    if (!u) return;
    aviso(definirIconeApp(app.pacote, u) ? `Ícone de ${app.nome} trocado.` : "Não há espaço para guardar esse ícone.");
  };
  return (
    <li className="flex min-h-12 items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3"><Glifo app={app} /><span className="min-w-0 truncate">{app.nome}</span></span>
      <span className="flex shrink-0 gap-2">
        <Botao onClick={() => void trocar()} aria-label={`Trocar ícone de ${app.nome}`}>Trocar</Botao>
        {proprio && <Botao onClick={() => { definirIconeApp(app.pacote, null); aviso(`Ícone de ${app.nome} restaurado.`); }} aria-label={`Restaurar ícone de ${app.nome}`}>Original</Botao>}
      </span>
    </li>
  );
}
