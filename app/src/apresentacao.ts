// Primeira abertura: conhecer as funções, entender as permissões e aceitar os termos.
// Mudou o texto dos termos: suba VERSAO_DOS_TERMOS e a pessoa aceita de novo.
export const VERSAO_DOS_TERMOS = 2;
const CHAVE_TERMOS = "vhome.termos";
const CHAVE_TOUR = "vhome.tour";

export interface PassoDoTour { icone: string; titulo: string; texto: string; como?: string[] }

export const TOUR: PassoDoTour[] = [
  { icone: "🏠", titulo: "Bem-vindo ao V-Space", texto: "A tela inicial do seu celular, feita para ficar do seu jeito.", como: ["Deslize ou toque em Próximo para conhecer as funções.", "Você pode rever esta apresentação no Estúdio, em Sobre."] },
  { icone: "📱", titulo: "Tela inicial e dock", texto: "Seus apps favoritos em páginas, com um dock fixo embaixo e pastas para organizar.", como: ["Segure um app para ver as opções: pôr no dock, agrupar em pasta, ocultar ou desinstalar.", "Deslize para o lado para trocar de página."] },
  { icone: "🔎", titulo: "Gaveta e busca", texto: "Todos os apps em ordem alfabética, com busca por nome e as letras na lateral.", como: ["Deslize para cima na tela inicial ou toque em Todos os apps.", "Digite para achar um app na hora, mesmo sem acento."] },
  { icone: "🎨", titulo: "Estúdio", texto: "Mude cores, formato e tamanho dos ícones, a grade e o papel de parede (foto da galeria, com desfoque e escurecimento), e guarde tudo em um backup.", como: ["Segure um espaço vazio da tela inicial para ver o menu (papel de parede, ícones, grade) ou toque no pincel para abrir o Estúdio.", "Escolha um tema pronto ou ajuste cada detalhe."] },
  { icone: "🧩", titulo: "Widgets", texto: "Relógio digital ou analógico, clima, bateria e agenda no alto da tela inicial.", como: ["Segure um espaço vazio e toque em Widgets.", "O clima pede o nome da cidade. A agenda pede permissão para ler seus compromissos, só leitura."] },
  { icone: "🛡️", titulo: "Sempre dá para voltar", texto: "Se você quiser, volta para o launcher que usava antes em dois toques, sem perder nada do seu celular.", como: ["Estúdio › Backup › Voltar ao launcher anterior.", "Seu layout fica guardado: ao voltar para o V-Space, está tudo lá."] },
];

export const TERMOS: { titulo: string; texto: string }[] = [
  { titulo: "1. O que é o V-Space", texto: "O V-Space é um launcher (tela inicial) da Vetorial Tech para Android. Nesta fase ele está em testes (beta): pode ter erros e mudar sem aviso." },
  { titulo: "2. Seus apps", texto: "Para mostrar os seus apps, o V-Space lê a lista de aplicativos instalados no aparelho. Essa lista fica só no aparelho: não é enviada para a Vetorial Tech nem para terceiros." },
  { titulo: "3. Mudanças no aparelho", texto: "Desinstalar um app é sempre uma ação que você confirma; quem remove é o próprio Android, que também pede a sua confirmação. Ocultar e tirar da tela não apaga nada." },
  { titulo: "4. Permissões", texto: "O V-Space só usa as permissões explicadas na tela anterior, para o fim descrito. Você pode retirá-las a qualquer momento nas configurações do aparelho; algumas funções deixam de funcionar sem elas." },
  { titulo: "5. Privacidade", texto: "O layout e o tema ficam guardados no aparelho. O backup é um arquivo que você escolhe onde salvar. O V-Space não usa conta. Só envia algo à internet se você adicionar o widget de Clima: o nome da cidade e o ponto no mapa vão ao serviço Open-Meteo para buscar o tempo, e as atualizações do app são consultadas no servidor da Vetorial Tech e no GitHub. A agenda é apenas lida, no aparelho." },
  { titulo: "6. Garantias", texto: "O V-Space é oferecido como está. A Vetorial Tech não se responsabiliza por perdas decorrentes do uso; mantenha um backup do seu layout." },
  { titulo: "7. Mudanças", texto: "Estes termos podem mudar. Quando mudarem, o V-Space pede que você aceite de novo antes de continuar." },
];

export const termosAceitos = (): boolean => { try { return localStorage.getItem(CHAVE_TERMOS) === String(VERSAO_DOS_TERMOS); } catch { return false; } };
export const aceitarTermos = (): void => { try { localStorage.setItem(CHAVE_TERMOS, String(VERSAO_DOS_TERMOS)); } catch { /* pede de novo */ } };
export const tourVisto = (): boolean => { try { return localStorage.getItem(CHAVE_TOUR) === "1"; } catch { return false; } };
export const marcarTourVisto = (): void => { try { localStorage.setItem(CHAVE_TOUR, "1"); } catch { /* ok */ } };
/** Precisa mostrar a apresentação (tour + permissões + termos) antes de usar? */
export const precisaApresentar = (): boolean => !termosAceitos() || !tourVisto();
