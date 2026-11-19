import { useEffect, useState } from "react";
import {
  ajustarTema, COLUNAS, DESFOQUE, ESCURO, escolherTema, exportar, importar, LINHAS, mostrar, mudarGrade, NOMES_DOS_TEMAS, ordenar, reconciliar, TAMANHO_ICONE, TEMAS,
  type AppInfo, type Banco, type EstiloBotao, type EstiloGaveta, type Forma, type Fundo,
} from "../dados.ts";
import { fundoCss } from "../tema";
import { motor } from "../motor";
import { apagarPapel, desenharPronto, escolherFoto, guardarPapel, PRONTOS } from "../papel";
import { Icone } from "../icones";
import { Aviso, Botao, Cartao, Folha, Interruptor, Linha, Passo, Seletor } from "../ui";

export type AbaEstudio = "temas" | "papel" | "icones" | "inicio" | "gaveta" | "backup" | "sobre";
type Aba = AbaEstudio;
const ABAS: { id: Aba; nome: string }[] = [{ id: "temas", nome: "Temas" }, { id: "papel", nome: "Papel de parede" }, { id: "icones", nome: "Ícones" }, { id: "inicio", nome: "Início" }, { id: "gaveta", nome: "Gaveta" }, { id: "backup", nome: "Backup" }, { id: "sobre", nome: "Sobre" }];
const CORES = ["#22d3ee", "#38bdf8", "#8ab4ff", "#a78bfa", "#e879f9", "#f472b6", "#fb7185", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#2dd4bf", "#ffffff"];
const FUNDOS_ESCUROS = ["#000000", "#05070d", "#0b1020", "#12081a", "#14080a", "#04100b", "#101010", "#1a1033"];
const FORMAS: { id: Forma; nome: string }[] = [{ id: "original", nome: "Original" }, { id: "circulo", nome: "Círculo" }, { id: "squircle", nome: "Arredondado" }, { id: "quadrado", nome: "Quadrado" }];
const FUNDOS: { id: Fundo; nome: string }[] = [{ id: "aurora", nome: "Aurora" }, { id: "neon", nome: "Neon" }, { id: "noite", nome: "Noite" }, { id: "cor", nome: "Cor lisa" }];

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

interface Props {
  banco: Banco; apps: AppInfo[]; aoMudar: (f: (b: Banco) => Banco) => void; aoFechar: () => void; aviso: (m: string) => void;
  aoRecomecar: () => void; aoTour: () => void; aoTermos: () => void;
  aoProcurar: () => Promise<void>; abaInicial: AbaEstudio; papel: string | null; aoPapel: (p: string | null) => void;
}

export function Estudio({ banco, apps, aoMudar, aoFechar, aviso, aoRecomecar, aoTour, aoTermos, abaInicial, papel, aoPapel, aoProcurar }: Props) {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [padrao, setPadrao] = useState<boolean | null>(null);
  const [confirmaZero, setConfirmaZero] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => { void motor.ehPadrao().then(setPadrao).catch(() => setPadrao(null)); }, []);
  const t = banco.tema;
  const ocultos = ordenar(apps.filter((a) => banco.ocultos.includes(a.pacote)));

  const usar = (url: string | null) => {
    if (!url) { setErro("Não consegui abrir essa imagem."); return; }
    if (!guardarPapel(url)) { setErro("Não há espaço para guardar esse papel de parede."); return; }
    setErro(""); aoPapel(url); aoMudar((b) => ajustarTema(b, { fundo: "foto" }));
  };
  const daGaleria = async () => { const u = await escolherFoto(); if (u) usar(u); };
  const semPapel = () => { apagarPapel(); aoPapel(null); aoMudar((b) => ajustarTema(b, { fundo: "aurora" })); aviso("Papel de parede removido."); };

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

  return (
    <Folha titulo="Estúdio" aoFechar={aoFechar} alta>
      <div role="tablist" aria-label="Seções do Estúdio" className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {ABAS.map((a) => <button key={a.id} role="tab" aria-selected={aba === a.id} type="button" onClick={() => setAba(a.id)} className={`min-h-11 flex-none rounded-full border px-4 text-sm font-medium ${aba === a.id ? "border-neon bg-neon/15 text-neon" : "border-borda text-suave"}`}>{a.nome}</button>)}
      </div>

      {aba === "temas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TEMAS.map((x) => (
              <button key={x.id} type="button" aria-pressed={t.id === x.id} onClick={() => aoMudar((b) => escolherTema(b, x.id))} className={`overflow-hidden rounded-2xl border-2 text-left ${t.id === x.id ? "border-neon" : "border-borda"}`}>
                <span className="block h-16" style={{ background: fundoCss(x) }}><span className="flex h-full items-end gap-1 p-2"><i className="size-4 rounded-full" style={{ background: x.cor }} /><i className="size-4 rounded-full" style={{ background: x.cor2 }} /></span></span>
                <span className="block px-3 py-2 text-sm font-medium">{NOMES_DOS_TEMAS[x.id]}</span>
              </button>
            ))}
          </div>
          <Cartao titulo="Cor principal"><Paleta rotulo="Cor principal" valor={t.cor} cores={CORES} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { cor: c }))} /></Cartao>
          <Cartao titulo="Cor de apoio"><Paleta rotulo="Cor de apoio" valor={t.cor2} cores={CORES} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { cor2: c }))} /></Cartao>
          <Cartao titulo="Botões"><Seletor<EstiloBotao> rotulo="Estilo dos botões" valor={t.botoes} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { botoes: v }))} opcoes={[{ id: "degrade", nome: "Degradê" }, { id: "contorno", nome: "Contorno" }, { id: "solido", nome: "Sólido" }]} /></Cartao>
        </div>
      )}

      {aba === "papel" && (
        <div className="space-y-4">
          {erro && <Aviso tom="erro">{erro}</Aviso>}
          <div className="papel-previa" aria-label="Prévia do papel de parede">
            {t.fundo === "foto" && papel ? <><div className="papel" style={{ backgroundImage: `url(${papel})`, filter: `blur(${t.desfoque}px)` }} /><div className="papel-escuro" style={{ opacity: t.escuro / 100 }} /></> : <div className="papel" style={{ background: fundoCss(t) }} />}
            <div className="papel-rotulo num">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Botao variante="primario" onClick={() => void daGaleria()}><Icone nome="papel" tam={18} />Escolher da galeria</Botao>
            {t.fundo === "foto" && <Botao onClick={semPapel}>Remover papel</Botao>}
          </div>
          <Cartao titulo="Papéis da Vetorial">
            <div className="grid grid-cols-3 gap-2">
              {PRONTOS.map((p) => <button key={p.id} type="button" aria-label={`Papel ${p.nome}`} className="papel-pronto" style={{ background: `linear-gradient(160deg, ${p.cores[1]}99, ${p.cores[0]} 55%, ${p.cores[2]}88)` }} onClick={() => usar(desenharPronto(p))}><span>{p.nome}</span></button>)}
            </div>
          </Cartao>
          {t.fundo === "foto" && (
            <Cartao titulo="Ajustes">
              <label className="mb-3 block text-sm text-suave">Desfoque
                <input type="range" aria-label="Desfoque" className="mt-1 w-full" min={DESFOQUE.min} max={DESFOQUE.max} value={t.desfoque} onChange={(ev) => aoMudar((b) => ajustarTema(b, { desfoque: Number(ev.target.value) }))} />
              </label>
              <label className="block text-sm text-suave">Escurecimento
                <input type="range" aria-label="Escurecimento" className="mt-1 w-full" min={ESCURO.min} max={ESCURO.max} value={t.escuro} onChange={(ev) => aoMudar((b) => ajustarTema(b, { escuro: Number(ev.target.value) }))} />
              </label>
            </Cartao>
          )}
        </div>
      )}

      {aba === "icones" && (
        <div className="space-y-4">
          <Cartao titulo="Forma"><Seletor<Forma> rotulo="Forma dos ícones" valor={t.forma} opcoes={FORMAS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { forma: v }))} /></Cartao>
          <Cartao titulo="Tamanho">
            <div className="flex items-center gap-3"><input type="range" aria-label="Tamanho dos ícones" min={TAMANHO_ICONE.min} max={TAMANHO_ICONE.max} step={2} value={t.tamanho} onChange={(e) => aoMudar((b) => ajustarTema(b, { tamanho: Number(e.target.value) }))} className="h-11 min-w-0 flex-1 accent-cyan-300" /><span className="num w-12 text-right text-sm text-suave">{t.tamanho}</span></div>
          </Cartao>
          <Cartao><Linha titulo="Nomes dos apps" texto="Mostra o nome embaixo de cada ícone."><Interruptor rotulo="Nomes dos apps" ligado={t.rotulos} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { rotulos: v }))} /></Linha></Cartao>
        </div>
      )}

      {aba === "inicio" && (
        <div className="space-y-4">
          <Cartao titulo="Grade">
            <Linha titulo="Colunas"><Passo rotulo="colunas" valor={banco.layout.colunas} min={COLUNAS.min} max={COLUNAS.max} aoMudar={(v) => aoMudar((b) => mudarGrade(b, v, b.layout.linhas))} /></Linha>
            <Linha titulo="Linhas"><Passo rotulo="linhas" valor={banco.layout.linhas} min={LINHAS.min} max={LINHAS.max} aoMudar={(v) => aoMudar((b) => mudarGrade(b, b.layout.colunas, v))} /></Linha>
          </Cartao>
          <Cartao><Linha titulo="Relógio" texto="Hora e data no alto da tela inicial."><Interruptor rotulo="Relógio" ligado={banco.relogio} aoMudar={(v) => aoMudar((b) => ({ ...b, relogio: v }))} /></Linha></Cartao>
          <Cartao titulo="Fundo">
            <Seletor<Fundo> rotulo="Estilo do fundo" valor={t.fundo} opcoes={FUNDOS} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { fundo: v }))} />
            <div className="mt-3"><Paleta rotulo="Cor do fundo" valor={t.fundoCor} cores={FUNDOS_ESCUROS} aoEscolher={(c) => aoMudar((b) => ajustarTema(b, { fundoCor: c }))} /></div>
          </Cartao>
        </div>
      )}

      {aba === "gaveta" && (
        <div className="space-y-4">
          <Cartao titulo="Estilo da gaveta"><Seletor<EstiloGaveta> rotulo="Estilo da gaveta" valor={t.gaveta} opcoes={[{ id: "lista", nome: "Lista com letras" }, { id: "grade", nome: "Grade" }]} aoMudar={(v) => aoMudar((b) => ajustarTema(b, { gaveta: v }))} /></Cartao>
          <Cartao titulo={`Apps ocultos (${ocultos.length})`}>
            {ocultos.length === 0 ? <p className="text-sm text-suave">Nenhum app oculto. Segure um app e escolha “Ocultar da gaveta”.</p>
              : <ul className="space-y-1">{ocultos.map((a) => <li key={a.pacote} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{a.nome}</span><Botao onClick={() => aoMudar((b) => mostrar(b, a.pacote))}><Icone nome="mostrar" tam={18} />Mostrar</Botao></li>)}</ul>}
          </Cartao>
        </div>
      )}

      {aba === "backup" && (
        <div className="space-y-4">
          {erro && <Aviso tom="erro">{erro}</Aviso>}
          <Cartao titulo="Backup do layout e do tema">
            <p className="mb-3 text-sm text-suave">Guarda a tela inicial, o dock, as pastas e o tema num arquivo. Você escolhe onde salvar.</p>
            <div className="flex flex-wrap gap-3"><Botao variante="primario" onClick={() => void salvar()}><Icone nome="backup" tam={18} />Salvar backup</Botao><Botao onClick={() => void restaurar()}><Icone nome="restaurar" tam={18} />Restaurar backup</Botao></div>
          </Cartao>
          <Cartao titulo="Launcher padrão">
            <p className="mb-3 text-sm text-suave">{padrao === null ? "Não consegui conferir agora." : padrao ? "O V-Space é o launcher padrão deste celular." : "O V-Space ainda não é o launcher padrão."}</p>
            <div className="flex flex-wrap gap-3">
              {padrao === false && <Botao variante="primario" onClick={() => void motor.pedirPadrao()}>Tornar padrão</Botao>}
              <Botao onClick={() => void motor.abrirAjustesInicio()}>Voltar ao launcher anterior</Botao>
            </div>
            <p className="mt-3 text-xs text-suave">Seu layout fica guardado: ao voltar para o V-Space, está tudo como você deixou.</p>
          </Cartao>
          <Cartao titulo="Recomeçar">
            {confirmaZero ? (
              <div className="space-y-3"><Aviso>Isso refaz a tela inicial do zero (o tema continua). Seus apps não são apagados.</Aviso><div className="flex gap-3"><Botao className="flex-1" onClick={() => setConfirmaZero(false)}>Cancelar</Botao><Botao variante="perigo" className="flex-1" onClick={() => { aoRecomecar(); setConfirmaZero(false); aviso("Tela inicial refeita."); }}>Refazer</Botao></div></div>
            ) : <Botao variante="perigo" onClick={() => setConfirmaZero(true)}>Refazer a tela inicial</Botao>}
          </Cartao>
        </div>
      )}

      {aba === "sobre" && (
        <div className="space-y-4">
          <Cartao titulo="V-Space"><p className="text-sm text-suave">Launcher da Vetorial Tech para Android. Nesta fase está em testes (beta). Versão {import.meta.env.VITE_BUILD ? `1.${String(import.meta.env.VITE_BUILD)}` : "de desenvolvimento"}.</p></Cartao>
          <div className="flex flex-col gap-2"><Botao onClick={() => void aoProcurar()}>Procurar atualização</Botao><Botao onClick={aoTour}>Rever a apresentação</Botao><Botao onClick={aoTermos}>Termos de uso</Botao></div>
        </div>
      )}
    </Folha>
  );
}
