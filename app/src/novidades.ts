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
  { id: 9, data: "2026-11-19", tipo: "novo", titulo: "Widgets livres e fundo por trás das barras", texto: "Os widgets agora ficam soltos na tela inicial: segure um widget para mover, puxar as bordas e mudar o tamanho, ou escolher o estilo (vidro, fosco, sólido ou transparente). A lista de widgets mostra uma prévia e o tamanho antes de você colocar. O fundo também aparece por trás da barra de notificações e da barra de navegação, como uma tela só." },
  { id: 10, data: "2026-11-19", tipo: "novo", titulo: "Música na tela inicial e atalhos", texto: "Quando você toca algo (Deezer, YouTube, Spotify…), aparece um player entre os widgets e os favoritos para voltar, pausar e avançar; ele pede o acesso às notificações, só para ver o que está tocando. Em cima ficou uma faixa com atalhos: bateria, Wi-Fi, rede, temperatura e volume. Tocar na miniatura do Estúdio agora leva de volta à tela inicial. Tudo pode ser desligado em Estúdio › Configurações › Atalhos." },
  { id: 11, data: "2026-11-19", tipo: "melhoria", titulo: "Categorias com mais ícones, cores e conteúdo", texto: "Ao criar ou editar uma categoria agora dá para escolher entre mais de 50 ícones separados por assunto, uma cor e o que ela mostra: os apps que você escolhe, os mais usados ou os instalados recentemente. Também corrigimos o teclado, que cobria o campo e o botão Salvar: as janelas de baixo agora sobem junto com ele." },
  { id: 12, data: "2026-11-19", tipo: "novo", titulo: "40 widgets para escolher", texto: "A lista de widgets ganhou relógios de vários estilos, clima por hora e por dia, calendário, semana, próximos eventos, pesquisa, notas, contagem regressiva, foco (Pomodoro), horas pelo mundo e cinco players de música. Cada um mostra uma prévia e o tamanho antes de você colocar. Os de clima usam a cidade do widget Clima.", },
  { id: 13, data: "2026-11-19", tipo: "melhoria", titulo: "Atalhos ao lado e gaveta que fecha puxando", texto: "Bateria, Wi-Fi, rede, temperatura e volume agora ficam no canto direito, acima das categorias. Na gaveta de apps, puxe para baixo para voltar à tela inicial.", },
  { id: 14, data: "2026-11-19", tipo: "correcao", titulo: "Organizar com IA e botão Entendi", texto: "A organização com IA passou a funcionar com muitos apps (ela desistia no meio). E o botão Entendi desta tela não fica mais escondido atrás da barra de navegação.", },
  { id: 15, data: "2026-11-19", tipo: "novo", titulo: "Widgets dos seus apps", texto: "Em Estúdio › Widgets › Adicionar, no fim da lista, aparecem os widgets de verdade dos apps instalados (Agenda, Bem-estar Digital e outros). O Android pode pedir permissão ao adicionar. Segure o widget na tela inicial para mover, mudar o tamanho ou remover; arrastar para cima ou para baixo sobre ele rola a tela.", },
  { id: 16, data: "2026-11-19", tipo: "novo", titulo: "Papel de parede com mais ajustes", texto: "Em Estúdio › Papel de parede › Ajustes, além de desfoque e escurecimento, agora dá para mudar a saturação das cores, deixar a imagem mais fria ou mais quente e escurecer as bordas (vinheta).", },
  { id: 17, data: "2026-11-19", tipo: "novo", titulo: "Selo de notificações nos ícones", texto: "Os apps com notificações ganham uma bolinha com o número no ícone. Usa o mesmo acesso às notificações do player de música (Estúdio › Configurações › Atalhos). O V-Space só conta, não lê o texto.", },
  { id: 18, data: "2026-11-19", tipo: "novo", titulo: "Contatos na pesquisa", texto: "Ao pesquisar um nome, aparece um botão para procurar também nos contatos. O Android pergunta se você deixa; depois é só tocar no contato para abrir o discador.", },
  { id: 19, data: "2026-11-19", tipo: "melhoria", titulo: "Cadeado animado", texto: "Ao bloquear ou liberar o layout, um cadeado aparece na tela e fecha ou abre, para você saber que deu certo.", },
  { id: 20, data: "2026-11-19", tipo: "correcao", titulo: "Atualizar por dentro funciona no Estúdio", texto: "Ao tocar em Procurar atualização (Estúdio › Configurações › Sobre), a janela de atualização agora aparece na frente. Antes ela abria escondida e parecia que o botão não fazia nada.", },
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
