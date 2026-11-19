import { useEffect, useRef, useState } from "react";
import { motor, type ItemExterno } from "../motor";
import type { Widget } from "../dados.ts";

/**
 * Widgets reais de outros apps. O Android desenha o widget POR CIMA da tela web; aqui a tela só reserva o espaço
 * (um retângulo) e, a cada quadro, conta ao Android onde ele está e qual parte está visível (cortada pela rolagem).
 * Janelas abertas e a edição escondem o widget real e deixam só a reserva.
 */
const registro = new Map<number, HTMLElement>();
let oculto = false;
let laco = 0;
let ultimo = "";
let fimEventos: (() => void) | null = null;

export function ocultarExternos(valor: boolean) { oculto = valor; }

const rolavel = (el: HTMLElement): boolean => { const s = getComputedStyle(el).overflowY; return (s === "auto" || s === "scroll") && el.scrollHeight > el.clientHeight + 1; };
function rolador(el: HTMLElement | null): HTMLElement | null { for (let p = el?.parentElement ?? null; p; p = p.parentElement) if (rolavel(p)) return p; return null; }

/** Parte do retângulo que não é cortada por nenhum ancestral com rolagem ou corte (e pela tela). */
function visivel(el: HTMLElement): DOMRect | null {
  const r = el.getBoundingClientRect();
  let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
  x1 = Math.max(x1, 0); y1 = Math.max(y1, 0); x2 = Math.min(x2, window.innerWidth); y2 = Math.min(y2, window.innerHeight);
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (s.overflowY !== "visible" || s.overflowX !== "visible") {
      const b = p.getBoundingClientRect();
      x1 = Math.max(x1, b.left); y1 = Math.max(y1, b.top); x2 = Math.min(x2, b.right); y2 = Math.min(y2, b.bottom);
    }
  }
  return x2 - x1 >= 2 && y2 - y1 >= 2 ? new DOMRect(x1, y1, x2 - x1, y2 - y1) : null;
}

function quadro() {
  laco = requestAnimationFrame(quadro);
  const itens: ItemExterno[] = [];
  if (!oculto && !document.hidden) {
    for (const [id, el] of registro) {
      if (!el.isConnected) continue;
      const art = el.closest("article");
      if (art && (art.getAttribute("data-selecionado") === "true" || art.getAttribute("data-movendo") === "true")) continue;
      const r = el.getBoundingClientRect(), v = visivel(el);
      if (!v) continue;
      const f = (n: number) => Math.round(n * 10) / 10;
      itens.push({ id, x: f(r.left), y: f(r.top), w: f(r.width), h: f(r.height), cx: f(v.left), cy: f(v.top), cw: f(v.width), ch: f(v.height) });
    }
  }
  const chave = JSON.stringify(itens);
  if (chave === ultimo) return;
  ultimo = chave;
  void motor.mostrarExternos(itens).then((e) => window.dispatchEvent(new CustomEvent("vspace-externo-estado", { detail: e })));
}

function ligar() {
  if (laco) return;
  ultimo = "";
  laco = requestAnimationFrame(quadro);
  fimEventos = motor.aoEventoExterno({
    longo: (id) => window.dispatchEvent(new CustomEvent("vspace-widget-longo", { detail: id })),
    rolar: (dy) => { const el = [...registro.values()].find((e) => e.isConnected); const r = rolador(el ?? null); if (r) r.scrollTop += dy; },
  });
}
function desligar() {
  if (!laco || registro.size) return;
  cancelAnimationFrame(laco); laco = 0;
  fimEventos?.(); fimEventos = null;
  ultimo = "[]";
  void motor.mostrarExternos([]);
}

export function ExternoCorpo({ w }: { w: Widget }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = w.appId ?? -1;
  const [problema, setProblema] = useState("");
  useEffect(() => {
    const f = (e: Event) => { const m = (e as CustomEvent<Record<string, string>>).detail ?? {}; const t = m[String(id)] ?? m["*"] ?? ""; setProblema(t && t !== "ok" ? t : ""); };
    window.addEventListener("vspace-externo-estado", f);
    return () => window.removeEventListener("vspace-externo-estado", f);
  }, [id]);
  useEffect(() => {
    const el = ref.current;
    if (!el || id < 0) return;
    registro.set(id, el); ligar();
    return () => { if (registro.get(id) === el) registro.delete(id); desligar(); };
  }, [id]);
  return (
    <div ref={ref} className="externo" data-externo={id}>
      <b className="truncate">{w.titulo ?? "Widget de app"}</b>
      <span className="widget-leve">{problema || (motor.nome === "android" ? "Carregando o widget…" : "Aparece no aparelho (demonstração)")}</span>
    </div>
  );
}
