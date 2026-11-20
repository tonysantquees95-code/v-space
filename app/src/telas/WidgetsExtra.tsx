import { useCallback, useEffect, useState } from "react";
import { Icone } from "../icones";
import { motor, type Musica, type Sistema } from "../motor";
import type { TipoWidget, Widget } from "../dados.ts";
import { buscarClima, buscarPrevisao, descreverTempo, diasDaSemana, gradeDoMes, horaDoEvento, progressoDoDia, saudacao, type Bateria, type Clima, type Evento, type Previsao } from "../widgets";
import { letrasDaSemana } from "../widgets";
import { AgendaPermissao } from "./Widgets";

/** Dados que os widgets de relógio, clima, música e agenda usam. Na galeria vêm de exemplo; na tela vêm do aparelho. */
export interface Dados {
  agora: Date; clima: Clima | null; prev: Previsao | null; semLugar: boolean; bat: Bateria | null; sis: Sistema | null;
  musica: Musica; eventos: Evento[]; agendaOk: boolean | null;
  previa?: boolean;
  cmd: (a: "pausar" | "tocar" | "proxima" | "anterior") => void; abrirApp: (p: string) => void; buscar: () => void;
}

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const DIAS_CURTOS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTOS = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const hh = (d: Date) => String(d.getHours()).padStart(2, "0");
const mm = (d: Date) => String(d.getMinutes()).padStart(2, "0");
const dataLonga = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`;
const dataCurta = (d: Date) => `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Lugar do clima: o do primeiro widget "Clima" que a pessoa colocou. */
let lugarAtual: { lat: number; lon: number } | null = null;
export function definirLugar(ws: Widget[]) { const c = ws.find((w) => w.tipo === "clima" && w.lat !== undefined && w.lon !== undefined); lugarAtual = c ? { lat: c.lat!, lon: c.lon! } : null; }

const TIPOS_CLIMA: TipoWidget[] = ["relogio-grande", "relogio-vidro", "relogio-clima", "saudacao", "tempo", "tipo-clima", "previsao", "por-hora", "orbita"];
const TIPOS_PREV: TipoWidget[] = ["previsao", "por-hora"];
const TIPOS_MUSICA: TipoWidget[] = ["musica-capa", "musica-compacto", "musica-disco", "musica-tocando", "musica-brilho"];
const TIPOS_AGENDA: TipoWidget[] = ["relogio-agenda", "relance", "semana", "proximos", "relogio-progresso", "mes-dia"];
const TIPOS_BAT: TipoWidget[] = ["relogio-editorial", "saude-bateria", "linha-status"];

function useDados(tipo: TipoWidget): Dados {
  const [agora, setAgora] = useState(() => new Date());
  const [clima, setClima] = useState<Clima | null>(null);
  const [prev, setPrev] = useState<Previsao | null>(null);
  const [bat, setBat] = useState<Bateria | null>(null);
  const [sis, setSis] = useState<Sistema | null>(null);
  const [musica, setMusica] = useState<Musica>({ tem: false });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [agendaOk, setAgendaOk] = useState<boolean | null>(null);
  const lugar = lugarAtual;
  useEffect(() => { const t = window.setInterval(() => setAgora(new Date()), 15_000); return () => window.clearInterval(t); }, []);
  useEffect(() => {
    if (!TIPOS_CLIMA.includes(tipo) || !lugar) return;
    let vivo = true;
    void buscarClima(lugar.lat, lugar.lon).then((c) => { if (vivo) setClima(c); }).catch(() => undefined);
    if (TIPOS_PREV.includes(tipo)) void buscarPrevisao(lugar.lat, lugar.lon).then((p) => { if (vivo) setPrev(p); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [tipo, lugar?.lat, lugar?.lon]);
  useEffect(() => {
    if (!TIPOS_BAT.includes(tipo)) return;
    let vivo = true;
    const ler = () => { void motor.bateria().then((b) => { if (vivo) setBat(b); }); if (tipo === "linha-status") void motor.sistema().then((s) => { if (vivo) setSis(s); }); };
    ler(); const t = window.setInterval(ler, 20_000);
    return () => { vivo = false; window.clearInterval(t); };
  }, [tipo]);
  const lerMusica = useCallback(() => { void motor.musicaPermitida().then((p) => (p ? motor.musica() : { tem: false })).then(setMusica); }, []);
  useEffect(() => {
    if (!TIPOS_MUSICA.includes(tipo)) return;
    lerMusica(); const t = window.setInterval(lerMusica, 2500);
    return () => window.clearInterval(t);
  }, [tipo, lerMusica]);
  useEffect(() => {
    if (!TIPOS_AGENDA.includes(tipo)) return;
    let vivo = true;
    const ler = () => { void motor.eventos().then((e) => { if (vivo) setEventos(e); }); };
    void motor.agendaPermitida().then((p) => { if (!vivo) return; setAgendaOk(p); if (p) ler(); });
    const t = window.setInterval(() => { if (agendaOk) ler(); }, 5 * 60_000);
    return () => { vivo = false; window.clearInterval(t); };
  }, [tipo, agendaOk]);
  return {
    agora, clima, prev, semLugar: !lugar, bat, sis, musica, eventos, agendaOk,
    cmd: (a) => { void motor.musicaComando(a).then(() => window.setTimeout(lerMusica, 250)).catch(() => undefined); },
    abrirApp: (p) => { void motor.abrir(p); },
    buscar: () => window.dispatchEvent(new Event("vspace-busca")),
  };
}

export const EXEMPLO: Dados = {
  agora: new Date(2026, 10, 19, 12, 30),
  clima: { temp: 28, codigo: 0, max: 29, min: 20, vento: 10, dia: true },
  prev: {
    horas: [{ h: 12, temp: 28, codigo: 0 }, { h: 13, temp: 29, codigo: 1 }, { h: 14, temp: 27, codigo: 2 }, { h: 15, temp: 29, codigo: 1 }, { h: 16, temp: 28, codigo: 1 }, { h: 17, temp: 27, codigo: 2 }],
    dias: [{ data: "2026-11-19", max: 29, min: 20, codigo: 0 }, { data: "2026-11-20", max: 28, min: 20, codigo: 61 }, { data: "2026-11-21", max: 29, min: 20, codigo: 1 }, { data: "2026-11-22", max: 24, min: 19, codigo: 3 }, { data: "2026-11-23", max: 27, min: 17, codigo: 0 }],
  },
  semLugar: false, bat: { nivel: 76, carregando: false }, sis: { wifi: true, movel: true, volume: 40 },
  musica: { tem: true, app: "Rádio", titulo: "Hora Dourada", artista: "Rádio Aurora", tocando: true },
  eventos: [{ titulo: "Dia da Consciência Negra", inicio: new Date(2026, 10, 20).getTime(), fim: 0, diaTodo: true }, { titulo: "Reunião de equipe", inicio: new Date(2026, 10, 19, 15).getTime(), fim: 0, diaTodo: false }],
  agendaOk: true, previa: true, cmd: () => undefined, abrirApp: () => undefined, buscar: () => undefined,
};

const Tempo = ({ d, cls = "" }: { d: Dados; cls?: string }) => <span className={`num ${cls}`}>{hh(d.agora)}:{mm(d.agora)}</span>;
const proximo = (d: Dados) => d.eventos[0];
const semLugarAviso = <div className="widget-corpo"><div className="widget-leve">Coloque o widget “Clima” para escolher a cidade; este usa a mesma.</div></div>;
const Simbolo = ({ c, tam = "1.9rem" }: { c: Clima; tam?: string }) => <span aria-hidden style={{ fontSize: tam, lineHeight: 1 }}>{descreverTempo(c.codigo, c.dia).simbolo}</span>;

function Musicas({ tipo, d }: { tipo: TipoWidget; d: Dados }) {
  const m = d.musica;
  if (!m.tem) return <div className="widget-corpo"><div className="widget-leve">Nada tocando agora. Toque algo no seu app de música{d.musica.tem === false ? "; a música precisa do acesso às notificações (Estúdio › Configurações › Atalhos)." : "."}</div></div>;
  const icone = m.capa ? <img src={m.capa} alt="" draggable={false} /> : <Icone nome="nota" tam={28} />;
  const capa = d.previa ? <span className="mus-capa" aria-hidden>{icone}</span> : <button type="button" className="mus-capa" aria-label={`Abrir ${m.app ?? "o app de música"}`} onClick={() => m.pacote && d.abrirApp(m.pacote)}>{icone}</button>;
  const B = (d.previa ? "span" : "button") as "button";
  const tocar = <B type="button" className="mus-play" aria-label={m.tocando ? "Pausar" : "Tocar"} onClick={() => d.cmd(m.tocando ? "pausar" : "tocar")}><Icone nome={m.tocando ? "pausar" : "tocar"} tam={20} /></B>;
  const ant = <B type="button" className="mus-ctl" aria-label="Faixa anterior" onClick={() => d.cmd("anterior")}><Icone nome="anterior" tam={20} /></B>;
  const prox = <B type="button" className="mus-ctl" aria-label="Próxima faixa" onClick={() => d.cmd("proxima")}><Icone nome="proxima" tam={20} /></B>;
  const nome = <div className="mus-texto"><b className="truncate">{m.titulo || "Sem título"}</b><span className="truncate widget-leve">{[m.artista, m.app].filter(Boolean).join(" · ")}</span></div>;
  if (tipo === "musica-capa") return <div className="widget-corpo mus-capa-card">{capa}<div className="mus-base">{nome}{tocar}</div></div>;
  if (tipo === "musica-compacto") return <div className="widget-corpo mus-linha">{capa}{nome}{tocar}{prox}</div>;
  if (tipo === "musica-disco") return <div className="widget-corpo mus-linha mus-disco-l"><div className="mus-disco" data-gira={!!m.tocando} aria-hidden><i /></div><div className="mus-meio">{nome}<div className="mus-botoes">{ant}{tocar}{prox}</div></div></div>;
  if (tipo === "musica-brilho") return <div className="widget-corpo mus-brilho"><div className="mus-halo" data-gira={!!m.tocando}>{capa}</div><div className="mus-botoes">{ant}{tocar}{prox}</div></div>;
  return <div className="widget-corpo mus-tocando"><div className="mus-linha">{capa}{nome}</div><div className="mus-botoes mus-grande">{ant}{tocar}{prox}</div></div>;
}

export function CorpoExtra({ tipo, d }: { tipo: TipoWidget; d: Dados }) {
  const { agora, clima: c } = d;
  const dia = DIAS[agora.getDay()]!;
  const ev = proximo(d);
  if (TIPOS_MUSICA.includes(tipo)) return <Musicas tipo={tipo} d={d} />;
  if (TIPOS_CLIMA.includes(tipo) && !["relogio-grande", "relogio-vidro", "relogio-clima", "saudacao"].includes(tipo)) {
    if (d.semLugar) return semLugarAviso;
    if (!c) return <div className="widget-corpo"><div className="widget-leve">Carregando o clima…</div></div>;
  }
  const t = c ? descreverTempo(c.codigo, c.dia) : null;
  switch (tipo) {
    case "relogio-alto": return <div className="widget-corpo rel-alto"><Tempo d={d} cls="rel-alto-hora" /><span className="rel-alto-data">{cap(dia)}, {dataLonga(agora)}</span></div>;
    case "relogio-compacto": return <div className="widget-corpo rel-compacto"><Tempo d={d} cls="rel-comp-hora" /><span className="rel-comp-data">{DIAS_CURTOS[agora.getDay()]}<br />{dataCurta(agora)}</span></div>;
    case "relogio-vidro": return <div className="widget-corpo rel-vidro"><span className="rel-vidro-topo">{dataLonga(agora).toUpperCase()}{c ? ` · ${c.temp}°` : ""} · {dia.toUpperCase()}</span><Tempo d={d} cls="rel-vidro-hora" /></div>;
    case "relogio-editorial": return <div className="widget-corpo rel-edit"><div className="rel-edit-topo"><span>{dia.toUpperCase()}</span><span>{d.bat ? `${d.bat.nivel}%` : ""}</span></div><Tempo d={d} cls="rel-edit-hora" /><span className="widget-leve">{dataLonga(agora)} · {agora.getFullYear()}</span></div>;
    case "relogio-empilhado": return <div className="widget-corpo rel-emp"><span className="num rel-emp-n">{hh(agora)}</span><span className="num rel-emp-n rel-emp-m">{mm(agora)}</span><span className="widget-leve">{cap(DIAS_CURTOS[agora.getDay()]!)} · {dataCurta(agora)}</span></div>;
    case "relogio-flip": return <div className="widget-corpo rel-flip"><div className="rel-flip-par"><span className="num rel-flip-cartao">{hh(agora)}</span><span className="num rel-flip-cartao">{mm(agora)}</span></div><span className="widget-leve">{dia}, {dataLonga(agora)}</span></div>;
    case "relogio-grande": return <div className="widget-corpo rel-grande"><div className="rel-grande-hora"><span className="num">{hh(agora)}</span><span className="num">{mm(agora)}</span></div>{c && <span className="rel-grande-temp num">{Math.round(c.temp)}° <Simbolo c={c} tam="1rem" /></span>}<span className="widget-titulo rel-grande-data">{DIAS_CURTOS[agora.getDay()]!.toUpperCase()} {agora.getDate()} {MESES_CURTOS[agora.getMonth()]!.toUpperCase()}</span></div>;
    case "relogio-agenda": return (
      <div className="widget-corpo rel-agenda"><div className="rel-agenda-esq"><Tempo d={d} cls="rel-agenda-hora" /><span className="widget-titulo">{dia}</span><span className="widget-leve">{dataLonga(agora)}</span></div>
        <div className="rel-agenda-dir">{ev ? <><b className="rel-ev">{ev.titulo}</b><span className="widget-leve">{horaDoEvento(ev, agora)}</span></> : <span className="widget-leve">{d.agendaOk === false ? <AgendaPermissao /> : "Nada marcado"}</span>}</div></div>);
    case "relogio-clima": return <div className="widget-corpo rel-clima"><div className="rel-clima-esq"><Tempo d={d} cls="rel-clima-hora" /><span className="widget-leve">{dia}, {dataLonga(agora)}</span></div>{c ? <div className="rel-clima-dir"><span className="num">{c.temp}° <Simbolo c={c} tam="1rem" /></span><span className="widget-leve">{descreverTempo(c.codigo, c.dia).texto}</span></div> : <span className="widget-leve">{d.semLugar ? "Sem cidade" : "…"}</span>}</div>;
    case "relogio-largo": return (
      <div className="widget-corpo rel-largo"><Dial d={agora} /><div className="rel-largo-dir"><span className="widget-titulo">{dia}</span><span className="rel-largo-data">{dataLonga(agora)}</span></div></div>);
    case "relogio-progresso": { const p = progressoDoDia(agora); return (
      <div className="widget-corpo rel-prog"><div className="rel-anel" style={{ "--p": `${p}%` } as React.CSSProperties} role="img" aria-label={`${p}% do dia passou`}><Tempo d={d} cls="rel-anel-hora" /></div>
        <div className="rel-prog-dir"><span className="widget-titulo">{dia}</span><b className="rel-prog-data">{dataLonga(agora)}</b><span className="widget-leve">{p}% do dia passou</span>{ev && <span className="widget-leve truncate">{ev.titulo}</span>}</div></div>); }
    case "saudacao": return <div className="widget-corpo saud"><b className="saud-oi">{saudacao(agora)}</b><span className="widget-leve">{dia}, {dataLonga(agora)}</span><span className="widget-leve num">{hh(agora)}:{mm(agora)}{c && t ? ` • ${c.temp}° ${t.texto}` : ""}</span></div>;
    case "relance": return <div className="widget-corpo relance"><b>{cap(dia)}, {dataLonga(agora)}</b>{ev ? <span className="widget-leve truncate">{ev.titulo} · {horaDoEvento(ev, agora)}</span> : <span className="widget-leve">{d.agendaOk === false ? "Permita a agenda no widget Agenda" : "Nada marcado"}</span>}</div>;
    case "pesquisa": { const B = (d.previa ? "span" : "button") as "button"; return <B type="button" className="pesq" onClick={d.buscar}><Icone nome="pesquisa" tam={20} /><span>Pesquisar apps, contatos e mais</span><Icone nome="brilho" tam={16} /></B>; }
    case "mes-dia": { const g = gradeDoMes(agora.getFullYear(), agora.getMonth()); return (
      <div className="widget-corpo mesdia"><div className="mesdia-esq"><span className="widget-titulo">{DIAS_CURTOS[agora.getDay()]!.toUpperCase()}</span><span className="num mesdia-dia">{agora.getDate()}</span><span className="widget-leve">{MESES[agora.getMonth()]}</span></div>
        <div className="cal-grade mesdia-grade" aria-hidden>{letrasDaSemana().map((s, i) => <span key={i} className="cal-sem">{s}</span>)}{g.flat().map((n, i) => <span key={i} className="cal-dia num" data-hoje={n === agora.getDate()}>{n ?? ""}</span>)}</div></div>); }
    case "semana": return (
      <div className="widget-corpo semana"><div className="semana-topo"><b>{cap(MESES[agora.getMonth()]!)}</b><Tempo d={d} cls="widget-leve" /></div>
        <div className="semana-dias">{diasDaSemana(agora).map((x, i) => <span key={i} className="semana-dia"><i>{letrasDaSemana()[i]}</i><b className="num" data-hoje={x.hoje}>{x.dia}</b></span>)}</div>
        {ev && <span className="widget-leve truncate">{ev.titulo} · {horaDoEvento(ev, agora)}</span>}</div>);
    case "proximos": return (
      <div className="widget-corpo prox"><div className="prox-data"><span className="num prox-dia">{agora.getDate()}</span><span className="widget-leve">{dia}<br />{MESES[agora.getMonth()]}</span></div>
        <ul className="prox-lista">{d.eventos.slice(0, 3).map((e, i) => <li key={`${e.inicio}-${i}`}><i /><div><b className="truncate">{e.titulo}</b><span className="widget-leve">{horaDoEvento(e, agora)}</span></div></li>)}{!d.eventos.length && <li><span className="widget-leve">{d.agendaOk === false ? <AgendaPermissao /> : "Nada marcado"}</span></li>}</ul></div>);
    case "saude-bateria": { const n = d.bat?.nivel ?? 0; return (
      <div className="widget-corpo"><div className="widget-grande num">{n}%</div><div className="widget-barra" role="progressbar" aria-valuenow={n} aria-valuemin={0} aria-valuemax={100} aria-label="Carga da bateria"><i style={{ width: `${n}%` }} data-baixa={n <= 20} /></div><span className="widget-leve">{d.bat?.carregando ? "Carregando" : n <= 20 ? "Baixa: ligue o carregador" : n >= 60 ? "Boa" : "Média"}</span></div>); }
    case "linha-status": return (
      <div className="widget-corpo linha-status"><span className="ls-pilula" data-off={d.sis ? !d.sis.wifi : false}><Icone nome="wifi" tam={18} /></span><span className="ls-pilula" data-off={d.sis ? !d.sis.movel : false}><Icone nome="sinal" tam={18} /></span><span className="ls-pilula num"><Icone nome="bateria" tam={16} />{d.bat ? `${d.bat.nivel}%` : "–"}</span></div>);
    case "tempo": return <div className="widget-corpo tempo"><Simbolo c={c!} tam="1.6rem" /><b className="num tempo-n">{c!.temp}°</b><span className="widget-leve" style={{ color: "var(--color-magenta)" }}>{t!.texto}</span><span className="widget-leve">{DIAS_CURTOS[agora.getDay()]}, {dataCurta(agora)}</span></div>;
    case "tipo-clima": return <div className="widget-corpo tipoc"><div className="tipoc-esq"><span className="widget-titulo">{t!.texto}</span><span className="tipoc-linha"><Simbolo c={c!} tam="2.2rem" /><b className="num tipoc-n">{c!.temp}°</b></span></div><div className="tipoc-dir"><span className="widget-leve">{DIAS_CURTOS[agora.getDay()]} · {dataCurta(agora)}</span><Tempo d={d} cls="widget-leve" /></div></div>;
    case "previsao": return (
      <div className="widget-corpo prev"><div className="prev-topo"><Simbolo c={c!} tam="1.6rem" /><b className="num prev-n">{c!.temp}°</b><span className="widget-leve">{t!.texto}<br />Máx {c!.max}° · Mín {c!.min}°</span></div>
        <div className="prev-dias">{(d.prev?.dias ?? []).slice(1, 6).map((x) => { const dt = new Date(`${x.data}T12:00`); return <span key={x.data} className="prev-dia"><i>{DIAS_CURTOS[dt.getDay()]}</i><Simbolo c={{ ...c!, codigo: x.codigo, dia: true }} tam="1.1rem" /><b className="num">{x.max}°</b><span className="widget-leve num">{x.min}°</span></span>; })}</div></div>);
    case "por-hora": return (
      <div className="widget-corpo prev"><div className="prev-dias">{(d.prev?.horas ?? []).slice(0, 6).map((x, i) => <span key={i} className="prev-dia"><i>{i === 0 ? "Agora" : `${x.h}h`}</i><Simbolo c={{ ...c!, codigo: x.codigo, dia: x.h >= 6 && x.h < 18 }} tam="1.1rem" /><b className="num">{x.temp}°</b></span>)}</div></div>);
    case "orbita": return <div className="widget-corpo orbita"><div className="orbita-anel"><Simbolo c={c!} tam="1.3rem" /><b className="num">{c!.temp}°</b><span className="widget-leve">{t!.texto}</span></div></div>;
    default: return <div className="widget-corpo"><div className="widget-leve">Widget indisponível.</div></div>;
  }
}

function Dial({ d }: { d: Date }) {
  const h = ((d.getHours() % 12) + d.getMinutes() / 60) * 30, m = d.getMinutes() * 6;
  return (
    <svg viewBox="0 0 100 100" className="rel-dial" role="img" aria-label={`Relógio: ${hh(d)}:${mm(d)}`}>
      <circle cx="50" cy="50" r="46" fill="currentColor" fillOpacity="0.08" />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="50" y1="8" x2="50" y2={i % 3 === 0 ? 15 : 12} stroke="currentColor" strokeOpacity={i % 3 === 0 ? 0.9 : 0.4} strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />)}
      <line x1="50" y1="50" x2="50" y2="29" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${h} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="15" stroke="var(--color-neon)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${m} 50 50)`} />
      <circle cx="50" cy="50" r="3.5" fill="var(--color-neon)" />
    </svg>
  );
}

/** Widget ao vivo: busca os dados do aparelho. */
export function CorpoVivo({ tipo }: { tipo: TipoWidget }) {
  const d = useDados(tipo);
  return <CorpoExtra tipo={tipo} d={d} />;
}
