import { useCallback, useEffect, useState } from "react";
import type { Widget } from "../dados.ts";
import { motor } from "../motor";
import { angulosDoRelogio, buscarClima, descreverTempo, horaDoEvento, type Bateria, type Clima, type Evento } from "../widgets";

function useAgora(ms = 15_000): Date {
  const [d, setD] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setD(new Date()), ms); return () => window.clearInterval(t); }, [ms]);
  return d;
}

function RelogioDigital() {
  const d = useAgora();
  return (
    <div className="widget-corpo">
      <div className="widget-grande num">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="widget-leve">{d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
    </div>
  );
}

function RelogioAnalogico() {
  const d = useAgora();
  const { hora, minuto } = angulosDoRelogio(d);
  return (
    <div className="widget-corpo widget-centro">
      <svg viewBox="0 0 100 100" width="88" height="88" role="img" aria-label={`Relógio: ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}>
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
  const t = descreverTempo(c.codigo, c.dia);
  return (
    <div className="widget-corpo">
      <div className="widget-linha"><span className="widget-simbolo" aria-hidden>{t.simbolo}</span><span className="widget-grande num">{c.temp}°</span></div>
      <div className="widget-leve">{w.cidade} · {t.texto}</div>
      <div className="widget-leve">máx {c.max}° · mín {c.min}° · vento {c.vento} km/h</div>
    </div>
  );
}

function BateriaWidget() {
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
  if (!lista.length) return <div className="widget-corpo"><div className="widget-titulo">Agenda</div><div className="widget-leve">Nada marcado para hoje e amanhã.</div></div>;
  return (
    <div className="widget-corpo">
      <div className="widget-titulo">Agenda</div>
      <ul className="widget-lista">{lista.slice(0, 3).map((e, i) => <li key={`${e.inicio}-${i}`}><span className="widget-hora num">{horaDoEvento(e)}</span><span className="widget-evento">{e.titulo}</span></li>)}</ul>
    </div>
  );
}

const CORPO = (w: Widget) => {
  switch (w.tipo) {
    case "relogio-digital": return <RelogioDigital />;
    case "relogio-analogico": return <RelogioAnalogico />;
    case "clima": return <ClimaWidget w={w} />;
    case "bateria": return <BateriaWidget />;
    case "agenda": return <AgendaWidget />;
  }
};

/** Faixa de widgets no alto da tela inicial: deslize para o lado quando houver mais de um. */
export function FaixaWidgets({ widgets }: { widgets: Widget[] }) {
  if (!widgets.length) return null;
  return (
    <section className="widgets" aria-label="Widgets">
      {widgets.map((w) => <article key={w.id} className="widget" data-tipo={w.tipo}>{CORPO(w)}</article>)}
    </section>
  );
}
