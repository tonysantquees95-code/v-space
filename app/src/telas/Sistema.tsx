import { useCallback, useEffect, useState } from "react";
import type { Banco, Widget } from "../dados.ts";
import { Icone } from "../icones";
import { motor, type Musica, type Sistema } from "../motor";
import { buscarClima, type Bateria, type Clima } from "../widgets";

/** Roda `f` agora e a cada `ms` enquanto a tela está visível (poupa bateria). */
function useSondagem(f: () => void, ms: number, ligado = true) {
  useEffect(() => {
    if (!ligado) return;
    let t = 0;
    const ciclo = () => { if (!document.hidden) f(); };
    ciclo(); t = window.setInterval(ciclo, ms);
    const volta = () => { if (!document.hidden) f(); };
    document.addEventListener("visibilitychange", volta);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", volta); };
  }, [f, ms, ligado]);
}

/** Mini-player: o que está tocando (Deezer, YouTube Music, Spotify…), com voltar, pausar e avançar. Aparece entre os widgets e os favoritos. */
export function MiniPlayer({ ligado, aoAbrirApp }: { ligado: boolean; aoAbrirApp: (pacote: string) => void }) {
  const [m, setM] = useState<Musica>({ tem: false });
  const ler = useCallback(() => { void motor.musicaPermitida().then((p) => (p ? motor.musica() : { tem: false })).then(setM); }, []);
  useSondagem(ler, 2500, ligado);
  if (!ligado || !m.tem) return null;
  const cmd = (a: "pausar" | "tocar" | "proxima" | "anterior") => { void motor.musicaComando(a).then(() => window.setTimeout(ler, 250)).catch(() => undefined); };
  return (
    <section className="player" aria-label="Tocando agora">
      <button type="button" className="player-capa" aria-label={`Abrir ${m.app ?? "o app de música"}`} onClick={() => m.pacote && aoAbrirApp(m.pacote)}>
        {m.capa ? <img src={m.capa} alt="" draggable={false} /> : <Icone nome="nota" tam={26} />}
      </button>
      <div className="player-texto"><div className="player-titulo">{m.titulo || "Sem título"}</div><div className="player-sub">{[m.artista, m.app].filter(Boolean).join(" · ")}</div></div>
      <div className="player-botoes">
        <button type="button" aria-label="Faixa anterior" onClick={() => cmd("anterior")}><Icone nome="anterior" tam={22} /></button>
        <button type="button" aria-label={m.tocando ? "Pausar" : "Tocar"} className="player-principal" onClick={() => cmd(m.tocando ? "pausar" : "tocar")}><Icone nome={m.tocando ? "pausar" : "tocar"} tam={22} /></button>
        <button type="button" aria-label="Próxima faixa" onClick={() => cmd("proxima")}><Icone nome="proxima" tam={22} /></button>
      </div>
    </section>
  );
}

/** Faixa de atalhos do canto: bateria, Wi-Fi, rede móvel, temperatura e volume. Cada um abre a tela certa do sistema. */
export function FaixaAtalhos({ banco, widgets }: { banco: Banco; widgets: Widget[] }) {
  const [bat, setBat] = useState<Bateria | null>(null);
  const [sis, setSis] = useState<Sistema | null>(null);
  const [clima, setClima] = useState<Clima | null>(null);
  const lugar = widgets.find((w) => w.tipo === "clima" && w.lat !== undefined && w.lon !== undefined);
  const ler = useCallback(() => { void motor.bateria().then(setBat); void motor.sistema().then(setSis); }, []);
  useSondagem(ler, 8000, banco.faixa);
  useEffect(() => {
    if (!banco.faixa || !lugar || lugar.lat === undefined || lugar.lon === undefined) { setClima(null); return; }
    let vivo = true;
    void buscarClima(lugar.lat, lugar.lon).then((c) => { if (vivo) setClima(c); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [banco.faixa, lugar?.lat, lugar?.lon]);
  if (!banco.faixa) return null;
  const nivel = bat?.nivel ?? 0;
  const anel = 2 * Math.PI * 16;
  return (
    <nav className="atalhos" aria-label="Atalhos do aparelho">
      <button type="button" className="atalho" aria-label={`Bateria ${nivel}%`} onClick={() => void motor.abrirAjuste("bateria")}>
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden><circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff33" strokeWidth="3" /><circle cx="20" cy="20" r="16" fill="none" stroke={nivel <= 20 ? "#fb7185" : "var(--color-neon)"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(anel * nivel) / 100} ${anel}`} transform="rotate(-90 20 20)" /></svg>
        <span className="atalho-num num">{bat ? nivel : "–"}</span>
      </button>
      <button type="button" className="atalho" aria-label={sis?.wifi ? "Wi-Fi conectado, abrir ajustes" : "Wi-Fi desligado, abrir ajustes"} data-off={sis ? !sis.wifi : false} onClick={() => void motor.abrirAjuste("wifi")}><Icone nome="wifi" tam={24} /></button>
      <button type="button" className="atalho" aria-label={sis?.movel ? "Rede móvel conectada, abrir ajustes" : "Sem rede móvel, abrir ajustes"} data-off={sis ? !sis.movel : false} onClick={() => void motor.abrirAjuste("rede")}><Icone nome="sinal" tam={24} /></button>
      {clima && <div className="atalho atalho-clima" role="img" aria-label={`Temperatura em ${lugar?.cidade ?? ""}: ${clima.temp} graus`}><span className="num">{clima.temp}°</span></div>}
      <button type="button" className="atalho" aria-label={`Volume ${sis?.volume ?? 0}%, abrir controle`} onClick={() => void motor.mostrarVolume()}><Icone nome="volume" tam={22} /><span className="atalho-num num">{sis?.volume ?? 0}</span></button>
    </nav>
  );
}
