# Validação da primeira versão funcional

## Versão 1.1 — extensão funcional

- 24 testes automatizados cobrem também configuração inicial, crédito/fatura,
  metas de gastos e entradas, recorrências, preservação do telefone, mensagem
  WhatsApp e migração/backup completo do esquema 2.
- Interface testada em origem separada (`localhost:8084`) com dados fictícios:
  saldo inicial R$ 200, cartão com limite R$ 100 e R$ 50 usados; compra de R$ 20
  deixa R$ 30 disponíveis sem reduzir o saldo; meta de R$ 30 em Alimentação fica
  em R$ 20 (67%).
- Pagar R$ 70 de fatura libera R$ 100 de limite e deixa R$ 130 no saldo em conta,
  mantendo a meta em R$ 20. Confirmar assinatura de R$ 10 e mesada de R$ 50 deixa
  saldo R$ 170, entradas R$ 50 e gastos registrados R$ 30.
- Tema escuro e dados preservados após reabertura. Contraste conferido em 390 × 844.
- Cadastro de telefone e prévia da mensagem conferidos com uma pessoa fictícia;
  nenhum WhatsApp foi enviado durante a validação.
- TypeScript e formatação verificados novamente. O teste físico de teclado,
  compartilhamento, seletor de arquivos e abertura do aplicativo WhatsApp continua
  necessário em aparelho compatível com Expo SDK 54.
- Bundles finais da versão 1.1 exportados com sucesso para web, Android e iOS.
  Após a correção dos atributos dos ícones na web, a reabertura não registrou
  erros novos de renderização no console.

## Histórico da versão 1.0

Data: 27/10/2026. Testes de interface feitos em uma origem separada (`localhost:8083`), com dados fictícios. A origem principal (`localhost:8081`) não recebeu esses cadastros.

## Etapa 1: regras e armazenamento

12 testes automatizados passaram com `npm test`:

- Valores em centavos, formato brasileiro e rejeição de valores inválidos.
- Datas reais, anos bissextos e rejeição de movimentações futuras.
- Cadastro de dívidas sem alterar o saldo e reutilização de pessoas.
- Pagamento parcial, limite do restante e quitação.
- Recebimento e estorno conjunto da baixa e da movimentação.
- Edição de dívida sem reduzir o total abaixo do pago ou inverter seu tipo.
- Exclusão em cascata dos registros vinculados.
- Edição e exclusão de lançamentos com recálculo do saldo.
- Ida e volta de backup e rejeição de referências inconsistentes.
- Recuperação após reabrir e cópia anterior à restauração.
- Falha de escrita preservando o snapshot anterior.
- Leitura corrompida sem sobrescrita e detecção de janela desatualizada.

## Etapa 2: interface e uso real no navegador

- Cadastro vazio rejeitado com mensagem de campo obrigatório.
- Entrada de R$ 500,00 e despesa de R$ 25,50: saldo R$ 474,50.
- Pendência de R$ 100,00 a receber: saldo mantido em R$ 474,50.
- Recebimento parcial de R$ 40,00: saldo R$ 514,50 e restante R$ 60,00.
- Reabertura da página: mesmos valores recuperados do armazenamento.
- Busca por descrição: histórico filtrado para o lançamento correspondente.
- Edição da despesa para R$ 26,00: saldo R$ 514,00.
- Saída de formulário modificado: confirmação apresentada; cancelar mantém os campos.
- Exportação de arquivo JSON e restauração pelo seletor de arquivos concluídas.
- Backup com versão incompatível rejeitado antes de qualquer gravação.
- Atalho “A receber” abre “Me devem”.
- Visual conferido em 1280 × 720 e em 390 × 844, com abas fixas, cartões e formulários.
- Nenhum erro de execução observado nos logs do navegador. Há aviso de depreciação `props.pointerEvents` vindo da navegação/bibliotecas na web, sem interromper os fluxos.

## Etapa 3: verificações de entrega

- TypeScript: `tsc --noEmit` passou.
- Compatibilidade: `expo install --check` informou dependências atualizadas.
- Exportação de bundles web, Android e iOS concluída com `expo export --platform all`.
- Código formatado com Prettier.

## Revisão visual

O visual foi revisto após feedback: fundo neutro, hierarquia tipográfica mais contida,
ícones vetoriais consistentes, menos cartões e remoção das frases decorativas.
Tela inicial e formulário conferidos em 390 × 844. Os controles de entrada e
retorno ao início foram exercitados sem cadastrar dados na origem principal.
As regras financeiras e o armazenamento não foram alterados nesta revisão.

## Próxima validação no aparelho

A compilação dos bundles não substitui teste em dispositivo. Ainda conferir no celular físico:

1. Abrir no Expo Go compatível com SDK 54.
2. Teclado, rolagem, campos e botão Voltar do Android.
3. Cadastrar uma movimentação, encerrar o app e abri-lo novamente.
4. Salvar um arquivo pelo compartilhamento nativo e restaurá-lo pelo seletor.
5. Conferir telas em tamanhos de fonte maiores.

Não foi gerado APK/IPA assinado nesta etapa. O repositório remoto da dupla e a documentação acadêmica completa ainda precisam ser preparados.
