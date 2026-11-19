// Vetorial ID: login único da suíte (o mesmo da Vênus). A sessão fica no aparelho; o servidor confere em cada pedido de IA.
import { SERVIDOR } from "./atualizacao";

export interface Sessao { token: string; email: string; nome: string }
export interface Aparelho { id: string; nome: string; plataforma: string }
export type ErroDeLimite = { tipo: "sessoes"; itens: { id: string; titulo: string }[] } | { tipo: "aparelhos"; itens: { id: string; titulo: string }[] };
export type Recuperacao = { pin: string; pinConfirma: string; pergunta: string; resposta: string; respostaConfirma: string };

export class ErroConta extends Error {
  constructor(mensagem: string, public codigo = "", public limite: ErroDeLimite | null = null, public status = 0, public semRede = false) { super(mensagem); }
}

const CHAVE_SESSAO = "vspace.sessao";
const CHAVE_APARELHO = "vspace.aparelho";
const CHAVE_DEPOIS = "vspace.entrar-depois";

export function aparelhoLocal(plataforma = "android"): Aparelho {
  try { const g = JSON.parse(localStorage.getItem(CHAVE_APARELHO) ?? "null") as Aparelho | null; if (g?.id) return g; } catch { /* sem armazenamento */ }
  const id = `vspace-${plataforma}-${Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
  const a = { id, nome: plataforma === "android" ? "Celular (V-Space)" : "Computador (V-Space)", plataforma };
  try { localStorage.setItem(CHAVE_APARELHO, JSON.stringify(a)); } catch { /* ok */ }
  return a;
}

export function sessaoGuardada(): Sessao | null {
  try { const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? "null") as Sessao | null; return s?.token ? s : null; } catch { return null; }
}
export function guardarSessao(s: Sessao | null): void {
  try { if (s) { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); localStorage.removeItem(CHAVE_DEPOIS); } else localStorage.removeItem(CHAVE_SESSAO); } catch { /* ok */ }
}
/** Sem internet na primeira vez: a pessoa pode seguir sem conta e entrar depois (o celular nunca fica sem tela inicial). */
export const entrarDepois = (): boolean => { try { return localStorage.getItem(CHAVE_DEPOIS) === "1"; } catch { return false; } };
export const marcarEntrarDepois = (): void => { try { localStorage.setItem(CHAVE_DEPOIS, "1"); } catch { /* ok */ } };

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown, token?: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${SERVIDOR}${caminho}`, { method: metodo, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: AbortSignal.timeout(20_000) });
  } catch { throw new ErroConta("Sem conexão com o servidor. Confira a internet.", "", null, 0, true); }
  const d = (await r.json().catch(() => ({}))) as Record<string, any>;
  if (!r.ok) {
    let limite: ErroDeLimite | null = null;
    if (d.codigo === "limite_simultaneo") limite = { tipo: "sessoes", itens: (d.ativas ?? []).map((a: any) => ({ id: a.sessao, titulo: `${a.nome} (${a.plataforma})` })) };
    if (d.codigo === "limite_dispositivos") limite = { tipo: "aparelhos", itens: (d.dispositivos ?? []).map((x: any) => ({ id: x.id, titulo: `${x.nome} (${x.plataforma})` })) };
    throw new ErroConta(d.error || `Erro ${r.status}`, d.codigo || "", limite, r.status);
  }
  return d as T;
}

type RespostaLogin = { token: string; usuario: { email: string; nome?: string } };
export async function entrar(email: string, senha: string, aparelho: Aparelho, extra: { encerrar?: string; remover?: string } = {}): Promise<Sessao> {
  const r = await chamar<RespostaLogin>("POST", "/id/entrar", { email, senha, dispositivo: aparelho, app: "vspace", ...extra });
  return { token: r.token, email: r.usuario.email, nome: r.usuario.nome ?? "" };
}
/** Cria o Vetorial ID na hora (grátis) e já entra. */
export async function criarConta(nome: string, email: string, senha: string, aparelho: Aparelho, recuperacao: Recuperacao): Promise<Sessao> {
  const r = await chamar<RespostaLogin>("POST", "/id/cadastrar", { nome, email, senha, dispositivo: aparelho, app: "vspace", recuperacao });
  return { token: r.token, email: r.usuario.email, nome: r.usuario.nome || nome };
}
export async function perguntaSecreta(email: string): Promise<{ existe: boolean; configurada: boolean; pergunta: string }> { return chamar("POST", "/id/recuperar/pergunta", { email }); }
export async function recuperarPorSegredo(email: string, metodo: "pin" | "pergunta", valor: string, novaSenha: string): Promise<void> { await chamar("POST", "/id/recuperar/segredo", { email, metodo, valor, novaSenha }); }
export async function sair(token: string): Promise<void> { try { await chamar("POST", "/id/sair", {}, token); } catch { /* já saiu */ } }
