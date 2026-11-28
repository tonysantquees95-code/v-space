// Primeira abertura: conhecer as funções, entender as permissões e aceitar os termos.
// Mudou o texto dos termos: suba VERSAO_DOS_TERMOS e a pessoa aceita de novo.
import type { NomeIcone } from "./icones.tsx";
export const VERSAO_DOS_TERMOS = 6;
const CHAVE_TERMOS = "vhome.termos";
const CHAVE_TOUR = "vhome.tour";

export interface PassoDoTour { icone: NomeIcone; titulo: string; texto: string; como?: string[] }

export const TOUR: PassoDoTour[] = [
  { icone: "casa", titulo: "Bem-vindo ao V-Space", texto: "A tela inicial do seu celular, feita para ficar do seu jeito.", como: ["Deslize ou toque em Próximo para conhecer as funções.", "Você pode rever esta apresentação no Estúdio, em Sobre."] },
  { icone: "celular", titulo: "Tela inicial e dock", texto: "Widgets e favoritos na tela, os outros apps em categorias no trilho da lateral. Se preferir, volte à grade de apps com dock e pastas.", como: ["Segure um app para ver as opções: pôr no dock, agrupar em pasta, ocultar ou desinstalar.", "Deslize para o lado para trocar de página."] },
  { icone: "brilho", titulo: "Categorias inteligentes", texto: "Seus apps separados em Social, Jogos, Finanças, Produtividade e mais, em um toque.", como: ["Toque no ícone de brilho do trilho (Organizar com IA): você vê o que vai mudar antes de aplicar, e dá para desfazer.", "Segure um app para favoritar ou mover de categoria. O que você mexe à mão a IA não troca.", "Para organizar, só os nomes dos apps vão para a IA."] },
  { icone: "pesquisa", titulo: "Gaveta e busca", texto: "Todos os apps em ordem alfabética, com busca por nome e as letras na lateral.", como: ["Deslize para cima na tela inicial ou toque em Todos os apps.", "Digite para achar um app na hora, mesmo sem acento."] },
  { icone: "estudio", titulo: "Estúdio", texto: "Veja a tela inicial em miniatura enquanto muda cenas, cores, formato e pacote dos ícones, cantos, dock, pastas, a grade e o papel de parede (foto da galeria, com desfoque e escurecimento), e guarde tudo em um backup.", como: ["Segure um espaço vazio da tela inicial para ver o menu (papel de parede, ícones, grade) ou toque no pincel para abrir o Estúdio.", "Escolha um tema pronto ou ajuste cada detalhe."] },
  { icone: "widgets", titulo: "Widgets", texto: "Relógio digital ou analógico, clima, bateria e agenda soltos na tela inicial, no lugar e no tamanho que você quiser, com estilo vidro, fosco, sólido ou transparente.", como: ["Em Widgets (Estúdio ou menu da tela vazia) você vê a prévia e o tamanho antes de colocar.", "Segure um widget para mover, puxar as bordas e mudar o estilo.", "O clima pede o nome da cidade. A agenda pede permissão para ler seus compromissos, só leitura."] },
  { icone: "nota", titulo: "Música e atalhos", texto: "O que está tocando aparece entre os widgets e os favoritos, com voltar, pausar e avançar. Em cima, atalhos para bateria, Wi-Fi, rede, temperatura e volume.", como: ["O player precisa do acesso às notificações do Android (você libera em Estúdio › Configurações › Atalhos). Ele só vê título, artista e botões. O mesmo acesso mostra o selo com o número de notificações em cada ícone (só a contagem).", "Dá para desligar o player e a faixa de atalhos no mesmo lugar."] },
  { icone: "cadeado", titulo: "Espaço seguro", texto: "Uma tela só com os apps de banco e governo que você escolher, sem widgets, números de notificação nem música. Abre com o desbloqueio do aparelho.", como: ["Deslize com dois dedos para baixo na tela inicial, ou abra em Estúdio › Configurações › Espaço seguro.", "Ela fecha sozinha quando você sai do V-Space."] },
  { icone: "restaurar", titulo: "Sempre dá para voltar", texto: "Se você quiser, volta para o launcher que usava antes em dois toques, sem perder nada do seu celular.", como: ["Estúdio › Backup › Voltar ao launcher anterior.", "Seu layout fica guardado: ao voltar para o V-Space, está tudo lá."] },
];

export const TERMOS: { titulo: string; texto: string }[] = [
  { titulo: "1. O que é o V-Space", texto: "O V-Space é um launcher (tela inicial) da Vetorial Tech para Android. Nesta fase ele está em testes (beta): pode ter erros e mudar sem aviso." },
  { titulo: "2. Seus apps", texto: "Para mostrar os seus apps, o V-Space lê a lista de aplicativos instalados no aparelho. Essa lista fica só no aparelho. A única exceção é quando você toca em “Organizar com IA”: aí os NOMES dos apps e das categorias são enviados ao servidor da Vetorial Tech e a um serviço de inteligência artificial de terceiros, só para sugerir em qual categoria cada app fica. Nada é guardado pela Vetorial Tech e nenhum dado pessoal vai junto. Sem tocar nesse botão, nada sai do aparelho." },
  { titulo: "3. Mudanças no aparelho", texto: "Desinstalar um app é sempre uma ação que você confirma; quem remove é o próprio Android, que também pede a sua confirmação. Ocultar e tirar da tela não apaga nada." },
  { titulo: "4. Permissões", texto: "O V-Space só usa as permissões explicadas na tela anterior, para o fim descrito. Você pode retirá-las a qualquer momento nas configurações do aparelho; algumas funções deixam de funcionar sem elas." },
  { titulo: "5. Privacidade", texto: "Para usar o app você entra com o Vetorial ID, a conta única da Vetorial Tech: guardamos o seu e-mail e nome nos servidores da Vetorial Tech só para a conta funcionar, e o app guarda no aparelho um código de acesso (que sai quando você toca em Sair da conta). O layout e o tema ficam guardados no aparelho. O backup é um arquivo que você escolhe onde salvar. O V-Space não usa conta. Só envia algo à internet se você adicionar o widget de Clima: o nome da cidade e o ponto no mapa vão ao serviço Open-Meteo para buscar o tempo, e as atualizações do app são consultadas no servidor da Vetorial Tech e no GitHub. O acesso às notificações, se você liberar, serve só para ler título, artista e botões do que está tocando e para contar quantas notificações cada app tem (o selo no ícone); o texto das notificações não é lido nem guardado e nada disso sai do aparelho. Os contatos, se você liberar, são consultados só quando você pesquisa um nome, no aparelho. A agenda é apenas lida, no aparelho." },
  { titulo: "6. Garantias", texto: "O V-Space é oferecido como está. A Vetorial Tech não se responsabiliza por perdas decorrentes do uso; mantenha um backup do seu layout." },
  { titulo: "7. Mudanças", texto: "Estes termos podem mudar. Quando mudarem, o V-Space pede que você aceite de novo antes de continuar." },
];

export const termosAceitos = (): boolean => { try { return localStorage.getItem(CHAVE_TERMOS) === String(VERSAO_DOS_TERMOS); } catch { return false; } };
export const aceitarTermos = (): void => { try { localStorage.setItem(CHAVE_TERMOS, String(VERSAO_DOS_TERMOS)); } catch { /* pede de novo */ } };
export const tourVisto = (): boolean => { try { return localStorage.getItem(CHAVE_TOUR) === "1"; } catch { return false; } };
export const marcarTourVisto = (): void => { try { localStorage.setItem(CHAVE_TOUR, "1"); } catch { /* ok */ } };
/** Precisa mostrar a apresentação (tour + permissões + termos) antes de usar? */
export const precisaApresentar = (): boolean => !termosAceitos() || !tourVisto();
