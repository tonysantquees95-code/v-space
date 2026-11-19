// "O que há de novo": a tela que aparece depois de uma atualização.
// REGRA: toda mudança que altere o que o app faz ou como se usa (função nova, melhoria de fluxo, correção) ganha uma linha AQUI,
// com id = o maior id + 1. A tela mostra só o que a pessoa ainda não viu, então não depende do número da versão.
export type TipoNovidade = "novo" | "melhoria" | "correcao";
export interface Novidade { id: number; data: string; tipo: TipoNovidade; titulo: string; texto: string }

export const NOVIDADES: Novidade[] = [
  { id: 1, data: "2026-11-18", tipo: "novo", titulo: "Primeira versão do V-Space", texto: "Tela inicial com dock e pastas, gaveta de apps com busca e letras, e o Estúdio para mudar cores, ícones e tamanhos do seu jeito, com backup." },
  { id: 2, data: "2026-11-18", tipo: "novo", titulo: "Papel de parede e menu da tela inicial", texto: "Segure um espaço vazio da tela inicial para abrir um menu com atalhos. Agora você pode usar uma foto da galeria ou um papel pronto como fundo, com desfoque e escurecimento ajustáveis." },
  { id: 3, data: "2026-11-18", tipo: "correcao", titulo: "Nada fica embaixo das barras", texto: "O V-Space agora fica entre a barra de notificações e a barra de navegação, mesmo quando elas são fixas." },
  { id: 4, data: "2026-11-18", tipo: "novo", titulo: "Atualização dentro do app", texto: "Quando sair uma versão nova, o V-Space baixa sozinho e você só toca em Instalar. Também dá para procurar em Estúdio › Sobre › Procurar atualização." },
  { id: 5, data: "2026-11-18", tipo: "novo", titulo: "Widgets na tela inicial", texto: "Agora dá para colocar relógio (digital ou analógico), clima da sua cidade, bateria e agenda no alto da tela inicial. Segure um espaço vazio e toque em Widgets. A agenda pede permissão só para ler." },
  { id: 6, data: "2026-11-19", tipo: "melhoria", titulo: "Estúdio novo, com prévia ao vivo", texto: "O Estúdio agora mostra a sua tela inicial em miniatura no alto, enquanto você muda temas, cenas prontas, ícones, cantos, dock e pastas. Também ganhou gestos (deslizar para cima), Bloquear layout e, no menu de segurar a tela, papéis de parede rápidos e Criar pasta." },
  { id: 7, data: "2026-11-19", tipo: "novo", titulo: "Categorias inteligentes", texto: "A tela inicial agora tem só widgets e favoritos, e os outros apps ficam em categorias no trilho da lateral (Social, Jogos, Finanças, Produtividade e mais). Toque em Organizar com IA para separar tudo de uma vez: você vê o que vai mudar antes e pode desfazer. Dá para criar, renomear e reordenar categorias, e a grade antiga continua no Estúdio." },
  { id: 8, data: "2026-11-19", tipo: "novo", titulo: "Pesquisa em tudo e Vetorial ID", texto: "Agora a pesquisa acha apps, configurações do V-Space e também pesquisa na web, e lembra o que você abriu e buscou por último. Dá para deslizar para o lado para trocar de categoria. O V-Space passa a pedir o seu Vetorial ID (como os outros apps da suíte); se estiver sem internet, dá para continuar e entrar depois." },
];

export const ROTULO: Record<TipoNovidade, string> = { novo: "Novo", melhoria: "Melhorou", correcao: "Corrigido" };
export const ultimoId = (lista: Novidade[] = NOVIDADES): number => lista.reduce((m, n) => Math.max(m, n.id), 0);
/** O que a pessoa ainda não viu, da mais nova para a mais antiga. */
export const novasDesde = (visto: number, lista: Novidade[] = NOVIDADES): Novidade[] => lista.filter((n) => n.id > visto).sort((a, b) => b.id - a.id);

const CHAVE = "vhome.novidades.vistas";
/** null = nunca guardou (primeira instalação: a apresentação já explica tudo, então não mostra o histórico). */
export function lerVisto(): number | null {
  try { const v = localStorage.getItem(CHAVE); if (v === null) return null; const n = Number(v); return Number.isInteger(n) && n >= 0 ? n : null; } catch { return null; }
}
export function marcarVisto(id: number = ultimoId()): void {
  try { localStorage.setItem(CHAVE, String(id)); } catch { /* sem armazenamento: mostra de novo na próxima vez */ }
}
