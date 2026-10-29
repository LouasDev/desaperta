# Desaperta

App de organização financeira para adolescentes: acompanhe o dinheiro que entra,
o que sai, para quem você deve e quem deve para você. Interface em grafite e roxo,
com temas claro/escuro, ícones de traço e navegação por áreas.

## O que já funciona

- Atualizações compatíveis sem APK pelo EAS Update, com busca manual em Ajustes.
- Resumo do WhatsApp organizado por pessoa, itens, pagamentos e saldo líquido.

- Assistente inicial com várias contas, vários cartões e revisão antes de salvar.
- Compras em até 60 parcelas, faturas mensais, fechamento, vencimento e limite comprometido por parcelas futuras.
- Importação local de CSV/OFX, com prévia, categorias, pagamentos de fatura e proteção contra reimportação.
- Lembretes locais de fechamento e vencimento no Android, ativados em Ajustes.

- Várias contas com saldos próprios, extrato e transferência interna sem duplicar receitas ou gastos.
- Vários cartões com barras individuais de limite utilizado, valores disponíveis e aviso de excesso.
- Configuração inicial com saldo em conta, limite do cartão e gastos anteriores.
- Cartões com compras no crédito, limite disponível e pagamento de fatura sem duplicar despesas.
- Gastos e entradas recorrentes mensais, com confirmação das ocorrências realizadas.
- Metas mensais de gastos e entradas por categoria, com progresso automático.
- Telefone da pessoa, resumo das pendências e mensagem preenchida no WhatsApp.
- Tema claro, escuro ou do sistema, com preferência salva no aparelho.
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

Veja [como publicar e receber atualizações](docs/ATUALIZACOES.md).

Para instalar no celular Android sem Expo Go, consulte [instalação do APK e compilação local](docs/ANDROID.md).

1. Abra `scripts\\windows\\iniciar-web.cmd` para usar no navegador.
2. Para desenvolver, abra esta pasta no VS Code. O terminal desta pasta já tem
   Node e npm configurados. Você também pode abrir `scripts\\windows\\terminal.cmd`.
3. Preencha a **Configuração inicial** com o saldo que você já tem e, se usar crédito,
   o limite total e os gastos anteriores ainda não pagos. Se já registrou o saldo
   inicial como uma entrada, use zero para não duplicar.
4. Registre receitas, despesas e compromissos. Em cada pendência, registre os
   pagamentos/recebimentos que realmente aconteceram.
5. Em **Ajustes**, acesse cartões, metas, recorrências, aparência e backups.

Veja primeiro [faturas, parcelas e importação na versão 1.3](docs/changelog/VERSAO-1.3.md).

Veja [contas e barras de limite na versão 1.2](docs/changelog/VERSAO-1.2.md) e [as instruções da versão 1.1](docs/changelog/VERSAO-1.1.md) para entender compras no crédito,
pagamento de fatura, metas e previsões recorrentes. O saldo só muda com operações
confirmadas; o app não realiza pagamentos bancários. A mensagem do WhatsApp abre
preenchida para você revisar e enviar.

Uma dívida a receber não entra no saldo antes de ser recebida. Ao registrar uma
baixa, o app cria sua movimentação automaticamente; não registre o mesmo valor
novamente. Se o empréstimo original entrou ou saiu do seu caixa, registre essa
operação inicial separadamente.

## Executar no celular

O projeto usa **Expo SDK 54**, conforme o template do professor. No Android,
instale o Expo Go compatível em:
https://expo.dev/go?sdkVersion=54&platform=android&device=true

Conecte computador e celular à mesma rede Wi-Fi. Abra `scripts\\windows\\iniciar-celular.cmd` e
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

O histórico original foi preservado. Repositório do projeto:
https://github.com/LouasDev/desaperta

Consulte a [documentação completa do projeto](docs/DOCUMENTACAO.md) para objetivo, escopo,
funcionalidades, arquitetura, privacidade, validação e limitações. Esta versão não faz integração
bancária automática nem pagamentos reais: ela registra as operações informadas.
