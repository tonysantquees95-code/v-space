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
- O widget é criado com o contexto do APLICATIVO (`getApplicationContext()`), nunca o da tela: o inflador da tela tem a fábrica do AppCompat, que troca `ImageView` por `AppCompatImageView` e o RemoteViews recusa (`setImageBitmap`, `layout_height`).
- Mudou a interface do plugin? Ajuste `app/src/motor.ts` e `app/src/demo.ts`. Só dá para testar no aparelho.

## Entre as barras do Android (regra dos departamentos)
- O app fica ENTRE a barra de notificações e a barra de navegação (fixas ou não): nada pode ficar embaixo delas. No Android nativo isso vem de `MainActivity` (margem do tamanho das barras); confira no Visualizador em todos os tamanhos antes de gerar o APK.

## Publicação e atualização (regra dos departamentos)
- Todo APK finalizado vai direto para o Painel Dev (ver e baixar), e o app precisa estar listado lá.
- O app se atualiza por dentro (verificar → barra de download → Instalar), igual aos outros da suíte. O Vindex enxerga todos os apps.

## Feedback e relato de erro
- Ajustes › Sobre tem "Enviar feedback" e "Reportar um erro": abrem `telas/FeedbackDoApp.tsx` (página do servidor `/feedback?app=vspace&v=<versão>&p=<plataforma>` num iframe, com o visual do app). Os relatos chegam no Painel Dev › Feedback. Windows: o CSP do `tauri.conf.json` precisa de `frame-src` do servidor. Cenário `feedback` no teste visual.

## Teste de segurança (igual em todos os apps da suíte)
- `app/teste/seguranca.test.mjs` roda junto com os outros testes e na publicação: se falhar, a publicação para. Confere o repositório inteiro: segredo escrito no código (chaves, tokens, senhas), arquivo que nunca pode ser versionado (.env, chaves de assinatura), CSP do Tauri sem `unsafe-eval`/curinga, manifesto do Android (debug, tráfego http, componente exposto sem permissão, `QUERY_ALL_PACKAGES`), `eval`, HTML montado com texto (`innerHTML`), endereço `http://` fora da máquina local, segredo no log, HTTPS desligado e WebView com acesso perigoso.
- Exceção justificada = uma linha em `seguranca.permitidos.json` (regra, arquivo, trecho e MOTIVO de verdade); sem motivo, não vale. Texto digitado pela pessoa ou vindo de site/servidor nunca entra em HTML sem escapar (`textContent` ou `esc()`).
- O arquivo é o mesmo em todos os apps: mudou uma regra? Mude em todos. Achou uma brecha nova? Escreva primeiro um teste que a reproduz.
