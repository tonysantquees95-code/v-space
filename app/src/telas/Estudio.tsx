import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  adicionarWidget, ajustarTema, CANTOS, COLUNAS, DESFOQUE, ESCURO, escolherTema, exportar, importar, LINHAS, MAX_WIDGETS, TAMANHO_WIDGET, mostrar, mudarGrade, NOMES_DOS_TEMAS, NOMES_WIDGET, ordenar,
  reconciliar, removerWidget, TAMANHO_ICONE, TEMAS, TIPOS_WIDGET,
  MAX_CATEGORIAS, MAX_FAVORITOS, CATEGORIA_RESERVA, type Categoria, type ModoInicio,
  type AppInfo, type Banco, type EstiloBotao, type EstiloDock, type EstiloGaveta, type EstiloPasta, type Forma, type Fundo, type Gesto, type PacoteIcones, type TipoWidget,
} from "../dados.ts";
import { CENAS, aplicarCena } from "../cenas";
import { fundoCss } from "../tema";
import { motor, type ExternoInfo } from "../motor";
import { Icone, type NomeIcone } from "../icones";
import { apagarPapel, desenharPronto, escolherFoto, guardarPapel, PRONTOS } from "../papel";
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

const SECOES: DefSecao[] = [
  { id: "temas", nome: "Temas", icone: "tema", partes: [{ id: "escolha", nome: "Escolha", icone: "ok" }, { id: "cenas", nome: "Cenas", icone: "cena" }, { id: "cores", nome: "Cores", icone: "paleta" }] },
  { id: "inicio", nome: "Início", icone: "tela", partes: [{ id: "grade", nome: "Disposição", icone: "grade" }, { id: "icones", nome: "Ícones", icone: "forma" }, { id: "superficie", nome: "Superfície", icone: "superficie" }, { id: "dock", nome: "Dock", icone: "dock" }, { id: "pastas", nome: "Pastas", icone: "pasta" }] },
  { id: "categorias", nome: "Categorias", icone: "pasta", partes: [{ id: "modo", nome: "Tela inicial", icone: "tela" }, { id: "lista", nome: "Suas categorias", icone: "lista" }] },
  { id: "apps", nome: "Aplicativos", icone: "gaveta", partes: [{ id: "gaveta", nome: "Disposição", icone: "gaveta" }, { id: "ocultos", nome: "Ocultos", icone: "ocultar" }] },
  { id: "papel", nome: "Papel de parede", icone: "papel", partes: [{ id: "escolha", nome: "Escolha", icone: "papel" }, { id: "ajustes", nome: "Ajustes", icone: "ajustes" }] },
  { id: "widgets", nome: "Widgets", icone: "widgets", partes: [{ id: "adicionar", nome: "Adicionar", icone: "mais" }, { id: "gerenciar", nome: "Gerenciar", icone: "lista" }] },
  { id: "config", nome: "Configurações", icone: "engrenagem", partes: [{ id: "conta", nome: "Conta", icone: "social" }, { id: "gestos", nome: "Gestos", icone: "gesto" }, { id: "atalhos", nome: "Atalhos", icone: "nota" }, { id: "backup", nome: "Backup", icone: "backup" }, { id: "padrao", nome: "Launcher", icone: "escudo" }, { id: "sobre", nome: "Sobre", icone: "info" }] },
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
  email: string; aoEntrarConta: () => void; aoSairDaConta: () => void; aoOrganizar: () => void; aoProcurar: () => Promise<void>; abaInicial: AbaEstudio; papel: string | null; aoPapel: (p: string | null) => void;
}

/** O Estúdio: a tela inicial em miniatura no alto, as seções nas laterais e as opções embaixo. */
export function Estudio({ banco, apps, aoMudar, aoFechar, aviso, aoRecomecar, aoTour, aoTermos, abaInicial, papel, aoPapel, aoProcurar, aoOrganizar, email, aoEntrarConta, aoSairDaConta }: Props) {
  const [editCat, setEditCat] = useState<Categoria | "nova" | null>(null);
  const [entrada] = useState<[Secao, string]>(() => { const e = ENTRADA[abaInicial]; if (e) return e; const [s, p] = abaInicial.split("/"); const sec = SECOES.find((x) => x.id === s); return sec && sec.partes.some((x) => x.id === p) ? [sec.id, p!] : ["temas", "escolha"]; });
  const [secao, setSecao] = useState<Secao>(entrada[0]);
  const [parte, setParte] = useState<string>(entrada[1]);
  const [padrao, setPadrao] = useState<boolean | null>(null);
  const [confirmaZero, setConfirmaZero] = useState(false);
  const [erro, setErro] = useState("");
  const [cidade, setCidade] = useState("");
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
          <p className="text-sm text-suave">Um toque muda o tema, o papel de parede e o estilo dos ícones de uma vez. Dá para ajustar depois.</p>
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
      case "temas/cores": return (
        <div className="space-y-4">
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
            <Seletor<ModoInicio> rotulo="Tela inicial" valor={banco.modo} opcoes={[{ id: "categorias", nome: "Categorias" }, { id: "grade", nome: "Grade de apps" }]} aoMudar={(v) => aoMudar((b) => ({ ...b, modo: v }))} />
            <p className="mt-2 text-sm text-suave">{banco.modo === "categorias" ? "Só widgets e favoritos na tela; os outros apps ficam nas categorias, no trilho da lateral." : "Os apps ficam espalhados em páginas, com dock embaixo."}</p>
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
      case "inicio/superficie": return (
        <div className="space-y-4">
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
          <p className="text-sm text-suave">Para criar uma pasta, segure um espaço vazio da tela inicial e toque em Criar pasta.</p>
        </div>
      );
      case "apps/gaveta": return <Cartao titulo="Estilo da gaveta"><Seletor<EstiloGaveta> rotulo="Estilo da gaveta" valor={t.gaveta} opcoes={[{ id: "lista", nome: "Lista com letras" }, { id: "grade", nome: "Grade" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { gaveta: v }))} /></Cartao>;
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
            {t.fundo === "foto" && <Botao onClick={semPapel}>Remover papel</Botao>}
          </div>
          <Cartao titulo="Papéis da Vetorial">
            <div className="grid grid-cols-3 gap-2">
              {PRONTOS.map((p) => <button key={p.id} type="button" aria-label={`Papel ${p.nome}`} className="papel-pronto" style={{ background: `linear-gradient(160deg, ${p.cores[1]}99, ${p.cores[0]} 55%, ${p.cores[2]}88)` }} onClick={() => { if (usarPapel(desenharPronto(p))) aoMudar((b) => ajustarTema(b, { fundo: "foto" })); }}><span>{p.nome}</span></button>)}
            </div>
          </Cartao>
        </div>
      );
      case "papel/ajustes": return t.fundo === "foto" && papel ? (
        <Cartao titulo="Ajustes">
          <label className="mb-3 block text-sm text-suave">Desfoque
            <input type="range" aria-label="Desfoque" className="mt-1 w-full" min={DESFOQUE.min} max={DESFOQUE.max} value={t.desfoque} onChange={(ev) => aoMudar((b) => ajustarTema(b, { desfoque: Number(ev.target.value) }))} />
          </label>
          <label className="block text-sm text-suave">Escurecimento
            <input type="range" aria-label="Escurecimento" className="mt-1 w-full" min={ESCURO.min} max={ESCURO.max} value={t.escuro} onChange={(ev) => aoMudar((b) => ajustarTema(b, { escuro: Number(ev.target.value) }))} />
          </label>
        </Cartao>
      ) : <p className="text-sm text-suave">Escolha um papel de parede primeiro (parte “Escolha”) para ajustar o desfoque e o escurecimento.</p>;
      case "widgets/adicionar": return (
        <div className="galeria-grade">
          <p className="galeria-aviso text-sm text-suave">Veja como cada widget fica e o tamanho dele antes de colocar. Depois, segure o widget na tela inicial para mover, redimensionar ou mudar o estilo ({banco.widgets.length} de {MAX_WIDGETS}).</p>
          {TIPOS_WIDGET.map((x) => {
            const tam = TAMANHO_WIDGET[x];
            return (
              <Cartao key={x} titulo={`${NOMES_WIDGET[x]} · ${tam.w}×${tam.h}`} className={x === "clima" ? "galeria-larga" : "galeria-item"}>
                <div className="galeria-caixa" aria-label={`Prévia de ${NOMES_WIDGET[x]}, tamanho ${tam.w} por ${tam.h}`} role="img"><PreviaEscalada w={tam.w} h={tam.h}><PreviaWidget tipo={x} /></PreviaEscalada></div>
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
          {(externos ?? []).map((x) => (
            <Cartao key={x.provider} titulo={`${x.app} · ${x.w}×${x.h}`} className="galeria-item">
              <div className="galeria-caixa" role="img" aria-label={`Prévia de ${x.nome}, tamanho ${x.w} por ${x.h}`}>
                <PreviaEscalada w={x.w} h={x.h}>{x.previa ? <img src={`data:image/png;base64,${x.previa}`} alt="" draggable={false} className="externo-previa" /> : <div className="externo"><b className="truncate">{x.nome}</b></div>}</PreviaEscalada>
              </div>
              <p className="mt-1 truncate text-xs text-suave">{x.nome}</p>
              <div className="mt-2"><Botao variante="primario" disabled={cheio || criandoExterno !== ""} aria-label={`Adicionar ${x.app}: ${x.nome}`} onClick={() => void incluirExterno(x)}><Icone nome="mais" tam={16} />{criandoExterno === x.provider ? "Adicionando…" : "Adicionar"}</Botao></div>
            </Cartao>
          ))}
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
          <Cartao titulo="Deslizar para cima na tela inicial"><Seletor<Gesto> rotulo="Deslizar para cima" valor={banco.gesto} opcoes={GESTOS} aoMudar={(v) => aoMudar((b) => ({ ...b, gesto: v }))} /></Cartao>
          <Cartao><Linha titulo="Bloquear layout" texto="Impede tirar, mover ou agrupar apps da tela inicial sem querer."><Interruptor rotulo="Bloquear layout" ligado={banco.bloqueado} aoMudar={(v) => aoMudar((b) => ({ ...b, bloqueado: v }))} /></Linha></Cartao>
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
                <Aviso>Para saber o que está tocando, o Android pede que você libere o V-Space em “Acesso às notificações”. O V-Space só vê o título, o artista e os botões do player; não lê nem guarda suas notificações, e nada sai do aparelho.</Aviso>
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
          <Cartao titulo="V-Space"><p className="text-sm text-suave">O launcher da suíte Vetorial. Sua tela inicial, do seu jeito. Nesta fase está em testes (beta). Versão {import.meta.env.VITE_BUILD ? `1.${String(import.meta.env.VITE_BUILD)}` : "de desenvolvimento"}.</p></Cartao>
          <div className="flex flex-col gap-2"><Botao onClick={() => void aoProcurar()}>Procurar atualização</Botao><Botao onClick={aoTour}>Rever a apresentação</Botao><Botao onClick={aoTermos}>Termos de uso</Botao></div>
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
