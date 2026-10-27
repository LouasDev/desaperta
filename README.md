# Desaperta

App de organização financeira para adolescentes: acompanhe o dinheiro que entra,
o que sai, para quem você deve e quem deve para você. Interface com cores suaves,
contraste discreto, ícones de traço e relevo leve nos controles.

## O que já funciona

- Início com saldo registrado, entradas, saídas e valores pendentes.
- Cadastro, edição e exclusão de receitas e despesas, com categorias.
- Histórico com busca, filtro de tipo e período.
- Pendências em duas abas: **Eu devo** e **Me devem**.
- Cadastro de pessoas junto das pendências, com valor e vencimento.
- Pagamentos parciais, recebimentos, quitação e histórico de baixas.
- Movimentação automática para cada baixa, sem duplicar o registro.
- Dados locais recuperados ao reabrir, com tratamento de erros.
- Backup JSON por arquivo e por texto, importação validada e cópia anterior à restauração.
- Confirmações de exclusão e proteção contra sair de formulários sem salvar.

## Começar a usar

1. Abra `iniciar-web.cmd` para usar no navegador.
2. Para desenvolver, abra esta pasta no VS Code. O terminal desta pasta já tem
   Node e npm configurados. Você também pode abrir `terminal.cmd`.
3. Adicione uma entrada chamada **Saldo inicial** com o dinheiro que você já tem.
4. Registre receitas, despesas e compromissos. Em cada pendência, registre os
   pagamentos/recebimentos que realmente aconteceram.
5. Em **Seu espaço**, exporte backups regularmente para um local privado.

Uma dívida a receber não entra no saldo antes de ser recebida. Ao registrar uma
baixa, o app cria sua movimentação automaticamente; não registre o mesmo valor
novamente. Se o empréstimo original entrou ou saiu do seu caixa, registre essa
operação inicial separadamente.

## Executar no celular

O projeto usa **Expo SDK 54**, conforme o template do professor. No Android,
instale o Expo Go compatível em:
https://expo.dev/go?sdkVersion=54&platform=android&device=true

Conecte computador e celular à mesma rede Wi-Fi. Abra `iniciar-celular.cmd` e
escaneie o QR code. Se a rede bloquear, use `npm run tunnel` no terminal preparado;
essa opção pode ser necessário instalar `@expo/ngrok`.
No iPhone, versões anteriores do Expo Go têm disponibilidade limitada.

## Comandos

```sh
npm install
npm run web
npm start
npm test
npm run typecheck
npm run check
npm run format:check
npm run format
```

Git e VS Code já estavam instalados. Node.js 22 LTS e npm estão disponíveis em
uma cópia portátil local na pasta `.tools/`, sem alterar o Windows globalmente.
Em outro computador, instale Node.js 22 com npm e execute `npm install`.
`.tools/`, caches, builds e `node_modules/` não entram no Git.

## Estrutura e tecnologias

React Native 0.81.5, Expo SDK 54, React 19.1, TypeScript, React Navigation,
AsyncStorage, Expo FileSystem, DocumentPicker e Sharing.

As responsabilidades ficam separadas entre telas, componentes, domínio,
armazenamento, estado, serviços e navegação. Veja [a arquitetura](docs/ARQUITETURA.md)
e [o registro de validação](docs/VALIDACAO.md).

## Seus dados

Sem servidor, cadastro ou sincronização. Os dados ficam no aparelho; no navegador,
ficam neste navegador e endereço (inclusive porta). Desinstalar o app ou limpar o
armazenamento pode removê-los. Dados e backups não são criptografados.

Se uma leitura falhar, o app preserva o conteúdo existente e permite copiá-lo.
Não limpe os dados para resolver um erro sem antes guardar um backup.

## Origem e entrega acadêmica

Desenvolvido a partir do template exigido pelo professor:
https://github.com/isaalexandre10/projetoFinal

O histórico original foi preservado. O repositório da dupla no GitHub, a documentação
acadêmica completa e a apresentação ainda são etapas separadas. Esta versão não
faz integração bancária ou pagamentos reais: ela registra as operações informadas.
