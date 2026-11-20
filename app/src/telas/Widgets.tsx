import { useCallback, useEffect, useRef, useState } from "react";
import { ajustarWidget, alturaDosWidgets, editarWidget, COLUNAS_WIDGET, estiloDoWidget, ESTILOS_WIDGET, moverWidget, NOMES_ESTILO_WIDGET, NOMES_WIDGET, type EstiloWidget, type Retangulo, type TipoWidget, type Widget } from "../dados.ts";
import { Icone } from "../icones";
import { CorpoExtra, CorpoVivo, EXEMPLO, definirLugar } from "./WidgetsExtra";
import { ExternoCorpo } from "./Externos";
import { usePressaoLonga } from "../ui";
import { motor } from "../motor";
import { angulosDoRelogio, buscarClima, descreverTempo, diasAte, fraseDoDia, gradeDoMes, horaDoEvento, minutosSegundos, type Bateria, type Clima, type Evento } from "../widgets";
import { letrasDaSemana } from "../widgets";

function useAgora(ms = 15_000): Date {
  const [d, setD] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setD(new Date()), ms); return () => window.clearInterval(t); }, [ms]);
  return d;
}

export function RelogioDigital() {
  const d = useAgora();
  return (
    <div className="widget-corpo">
      <div className="widget-grande num">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="widget-leve">{d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
    </div>
  );
}

export function RelogioAnalogico() {
  const d = useAgora();
  const { hora, minuto } = angulosDoRelogio(d);
  return (
    <div className="widget-corpo widget-centro">
      <svg viewBox="0 0 100 100" className="widget-relogio" role="img" aria-label={`Relógio: ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1="50" y1="9" x2="50" y2={i % 3 === 0 ? "17" : "13"} stroke="currentColor" strokeOpacity={i % 3 === 0 ? 0.9 : 0.45} strokeWidth={i % 3 === 0 ? 3 : 2} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />)}
        <line x1="50" y1="50" x2="50" y2="29" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${hora} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="17" stroke="var(--color-neon)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${minuto} 50 50)`} />
        <circle cx="50" cy="50" r="3.5" fill="var(--color-neon)" />
      </svg>
    </div>
  );
}

function ClimaWidget({ w }: { w: Widget }) {
  const [c, setC] = useState<Clima | null>(null);
  const [erro, setErro] = useState(false);
  const carregar = useCallback(() => {
    if (w.lat === undefined || w.lon === undefined) return;
    setErro(false);
    void buscarClima(w.lat, w.lon).then(setC).catch(() => setErro(true));
  }, [w.lat, w.lon]);
  useEffect(() => { carregar(); }, [carregar]);
  if (!c) return <div className="widget-corpo"><div className="widget-leve">{erro ? "Sem clima agora." : "Carregando o clima…"}</div>{erro && <button type="button" className="widget-link" onClick={carregar}>Tentar de novo</button>}</div>;
  return <ClimaVisual c={c} cidade={w.cidade ?? ""} />;
}
export function ClimaVisual({ c, cidade }: { c: Clima; cidade: string }) {
  const t = descreverTempo(c.codigo, c.dia);
  return (
    <div className="widget-corpo">
      <div className="widget-linha"><span className="widget-simbolo" aria-hidden>{t.simbolo}</span><span className="widget-grande num">{c.temp}°</span></div>
      <div className="widget-leve">{cidade} · {t.texto}</div>
      <div className="widget-leve">máx {c.max}° · mín {c.min}° · vento {c.vento} km/h</div>
    </div>
  );
}

export function BateriaWidget() {
  const [b, setB] = useState<Bateria | null>(null);
  useEffect(() => {
    let vivo = true;
    const ler = () => { void motor.bateria().then((x) => { if (vivo) setB(x); }); };
    ler();
    const t = window.setInterval(ler, 60_000);
    return () => { vivo = false; window.clearInterval(t); };
  }, []);
  if (!b) return <div className="widget-corpo"><div className="widget-leve">Bateria indisponível.</div></div>;
  return (
    <div className="widget-corpo">
      <div className="widget-grande num">{b.nivel}%</div>
      <div className="widget-barra" role="progressbar" aria-label="Carga da bateria" aria-valuenow={b.nivel} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${b.nivel}%` }} data-baixa={b.nivel <= 20} /></div>
      <div className="widget-leve">{b.carregando ? "Carregando" : b.nivel <= 20 ? "Bateria baixa" : "Na bateria"}</div>
    </div>
  );
}

export function AgendaPermissao() {
  return <button type="button" className="widget-link" onClick={() => void motor.pedirAgenda().then(() => window.dispatchEvent(new Event("vspace-agenda")))}>Permitir agenda</button>;
}
function AgendaWidget() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [lista, setLista] = useState<Evento[]>([]);
  const ler = useCallback(() => { void motor.eventos().then(setLista); }, []);
  useEffect(() => { void motor.agendaPermitida().then((p) => { setOk(p); if (p) ler(); }); }, [ler]);
  useEffect(() => { if (!ok) return; const t = window.setInterval(ler, 5 * 60_000); return () => window.clearInterval(t); }, [ok, ler]);
  if (ok === null) return <div className="widget-corpo"><div className="widget-leve">Carregando…</div></div>;
  if (!ok) {
    return (
      <div className="widget-corpo">
        <div className="widget-leve">Para mostrar seus próximos compromissos, o V-Space precisa ler a sua agenda. Ele só lê, nunca altera, e nada sai do aparelho.</div>
        <button type="button" className="widget-link" onClick={() => void motor.pedirAgenda().then((p) => { setOk(p); if (p) ler(); })}>Permitir agenda</button>
      </div>
    );
  }
  return <AgendaVisual lista={lista} />;
}
export function AgendaVisual({ lista }: { lista: Evento[] }) {
  if (!lista.length) return <div className="widget-corpo"><div className="widget-titulo">Agenda</div><div className="widget-leve">Nada marcado para hoje e amanhã.</div></div>;
  return (
    <div className="widget-corpo">
      <div className="widget-titulo">Agenda</div>
      <ul className="widget-lista">{lista.slice(0, 4).map((e, i) => <li key={`${e.inicio}-${i}`}><span className="widget-hora num">{horaDoEvento(e)}</span><span className="widget-evento">{e.titulo}</span></li>)}</ul>
    </div>
  );
}

export const CORPO = (w: Widget) => {
  switch (w.tipo) {
    case "relogio-digital": return <RelogioDigital />;
    case "relogio-analogico": return <RelogioAnalogico />;
    case "clima": return <ClimaWidget w={w} />;
    case "bateria": return <BateriaWidget />;
    case "agenda": return <AgendaWidget />;
    case "calendario": return <CalendarioWidget />;
    case "notas": return <NotasVisual texto={w.texto} />;
    case "contagem": return <ContagemVisual titulo={w.titulo} data={w.data} />;
    case "frase": return <FraseWidget />;
    case "pomodoro": return <PomodoroWidget />;
    case "mundo": return <MundoWidget />;
    case "externo": return <ExternoCorpo w={w} />;
    default: return <CorpoVivo tipo={w.tipo} />;
  }
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function CalendarioWidget() {
  const d = useAgora(60_000);
  const linhas = gradeDoMes(d.getFullYear(), d.getMonth());
  return (
    <div className="widget-corpo cal">
      <div className="cal-topo"><span className="widget-titulo">{MESES[d.getMonth()]}</span><span className="widget-leve num">{d.getFullYear()}</span></div>
      <div className="cal-grade" role="grid" aria-label={`Calendário de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}>
        {letrasDaSemana().map((s, i) => <span key={`s${i}`} className="cal-sem" role="columnheader">{s}</span>)}
        {linhas.flat().map((n, i) => <span key={i} role="gridcell" className="cal-dia num" data-hoje={n === d.getDate()} data-fds={i % 7 === 0 || i % 7 === 6}>{n ?? ""}</span>)}
      </div>
    </div>
  );
}

export function NotasVisual({ texto }: { texto?: string }) {
  return (
    <div className="widget-corpo notas">
      <div className="widget-titulo">Nota</div>
      {texto ? <p className="notas-texto">{texto}</p> : <p className="widget-leve">Segure o widget e toque em Editar para escrever.</p>}
    </div>
  );
}

export function ContagemVisual({ titulo, data }: { titulo?: string; data?: string }) {
  if (!data) return <div className="widget-corpo"><div className="widget-titulo">{titulo ?? "Contagem"}</div><div className="widget-leve">Segure o widget para escolher a data.</div></div>;
  const n = diasAte(data);
  const [a, m, di] = data.split("-");
  return (
    <div className="widget-corpo contagem">
      <div className="widget-titulo truncate">{titulo ?? "Meu evento"}</div>
      <div className="widget-grande num">{n === 0 ? "Hoje" : Math.abs(n)}</div>
      <div className="widget-leve">{n === 0 ? "é o dia!" : n > 0 ? (n === 1 ? "dia restante" : "dias restantes") : (n === -1 ? "dia atrás" : "dias atrás")} · {di}/{m}/{a}</div>
    </div>
  );
}

function FraseWidget() {
  const d = useAgora(10 * 60_000);
  return (
    <div className="widget-corpo frase">
      <div className="widget-titulo">Frase do dia</div>
      <p className="frase-texto">{fraseDoDia(d)}</p>
    </div>
  );
}

const FOCO = 25 * 60, PAUSA = 5 * 60;
export function PomodoroWidget() {
  const [fase, setFase] = useState<"foco" | "pausa">("foco");
  const [resta, setResta] = useState(FOCO);
  const [fim, setFim] = useState<number | null>(null);
  useEffect(() => {
    if (fim === null) return;
    const t = window.setInterval(() => {
      const s = Math.ceil((fim - Date.now()) / 1000);
      if (s > 0) { setResta(s); return; }
      window.clearInterval(t);
      const prox = fase === "foco" ? "pausa" : "foco";
      setFase(prox); setResta(prox === "foco" ? FOCO : PAUSA); setFim(null);
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* sem vibração */ }
    }, 500);
    return () => window.clearInterval(t);
  }, [fim, fase]);
  const rodando = fim !== null;
  const total = fase === "foco" ? FOCO : PAUSA;
  const pausar = () => { setResta(Math.max(1, Math.ceil(((fim ?? Date.now()) - Date.now()) / 1000))); setFim(null); };
  const zerar = () => { setFim(null); setFase("foco"); setResta(FOCO); };
  return (
    <div className="widget-corpo pomo">
      <div className="widget-titulo">{fase === "foco" ? "Foco" : "Pausa"}</div>
      <div className="widget-grande num" role="timer" aria-label={`Faltam ${minutosSegundos(resta)}`}>{minutosSegundos(resta)}</div>
      <div className="widget-barra" aria-hidden><i style={{ width: `${Math.round(((total - resta) / total) * 100)}%` }} /></div>
      <div className="pomo-botoes">
        <button type="button" className="pomo-btn" onClick={() => (rodando ? pausar() : setFim(Date.now() + resta * 1000))}>{rodando ? "Pausar" : "Iniciar"}</button>
        <button type="button" className="pomo-btn pomo-zero" onClick={zerar} aria-label="Zerar o tempo"><Icone nome="reiniciar" tam={16} /></button>
      </div>
    </div>
  );
}

const FUSOS = [["Brasília", "America/Sao_Paulo"], ["Lisboa", "Europe/Lisbon"], ["Nova York", "America/New_York"], ["Tóquio", "Asia/Tokyo"]] as const;
export function MundoWidget() {
  const d = useAgora(15_000);
  return (
    <div className="widget-corpo mundo">
      {FUSOS.map(([nome, fuso]) => (
        <div key={fuso} className="mundo-item"><span className="widget-leve">{nome}</span><span className="num mundo-hora">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: fuso })}</span></div>
      ))}
    </div>
  );
}

/** Dados de exemplo para a galeria: mostram como o widget fica antes de ser colocado. */
const CLIMA_EXEMPLO: Clima = { temp: 24, codigo: 2, max: 28, min: 18, vento: 12, dia: true };
const AGENDA_EXEMPLO: Evento[] = [
  { titulo: "Reunião da equipe", inicio: new Date().setHours(10, 0, 0, 0), fim: 0, diaTodo: false },
  { titulo: "Almoço", inicio: new Date().setHours(12, 30, 0, 0), fim: 0, diaTodo: false },
  { titulo: "Pagar fatura", inicio: new Date().setHours(0, 0, 0, 0), fim: 0, diaTodo: true },
];
const dataDeExemplo = (dias: number): string => { const d = new Date(Date.now() + dias * 86_400_000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const TITULOS_VISTA: Record<string, string> = { tamanho: "Redimensionar", personalizar: "Personalizar", ajustes: "Ajustes", mais: "Mais", estilo: "Estilo dos widgets" };

export function PreviaWidget({ tipo, estilo = "vidro" }: { tipo: TipoWidget; estilo?: EstiloWidget }) {
  const corpo = tipo === "clima" ? <ClimaVisual c={CLIMA_EXEMPLO} cidade="Sua cidade" /> : tipo === "agenda" ? <AgendaVisual lista={AGENDA_EXEMPLO} /> : tipo === "bateria" ? <BateriaVisual nivel={76} /> : tipo === "relogio-analogico" ? <RelogioAnalogico /> : tipo === "notas" ? <NotasVisual texto="Comprar pão, ligar para o dentista, pagar a fatura." /> : tipo === "contagem" ? <ContagemVisual titulo="Viagem" data={dataDeExemplo(12)} /> : tipo === "calendario" ? <CalendarioWidget /> : tipo === "frase" ? <FraseWidget /> : tipo === "pomodoro" ? <PomodoroWidget /> : tipo === "mundo" ? <MundoWidget /> : tipo === "relogio-digital" ? <RelogioDigital /> : <CorpoExtra tipo={tipo} d={EXEMPLO} />;
  return <article className="widget widget-previa" data-estilo={estilo} inert>{corpo}</article>;
}
export function BateriaVisual({ nivel }: { nivel: number }) {
  return (
    <div className="widget-corpo">
      <div className="widget-grande num">{nivel}%</div>
      <div className="widget-barra"><i style={{ width: `${nivel}%` }} data-baixa={nivel <= 20} /></div>
      <div className="widget-leve">Na bateria</div>
    </div>
  );
}

const GAP = 8, LINHA = 64;
type Borda = "esq" | "dir" | "topo" | "base";
interface Arrasto { id: string; modo: "mover" | Borda; x0: number; y0: number; dx: number; dy: number; pw: number; ph: number; original: Widget; prop: Retangulo | null }

function Celula({ w, selecionado, bloqueado, arrasto, aoSelecionar, aoPressionar }: { w: Widget; selecionado: boolean; bloqueado: boolean; arrasto: Arrasto | null; aoSelecionar: () => void; aoPressionar: (e: React.PointerEvent, modo: "mover" | Borda) => void }) {
  const longa = usePressaoLonga(() => { if (!bloqueado) aoSelecionar(); });
  const meu = arrasto && arrasto.id === w.id ? arrasto : null;
  const r: Retangulo = meu && meu.modo !== "mover" && meu.prop ? meu.prop : w;
  const mover = meu && meu.modo === "mover" ? `translate(${meu.dx}px, ${meu.dy}px)` : undefined;
  return (
    <article className="widget" data-tipo={w.tipo} data-estilo={w.estilo} data-selecionado={selecionado} data-movendo={!!meu}
      style={{ gridColumn: `${r.x + 1} / span ${r.w}`, gridRow: `${r.y + 1} / span ${r.h}`, transform: mover }} aria-label={NOMES_WIDGET[w.tipo]}
      onPointerDown={longa.onPointerDown} onPointerMove={longa.onPointerMove} onPointerUp={longa.onPointerUp} onPointerLeave={longa.onPointerLeave} onPointerCancel={longa.onPointerCancel} onContextMenu={longa.onContextMenu}>
      {CORPO(w)}
      {selecionado && (
        <div className="widget-edicao" onPointerDown={(e) => aoPressionar(e, "mover")}>
          {(["esq", "dir", "topo", "base"] as Borda[]).map((b) => <span key={b} className="widget-alca" data-borda={b} role="button" aria-label={`Mudar o tamanho pela borda ${{ esq: "da esquerda", dir: "da direita", topo: "de cima", base: "de baixo" }[b]}`} onPointerDown={(e) => { e.stopPropagation(); aoPressionar(e, b); }}><i /></span>)}
        </div>
      )}
    </article>
  );
}

/** Área de widgets livres da tela inicial: grade de 4 colunas. Segure um widget para mover, redimensionar ou mudar o estilo. */
export function AreaWidgets({ widgets, bloqueado, aoMudar }: { widgets: Widget[]; bloqueado: boolean; aoMudar: (ws: Widget[]) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [vista, setVista] = useState<"raiz" | "tamanho" | "personalizar" | "ajustes" | "mais" | "estilo">("raiz");
  useEffect(() => { setVista("raiz"); }, [sel]);
  const [arr, setArr] = useState<Arrasto | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const atual = widgets.find((w) => w.id === sel) ?? null;
  definirLugar(widgets);
  useEffect(() => { if (sel && !widgets.some((w) => w.id === sel)) setSel(null); }, [widgets, sel]);
  useEffect(() => { if (bloqueado) setSel(null); }, [bloqueado]);
  // segurar um widget real (desenhado pelo Android) abre a edição dele
  useEffect(() => {
    const f = (e: Event) => { const id = (e as CustomEvent<number>).detail; const w = widgets.find((x) => x.tipo === "externo" && x.appId === id); if (w && !bloqueado) setSel(w.id); };
    window.addEventListener("vspace-widget-longo", f);
    return () => window.removeEventListener("vspace-widget-longo", f);
  }, [widgets, bloqueado]);
  // ao editar, traz o widget para a parte de cima da tela, longe do quadro de opções
  useEffect(() => { if (sel) window.setTimeout(() => area.current?.querySelector<HTMLElement>("[data-selecionado=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }), 60); }, [sel]);
  if (!widgets.length) return null;

  const proposta = (a: Arrasto): Retangulo | null => {
    const o = a.original; const cx = Math.round(a.dx / a.pw), cy = Math.round(a.dy / a.ph);
    if (a.modo === "mover") return { x: Math.max(0, Math.min(COLUNAS_WIDGET - o.w, o.x + cx)), y: Math.max(0, o.y + cy), w: o.w, h: o.h };
    if (a.modo === "dir") return { x: o.x, y: o.y, w: o.w + cx, h: o.h };
    if (a.modo === "base") return { x: o.x, y: o.y, w: o.w, h: o.h + cy };
    if (a.modo === "esq") return { x: o.x + cx, y: o.y, w: o.w - cx, h: o.h };
    return { x: o.x, y: o.y + cy, w: o.w, h: o.h - cy };
  };
  const iniciar = (e: React.PointerEvent, w: Widget, modo: "mover" | Borda) => {
    const el = area.current; if (!el) return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const largura = el.getBoundingClientRect().width - 36; // menos o respiro das laterais
    const a: Arrasto = { id: w.id, modo, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, pw: (largura + GAP) / COLUNAS_WIDGET, ph: LINHA + GAP, original: w, prop: null };
    setArr(a);
  };
  const mexer = (e: React.PointerEvent) => {
    if (!arr) return;
    const a = { ...arr, dx: e.clientX - arr.x0, dy: e.clientY - arr.y0 };
    const p = proposta(a);
    if (a.modo !== "mover") a.prop = p && ajustarWidget(widgets, a.id, p) ? p : arr.prop;
    setArr(a);
  };
  const soltar = () => {
    if (!arr) return;
    const p = proposta(arr);
    if (arr.modo === "mover") { if (p) aoMudar(moverWidget(widgets, arr.id, p.x, p.y)); }
    else if (arr.prop) { const r = ajustarWidget(widgets, arr.id, arr.prop); if (r) aoMudar(r); }
    setArr(null);
  };
  const fantasma = arr && arr.modo === "mover" ? (() => { const p = proposta(arr); if (!p) return null; const m = moverWidget(widgets, arr.id, p.x, p.y).find((w) => w.id === arr.id); return m ?? null; })() : null;
  const passo = (campo: "w" | "h", d: number) => { if (!atual) return; const r = ajustarWidget(widgets, atual.id, { x: atual.x, y: atual.y, w: atual.w + (campo === "w" ? d : 0), h: atual.h + (campo === "h" ? d : 0) }); if (r) aoMudar(r); };

  return (
    <>
      <div className="widgets-area" ref={area} role="region" aria-label="Widgets" style={{ gridTemplateRows: `repeat(${Math.max(1, alturaDosWidgets(widgets))}, ${LINHA}px)` }}
        onPointerMove={mexer} onPointerUp={soltar} onPointerCancel={() => setArr(null)}
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
        {widgets.map((w) => <Celula key={w.id} w={w} selecionado={w.id === sel} bloqueado={bloqueado} arrasto={arr} aoSelecionar={() => setSel(w.id)} aoPressionar={(e, m) => iniciar(e, w, m)} />)}
        {fantasma && <div className="widget-fantasma" aria-hidden style={{ gridColumn: `${fantasma.x + 1} / span ${fantasma.w}`, gridRow: `${fantasma.y + 1} / span ${fantasma.h}` }} />}
      </div>
      {atual && <div className="widget-reserva" aria-hidden />}
      {atual && (
        <div className="widget-acoes" role="dialog" aria-label={`Editar ${NOMES_WIDGET[atual.tipo]}`}>
          <div className="widget-acoes-topo">
            {vista !== "raiz" && <button type="button" className="acao-voltar" aria-label="Voltar" onClick={() => setVista("raiz")}><Icone nome="seta" tam={18} className="rotate-180" /></button>}
            <span className="min-w-0 flex-1"><strong className="block truncate">{vista === "raiz" ? (atual.titulo || NOMES_WIDGET[atual.tipo]) : TITULOS_VISTA[vista]}</strong>{vista === "raiz" && <span className="text-sm text-suave">{atual.tipo === "externo" ? "App do aparelho" : "V-Space"} · {atual.w}×{atual.h}</span>}</span>
          </div>
          {vista === "raiz" && (
            <>
              <div className="acoes-redondas">
                <button type="button" onClick={() => setVista("tamanho")}><span><Icone nome="grade" tam={20} /></span>Redimensionar</button>
                <button type="button" onClick={() => setVista("personalizar")}><span><Icone nome="paleta" tam={20} /></span>Personalizar</button>
                <button type="button" onClick={() => setVista("ajustes")}><span><Icone nome="engrenagem" tam={20} /></span>Ajustes</button>
                <button type="button" className="perigo" onClick={() => { aoMudar(widgets.filter((w) => w.id !== atual.id)); setSel(null); }}><span><Icone nome="lixeira" tam={20} /></span>Remover</button>
              </div>
              <button type="button" className="acao-linha" onClick={() => setVista("mais")}><span>Mais</span><span className="text-suave">Mover, nome, tamanho…</span><Icone nome="seta" tam={16} /></button>
              <button type="button" className="acao-linha" onClick={() => setVista("estilo")}><span>Estilo dos widgets</span><span className="text-suave">Todos de uma vez</span><Icone nome="seta" tam={16} /></button>
              <div className="widget-fim"><button type="button" className="botao-vidro-texto" onClick={() => setSel(null)}><Icone nome="ok" tam={18} />Pronto</button></div>
            </>
          )}
          {vista === "tamanho" && (
            <div className="widget-passos">
              <span className="passo" role="group" aria-label="Largura"><button type="button" aria-label="Mais estreito" disabled={atual.w <= 1} onClick={() => passo("w", -1)}><Icone nome="menos" tam={18} /></button><span>Largura {atual.w}</span><button type="button" aria-label="Mais largo" onClick={() => passo("w", 1)}><Icone nome="mais" tam={18} /></button></span>
              <span className="passo" role="group" aria-label="Altura"><button type="button" aria-label="Mais baixo" disabled={atual.h <= 1} onClick={() => passo("h", -1)}><Icone nome="menos" tam={18} /></button><span>Altura {atual.h}</span><button type="button" aria-label="Mais alto" onClick={() => passo("h", 1)}><Icone nome="mais" tam={18} /></button></span>
            </div>
          )}
          {vista === "personalizar" && (
            <>
              <p className="text-sm text-suave">Aparência deste widget</p>
              <div className="widget-estilos" role="group" aria-label="Estilo do widget">
                {ESTILOS_WIDGET.map((s) => <button key={s} type="button" className="busca-chip" aria-pressed={atual.estilo === s} onClick={() => aoMudar(estiloDoWidget(widgets, atual.id, s))}>{NOMES_ESTILO_WIDGET[s]}</button>)}
              </div>
            </>
          )}
          {vista === "ajustes" && (
            <>
              {atual.tipo === "notas" && <label className="widget-campo">Texto da nota<textarea value={atual.texto ?? ""} maxLength={300} rows={3} onChange={(e) => aoMudar(editarWidget(widgets, atual.id, { texto: e.target.value }))} /></label>}
              {atual.tipo === "contagem" && (
                <div className="widget-campos">
                  <label className="widget-campo">Nome<input type="text" value={atual.titulo ?? ""} maxLength={30} onChange={(e) => aoMudar(editarWidget(widgets, atual.id, { titulo: e.target.value }))} /></label>
                  <label className="widget-campo">Data<input type="date" value={atual.data ?? ""} onChange={(e) => aoMudar(editarWidget(widgets, atual.id, { data: e.target.value }))} /></label>
                </div>
              )}
              {atual.tipo === "externo" && <label className="widget-campo">Nome<input type="text" value={atual.titulo ?? ""} maxLength={60} onChange={(e) => aoMudar(editarWidget(widgets, atual.id, { titulo: e.target.value }))} /></label>}
              {atual.tipo !== "notas" && atual.tipo !== "contagem" && atual.tipo !== "externo" && <p className="text-sm text-suave">Este widget não tem ajustes próprios. A unidade de temperatura e o primeiro dia da semana ficam em Estúdio › Widgets › Geral.</p>}
            </>
          )}
          {vista === "mais" && (
            <div className="flex flex-col">
              <button type="button" className="acao-linha" onClick={() => { const fim = Math.max(0, ...widgets.filter((w) => w.id !== atual.id).map((w) => w.y + w.h)); const r = ajustarWidget(widgets, atual.id, { x: atual.x, y: fim, w: atual.w, h: atual.h }); if (r) aoMudar(r); setVista("raiz"); }}><span>Mover para baixo</span><Icone nome="seta" tam={16} className="rotate-90" /></button>
              <button type="button" className="acao-linha" onClick={() => { const r = ajustarWidget(widgets, atual.id, { x: atual.x, y: 0, w: atual.w, h: atual.h }); if (r) aoMudar(r); setVista("raiz"); }}><span>Mover para cima</span><Icone nome="seta" tam={16} className="-rotate-90" /></button>
              {(atual.tipo === "externo" || atual.tipo === "contagem") && <button type="button" className="acao-linha" onClick={() => setVista("ajustes")}><span>Renomear</span><Icone nome="seta" tam={16} /></button>}
            </div>
          )}
          {vista === "estilo" && (
            <>
              <p className="text-sm text-suave">Muda a aparência de todos os widgets da tela inicial.</p>
              <div className="widget-estilos" role="group" aria-label="Estilo de todos os widgets">
                {ESTILOS_WIDGET.map((s) => <button key={s} type="button" className="busca-chip" onClick={() => aoMudar(widgets.map((w) => ({ ...w, estilo: s })))}>{NOMES_ESTILO_WIDGET[s]}</button>)}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
