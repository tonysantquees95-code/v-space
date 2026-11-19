# V-Space (Android) — notas para quem mexe no código

## Regra de ouro: toda mudança de função vai para a tela "O que há de novo"
- Qualquer melhoria que mude o que o app faz ou como se usa (função nova, fluxo melhorado, correção de erro visível) ganha uma linha em `app/src/novidades.ts`.
- `id` = o maior id existente + 1; `tipo` = `novo`, `melhoria` ou `correcao`; `titulo` curto; `texto` em português simples, dizendo o que mudou para a pessoa (não o que mudou no código).
- A tela aparece sozinha depois da atualização e mostra só o que a pessoa ainda não viu (não depende do número da versão). Na primeira instalação ela não aparece: quem explica é a apresentação.
- O teste `app/teste/novidades.test.mjs` confere ids, tipos e textos.

## Apresentação da primeira abertura
- Tour → permissões explicadas → termos a aceitar, em `app/src/telas/Apresentacao.tsx`; conteúdo em `app/src/apresentacao.ts`.
- Função nova: acrescente (ou ajuste) um passo em `TOUR`. Permissão nova: explique o porquê na tela de permissões ANTES de pedir. Mudou o texto dos termos: suba `VERSAO_DOS_TERMOS`.
- A apresentação e os termos também ficam em Estúdio › Sobre.

## Teste visual das telas
- `app/teste-visual/telas.mjs` (motor) + `config.mjs` (telas a visitar) — `npm run build && npm run test:visual` abre o app em 7 tamanhos (celular pequeno até janela do Windows) e confere se cada tela e janela cabe, não estoura para o lado e se todo botão dá para alcançar. Roda na publicação e guarda as fotos como artefato `fotos-das-telas`.
- Tela ou janela nova: acrescente um cenário em `config.mjs`.

## Android nativo
- O APK só compila no GitHub Actions (`.github/workflows/app.yml`): `npx cap add android`, copia `nativo/src/*.java` (plugin `VetorialHome` + `MainActivity`) e ajusta o manifesto (HOME/DEFAULT, QUERY_ALL_PACKAGES).
- Mudou a interface do plugin (`nativo/src/VSpacePlugin.java`)? Ajuste `app/src/motor.ts` e o motor de demonstração `app/src/demo.ts`.
- A assinatura do APK vem do servidor da Vênus; o repositório precisa estar em `REPOS_PERMITIDOS` (`vetorial-servidor/servidor/src/ci/assinatura.js`).

## Widgets reais de outros apps
- `nativo/src/WidgetsPlugin.java` (AppWidgetHost): lista os widgets instalados, cria/remove e desenha o widget do app POR CIMA da WebView no retângulo que a tela reserva (`app/src/telas/Externos.tsx` conta a posição a cada quadro). Janelas abertas e a edição escondem o widget real. Segurar abre a edição; arrastar na vertical rola a tela.
- Mudou a interface do plugin? Ajuste `app/src/motor.ts` e `app/src/demo.ts`. Só dá para testar no aparelho.

## Entre as barras do Android (regra dos departamentos)
- O app fica ENTRE a barra de notificações e a barra de navegação (fixas ou não): nada pode ficar embaixo delas. No Android nativo isso vem de `MainActivity` (margem do tamanho das barras); confira no Visualizador em todos os tamanhos antes de gerar o APK.

## Publicação e atualização (regra dos departamentos)
- Todo APK finalizado vai direto para o Painel Dev (ver e baixar), e o app precisa estar listado lá.
- O app se atualiza por dentro (verificar → barra de download → Instalar), igual aos outros da suíte. O Vindex enxerga todos os apps.
