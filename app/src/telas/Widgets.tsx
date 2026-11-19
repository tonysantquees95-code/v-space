import { useCallback, useEffect, useRef, useState } from "react";
import { ajustarWidget, alturaDosWidgets, COLUNAS_WIDGET, estiloDoWidget, ESTILOS_WIDGET, moverWidget, NOMES_ESTILO_WIDGET, NOMES_WIDGET, type EstiloWidget, type Retangulo, type TipoWidget, type Widget } from "../dados.ts";
import { Icone } from "../icones";
import { usePressaoLonga } from "../ui";
import { motor } from "../motor";
import { angulosDoRelogio, buscarClima, descreverTempo, horaDoEvento, type Bateria, type Clima, type Evento } from "../widgets";

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
  }
};

/** Dados de exemplo para a galeria: mostram como o widget fica antes de ser colocado. */
const CLIMA_EXEMPLO: Clima = { temp: 24, codigo: 2, max: 28, min: 18, vento: 12, dia: true };
const AGENDA_EXEMPLO: Evento[] = [
  { titulo: "Reunião da equipe", inicio: new Date().setHours(10, 0, 0, 0), fim: 0, diaTodo: false },
  { titulo: "Almoço", inicio: new Date().setHours(12, 30, 0, 0), fim: 0, diaTodo: false },
  { titulo: "Pagar fatura", inicio: new Date().setHours(0, 0, 0, 0), fim: 0, diaTodo: true },
];
export function PreviaWidget({ tipo, estilo = "vidro" }: { tipo: TipoWidget; estilo?: EstiloWidget }) {
  const corpo = tipo === "clima" ? <ClimaVisual c={CLIMA_EXEMPLO} cidade="Sua cidade" /> : tipo === "agenda" ? <AgendaVisual lista={AGENDA_EXEMPLO} /> : tipo === "bateria" ? <BateriaVisual nivel={76} /> : tipo === "relogio-analogico" ? <RelogioAnalogico /> : <RelogioDigital />;
  return <article className="widget widget-previa" data-estilo={estilo}>{corpo}</article>;
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
  const [arr, setArr] = useState<Arrasto | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const atual = widgets.find((w) => w.id === sel) ?? null;
  useEffect(() => { if (sel && !widgets.some((w) => w.id === sel)) setSel(null); }, [widgets, sel]);
  useEffect(() => { if (bloqueado) setSel(null); }, [bloqueado]);
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
          <div className="widget-acoes-topo"><strong className="truncate">{NOMES_WIDGET[atual.tipo]}</strong><span className="text-sm text-suave">{atual.w}×{atual.h}</span></div>
          <div className="widget-estilos" role="group" aria-label="Estilo do widget">
            {ESTILOS_WIDGET.map((s) => <button key={s} type="button" className="busca-chip" aria-pressed={atual.estilo === s} onClick={() => aoMudar(estiloDoWidget(widgets, atual.id, s))}>{NOMES_ESTILO_WIDGET[s]}</button>)}
          </div>
          <div className="widget-passos">
            <span className="passo" role="group" aria-label="Largura"><button type="button" aria-label="Mais estreito" disabled={atual.w <= 1} onClick={() => passo("w", -1)}><Icone nome="menos" tam={18} /></button><span>Largura</span><button type="button" aria-label="Mais largo" onClick={() => passo("w", 1)}><Icone nome="mais" tam={18} /></button></span>
            <span className="passo" role="group" aria-label="Altura"><button type="button" aria-label="Mais baixo" disabled={atual.h <= 1} onClick={() => passo("h", -1)}><Icone nome="menos" tam={18} /></button><span>Altura</span><button type="button" aria-label="Mais alto" onClick={() => passo("h", 1)}><Icone nome="mais" tam={18} /></button></span>
          </div>
          <div className="widget-fim">
            <button type="button" className="botao-perigo" onClick={() => { aoMudar(widgets.filter((w) => w.id !== atual.id)); setSel(null); }}><Icone nome="lixeira" tam={18} />Remover</button>
            <button type="button" className="botao-vidro-texto" onClick={() => setSel(null)}><Icone nome="ok" tam={18} />Pronto</button>
          </div>
        </div>
      )}
    </>
  );
}
