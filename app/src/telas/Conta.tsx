import { useState, type FormEvent } from "react";
import { ErroConta, type Aparelho, type ErroDeLimite, type Sessao, criarConta, entrar } from "../conta";
import { LogoV } from "../icones";
import { Aviso, Botao, Cartao } from "../ui";
import { RecuperarSenha } from "./RecuperarSenha";

const campo = "min-h-11 w-full rounded-xl border border-borda bg-black/20 px-3 text-[15px]";

/** Entrada com o Vetorial ID (a mesma conta da Vênus). Sem internet na primeira vez, `aoAdiar` deixa seguir sem conta para o celular nunca ficar sem tela inicial. */
export function Conta({ aparelho, aoEntrar, aoAdiar, aoFechar, motivo }: { aparelho: Aparelho; aoEntrar: (s: Sessao) => void; aoAdiar?: () => void; aoFechar?: () => void; motivo?: string }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [criar, setCriar] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [pin, setPin] = useState(""); const [pin2, setPin2] = useState("");
  const [perg, setPerg] = useState(""); const [resp, setResp] = useState(""); const [resp2, setResp2] = useState("");
  const [erro, setErro] = useState("");
  const [semRede, setSemRede] = useState(false);
  const [limite, setLimite] = useState<ErroDeLimite | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(extra: { encerrar?: string; remover?: string } = {}) {
    setOcupado(true); setErro(""); setSemRede(false);
    try {
      const nova = criar && !extra.encerrar && !extra.remover
        ? await criarConta(nome.trim(), email.trim(), senha, aparelho, { pin, pinConfirma: pin2, pergunta: perg, resposta: resp, respostaConfirma: resp2 })
        : await entrar(email.trim(), senha, aparelho, extra);
      setLimite(null);
      aoEntrar(nova);
    } catch (e) {
      if (e instanceof ErroConta && e.limite) setLimite(e.limite);
      else { setErro(e instanceof Error ? e.message : "Não deu certo."); setSemRede(e instanceof ErroConta && e.semRede); }
    }
    setOcupado(false);
  }
  const aoEnviar = (ev: FormEvent) => { ev.preventDefault(); void enviar(); };

  if (esqueci) return <div className="fixed inset-0 z-[60] overflow-y-auto bg-fundo"><RecuperarSenha emailInicial={email} aoVoltar={(e) => { if (e) setEmail(e); setEsqueci(false); }} /></div>;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-fundo" role="dialog" aria-modal="true" aria-label="Entrar com o Vetorial ID">
      <main className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"><div className="my-auto flex flex-col gap-4">
        <div className="text-center"><div className="mx-auto w-fit"><LogoV tam={72} /></div><h1 className="mt-3 text-2xl font-semibold">V-Space</h1><p className="mt-1 text-sm text-suave">{motivo ?? "Entre com o seu Vetorial ID, a conta única da suíte Vetorial."}</p></div>
        {limite ? (
          <Cartao titulo={limite.tipo === "sessoes" ? "Limite de aparelhos ao mesmo tempo" : "Limite de aparelhos vinculados"}>
            <p className="mb-3 text-sm text-suave">{limite.tipo === "sessoes" ? "Encerre uma sessão para entrar neste aparelho." : "Remova um aparelho para vincular este."}</p>
            <div className="space-y-2">{limite.itens.map((i) => <Botao key={i.id} className="w-full justify-between" disabled={ocupado} onClick={() => void enviar(limite.tipo === "sessoes" ? { encerrar: i.id } : { remover: i.id })}><span>{i.titulo}</span><span className="text-xs text-suave">{limite.tipo === "sessoes" ? "encerrar" : "remover"}</span></Botao>)}<Botao className="w-full" onClick={() => setLimite(null)}>Cancelar</Botao></div>
          </Cartao>
        ) : (
          <Cartao>
            <form onSubmit={aoEnviar} className="space-y-3" aria-label={criar ? "Criar conta" : "Entrar"}>
              {criar && <label className="block text-sm"><span className="text-suave">Seu nome</span><input className={campo} autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required /></label>}
              <label className="block text-sm"><span className="text-suave">E-mail do Vetorial ID</span><input className={campo} type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label className="block text-sm"><span className="text-suave">Senha</span><input className={campo} type="password" autoComplete={criar ? "new-password" : "current-password"} minLength={criar ? 8 : undefined} value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
              {erro && <Aviso tom="erro">{erro}</Aviso>}
              {criar && (
                <div className="space-y-3 rounded-xl border border-borda p-3">
                  <p className="text-xs text-suave">Recuperação da conta: se esquecer a senha, você troca por uma destas duas. Guarde bem.</p>
                  <label className="block text-sm"><span className="text-suave">Senha de recuperação (6 números)</span><input className={campo} type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required /></label>
                  <label className="block text-sm"><span className="text-suave">Repita a senha de recuperação</span><input className={campo} type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} required /></label>
                  <label className="block text-sm"><span className="text-suave">Pergunta secreta (escreva a sua)</span><input className={campo} maxLength={120} autoComplete="off" placeholder="Ex.: Qual era o nome do meu primeiro cachorro?" value={perg} onChange={(e) => setPerg(e.target.value)} required /></label>
                  <label className="block text-sm"><span className="text-suave">Resposta da pergunta</span><input className={campo} maxLength={80} autoComplete="off" value={resp} onChange={(e) => setResp(e.target.value)} required /></label>
                  <label className="block text-sm"><span className="text-suave">Repita a resposta</span><input className={campo} maxLength={80} autoComplete="off" value={resp2} onChange={(e) => setResp2(e.target.value)} required /></label>
                </div>
              )}
              <Botao type="submit" variante="primario" className="w-full" disabled={ocupado}>{ocupado ? (criar ? "Criando…" : "Entrando…") : criar ? "Criar conta grátis" : "Entrar"}</Botao>
              <button type="button" onClick={() => { setCriar((v) => !v); setErro(""); }} className="min-h-11 w-full text-sm text-neon underline">{criar ? "Já tenho conta: entrar" : "Não tenho conta: criar agora (grátis)"}</button>
            </form>
          </Cartao>
        )}
        {semRede && aoAdiar && <Botao className="w-full" onClick={aoAdiar}>Continuar sem internet e entrar depois</Botao>}
        {aoFechar && <Botao className="w-full" onClick={aoFechar}>Agora não</Botao>}
        <p className="text-center text-xs text-suave">O V-Space é grátis. O Vetorial ID vale para todos os apps da Vetorial Tech. Esqueceu a senha? <button type="button" className="underline" onClick={() => setEsqueci(true)}>Recuperar</button></p>
      </div></main>
    </div>
  );
}
