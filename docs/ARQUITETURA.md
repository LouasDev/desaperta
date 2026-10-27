# Organização do Desaperta

## Responsabilidades

- `src/domain/finance.ts`: modelos, regras financeiras, cálculos e validação de backups. Não depende de React Native.
- `src/storage/snapshotRepository.ts`: leitura e gravação de um snapshot versionado, com adaptador substituível nos testes.
- `src/storage/repository.ts`: conecta o repositório ao AsyncStorage.
- `src/state/FinanceContext.tsx`: carrega os registros, serializa as operações de escrita e atualiza a interface somente depois de salvar.
- `src/screens/`: sete telas funcionais, separadas por responsabilidade.
- `src/components/`: botões, campos, cartões, filtros, confirmações e itens reutilizáveis.
- `src/navigation/`: abas, pilha de telas, parâmetros tipados e proteção de formulários não salvos.
- `src/services/backup*`: compartilhamento de arquivos no celular e download/seletor de arquivos na web.
- `src/styles/theme.ts`: cores, espaçamentos e aparência dos cartões.

## Dados e relacionamentos

Todos os IDs são strings. Valores monetários são inteiros em centavos; datas são strings `AAAA-MM-DD`, sem conversão por fuso horário. O backup possui versão de esquema `1`.

```mermaid
erDiagram
  Pessoa ||--o{ Divida : possui
  Divida ||--o{ Pagamento : recebe
  Pagamento o|--|| Movimentacao : gera
  Categoria ||--o{ Movimentacao : classifica
  Pessoa {
    string id PK
    string name
  }
  Divida {
    string id PK
    string personId FK
    string title
    int amount
    string direction
    string dueDate
    string createdAt
  }
  Pagamento {
    string id PK
    string debtId FK
    int amount
    string date
    string transactionId FK
  }
  Movimentacao {
    string id PK
    string categoryId FK
    string paymentId FK
    string title
    int amount
    string type
    string date
  }
  Categoria {
    string id PK
    string name
    string type
  }
```

`direction` é `payable` (eu devo) ou `receivable` (me devem). `type` é `income` ou `expense`. `paymentId` é opcional: lançamentos comuns não têm pagamento. As categorias iniciais são fixas nesta versão; pessoas são cadastradas/reutilizadas pelo nome ao salvar pendências.

## Regras importantes

1. Saldo = entradas menos saídas efetivamente registradas. O saldo pode ser negativo.
2. Cadastrar uma pendência não registra a operação inicial de empréstimo nem altera o caixa. Se um empréstimo entrou ou saiu do caixa, sua movimentação inicial deve ser registrada separadamente. Pagamentos posteriores são lançados automaticamente.
3. Cada pagamento gera uma única movimentação vinculada. Os dois registros são persistidos no mesmo snapshot para evitar salvar apenas metade da operação.
4. Desfazer uma baixa remove a movimentação vinculada. Excluir uma dívida remove suas baixas e movimentações, com confirmação que explica o impacto no saldo.
5. Não é permitido pagar além do restante, reduzir o principal abaixo do já pago, inverter o tipo após pagamentos, ou registrar movimentações futuras.
6. Estado e saldo só são atualizados depois da gravação bem-sucedida. Falhas de leitura não criam uma base vazia por cima da existente.
7. A importação valida versão, tamanho, valores, IDs únicos, datas, referências e consistência entre baixas e movimentações. Antes de restaurar, uma cópia do estado atual é guardada em uma chave separada.
8. A checagem de snapshot detecta uma janela desatualizada antes da gravação. Use uma janela por vez para editar; AsyncStorage não oferece transações entre processos.

## Limites desta versão

- Apenas reais (BRL), sem juros, contas bancárias, parcelas automáticas ou sincronização.
- Valores individuais entre R$ 0,01 e R$ 9.999.999,99; datas entre 2000 e 2100.
- Até 10 mil registros por entidade e snapshot de até 5 milhões de caracteres. Para uso cotidiano pequeno, sem banco remoto.
- Dados e backups não criptografados. Não armazene senhas, números de cartão ou documentos no app.
- No navegador, cada combinação de endereço/porta tem dados separados.
- Builds Android foram verificadas por compilação do bundle; teclado, seletor de arquivos e compartilhamento nativos ainda precisam de teste em um aparelho físico.

## Manutenção

Abra `terminal.cmd` ou o terminal configurado do VS Code. Rode `npm test`, `npm run typecheck`, `npm run check` e `npm run format:check` antes de alterar a versão. Ao mudar o esquema, mantenha um leitor/migração da versão anterior antes de subir o número da versão. Nunca ignore falha de leitura salvando uma base vazia automaticamente.
