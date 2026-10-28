import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootParams } from '../navigation/types';
import {
  Button,
  Card,
  Chips,
  ErrorText,
  Field,
  messageOf,
  Page,
  useFeedback,
} from '../components/ui';
import { useTheme } from '../state/ThemeContext';
import { useFinance } from '../state/FinanceContext';
import { ImportChoice, importStatement, parseStatement } from '../domain/statements';
import { cycleForDate } from '../domain/billing';
import { today, money, displayDate } from '../domain/finance';
import { pickStatement } from '../services/statementFile';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';

export default function ImportStatementScreen({
  navigation,
}: NativeStackScreenProps<RootParams, 'ImportStatement'>) {
  const { data, commit, saving } = useFinance();
  const { styles, colors } = useTheme();
  const { confirm, notify } = useFeedback();
  const [mode, setMode] = useState<'cash' | 'credit'>('cash');
  const [destination, setDestination] = useState(data.cashAccounts[0].id);
  const [invoiceMonth, setInvoiceMonth] = useState(
    cycleForDate(today(), data.cards[0]?.closingDay),
  );
  const [choices, setChoices] = useState<ImportChoice[]>([]);
  const [name, setName] = useState('');
  const [raw, setRaw] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [limit, setLimit] = useState(30);
  const allowLeave = useUnsavedChanges(choices.length > 0, saving || working);
  const update = (key: string, value: Partial<ImportChoice>) =>
    setChoices((all) => all.map((c) => (c.row.key === key ? { ...c, ...value } : c)));
  const prepare = (contents: string, fileName: string) => {
    if (!destination) throw new Error('Cadastre e selecione a conta ou o cartão de destino.');
    const rows = parseStatement(
      contents,
      `${mode}:${destination}:${mode === 'credit' ? invoiceMonth : ''}`,
      mode,
    );
    setChoices(
      rows.map((row) => ({
        row,
        action:
          (mode === 'credit' && row.type === 'income') ||
          data.transactions.some(
            (t) =>
              t.importKey !== row.key &&
              t.date === row.date &&
              t.amount === row.amount &&
              t.type === row.type &&
              (mode === 'cash' ? t.cashAccountId === destination : t.cardId === destination) &&
              t.title.trim().toLocaleLowerCase('pt-BR') ===
                row.title.trim().toLocaleLowerCase('pt-BR'),
          )
            ? 'ignore'
            : 'normal',
      })),
    );
    setName(fileName);
    setLimit(30);
  };
  const load = async () => {
    setError('');
    setWorking(true);
    try {
      const file = await pickStatement();
      if (file) prepare(file.raw, file.name);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setWorking(false);
    }
  };
  const known = new Set(data.transactions.filter((t) => t.importKey).map((t) => t.importKey));
  const selected = choices.filter((c) => c.action !== 'ignore' && !known.has(c.row.key));
  const save = async () => {
    setError('');
    try {
      const preview = importStatement(data, choices, {
        account: mode,
        id: destination,
        billMonth: mode === 'credit' ? invoiceMonth : undefined,
      });
      if (
        !(await confirm({
          title: 'Importar movimentações?',
          message: `${preview.added} registro(s) serão adicionados em ${mode === 'cash' ? data.cashAccounts.find((a) => a.id === destination)?.name : data.cards.find((a) => a.id === destination)?.name}. Confira valores, categorias e pagamentos na prévia. O estado atual será preservado em backup.`,
          accept: 'Importar registros',
        }))
      )
        return;
      await commit(
        (current) =>
          importStatement(current, choices, {
            account: mode,
            id: destination,
            billMonth: mode === 'credit' ? invoiceMonth : undefined,
          }).data,
        true,
      );
      allowLeave();
      notify(`${preview.added} registro(s) importados.`);
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page
      title="Importar extrato"
      subtitle="CSV ou OFX · arquivos lidos somente neste aparelho"
      back={() => navigation.goBack()}
    >
      {!choices.length ? (
        <>
          <Card>
            <Text style={styles.subtitle}>De onde vêm os registros?</Text>
            <Chips
              value={mode}
              onChange={(v) => {
                setMode(v);
                setDestination(v === 'cash' ? data.cashAccounts[0].id : (data.cards[0]?.id ?? ''));
              }}
              options={[
                { value: 'cash', label: 'Extrato da conta' },
                { value: 'credit', label: 'Compras do cartão' },
              ]}
            />
            <Chips
              value={destination}
              onChange={setDestination}
              options={(mode === 'cash' ? data.cashAccounts : data.cards).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
            {mode === 'credit' && (
              <Field
                label="Mês do fechamento desta fatura (AAAA-MM)"
                value={invoiceMonth}
                onChangeText={setInvoiceMonth}
                maxLength={7}
                hint="As linhas importadas pertencem a esta fatura, mesmo quando o banco mantém a data original da compra parcelada."
              />
            )}
            {mode === 'credit' && (
              <Text style={styles.small}>
                CSV do cartão: valores positivos são compras; negativos (pagamentos/estornos) ficam
                desmarcados. OFX usa o sinal bancário. O arquivo contém as parcelas já lançadas pelo
                banco, não o total de uma nova compra em 12x.
              </Text>
            )}
            <Button
              label={working ? 'Lendo arquivo…' : 'Selecionar CSV ou OFX'}
              onPress={load}
              disabled={working || saving}
            />
          </Card>
          <Card>
            <Text style={styles.subtitle}>Nubank e Inter</Text>
            <Text style={styles.body}>
              Exporte o extrato da conta ou a fatura no aplicativo do banco e escolha o arquivo
              aqui. Prefira OFX para manter os identificadores das movimentações. CSV deve conter
              Data, Descrição e Valor.
            </Text>
            <Text style={styles.small}>
              Não há conexão automática com o banco nesta versão. Não informe senha bancária. PDF
              não é aceito.
            </Text>
          </Card>
          <Button
            label={showPaste ? 'Ocultar texto' : 'Colar conteúdo CSV/OFX'}
            variant="secondary"
            onPress={() => setShowPaste(!showPaste)}
          />
          {showPaste && (
            <>
              <Field
                label="Conteúdo do extrato"
                value={raw}
                onChangeText={setRaw}
                multiline
                maxLength={2000000}
              />
              <Button
                label="Gerar prévia"
                onPress={() => {
                  setError('');
                  try {
                    prepare(raw, 'Texto colado');
                  } catch (e) {
                    setError(messageOf(e));
                  }
                }}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Card>
            <Text style={styles.subtitle}>{name}</Text>
            <Text style={styles.body}>
              {selected.length} selecionado(s) ·{' '}
              {choices.filter((c) => known.has(c.row.key)).length} já importado(s)
            </Text>
            <Text style={styles.small}>
              Revise faturas e transferências entre suas contas. Ignore transferências que já foram
              registradas no app. Se o saldo inicial já incluía o período do extrato, ajuste-o para
              não somar o dinheiro duas vezes.
            </Text>
            <Text style={styles.small}>
              Duplicidade é conferida pelo identificador ou pelo conteúdo do arquivo. Um lançamento
              manual semelhante aparece como possível repetição para você revisar.
            </Text>
            <Button
              label="Escolher outro arquivo"
              variant="secondary"
              onPress={() => setChoices([])}
            />
          </Card>
          {choices.slice(0, limit).map((choice) => {
            const r = choice.row,
              duplicate = known.has(r.key),
              possible = data.transactions.some(
                (t) =>
                  t.importKey !== r.key &&
                  t.date === r.date &&
                  t.amount === r.amount &&
                  t.type === r.type &&
                  (mode === 'cash' ? t.cashAccountId === destination : t.cardId === destination),
              );
            return (
              <Card key={r.key}>
                <View style={styles.between}>
                  <Text style={[styles.subtitle, { flex: 1 }]}>{r.title}</Text>
                  <Text style={styles.subtitle}>
                    {r.type === 'income' ? '+' : '−'} {money(r.amount)}
                  </Text>
                </View>
                <Text style={styles.small}>
                  {displayDate(r.date)} · {r.type === 'income' ? 'Entrada' : 'Saída'}
                </Text>
                {duplicate ? (
                  <Text style={{ color: colors.accent }}>Já importado — será ignorado.</Text>
                ) : (
                  <>
                    {possible && (
                      <Text style={{ color: colors.red }}>
                        Possível repetição de um lançamento existente. Confira antes de importar.
                      </Text>
                    )}
                    <Chips
                      value={choice.action}
                      onChange={(action) => update(r.key, { action })}
                      options={[
                        { value: 'normal', label: 'Importar' },
                        { value: 'ignore', label: 'Ignorar' },
                        ...(mode === 'cash' && r.type === 'expense'
                          ? [{ value: 'invoice' as const, label: 'Pagamento de fatura' }]
                          : []),
                      ]}
                    />
                    {choice.action === 'normal' && (
                      <Chips
                        value={
                          choice.categoryId ??
                          (r.type === 'income' ? 'income-general' : 'expense-general')
                        }
                        onChange={(categoryId) => update(r.key, { categoryId })}
                        options={data.categories
                          .filter((c) => c.type === r.type && !c.id.startsWith('payment-'))
                          .map((c) => ({ value: c.id, label: c.name }))}
                      />
                    )}
                    {choice.action === 'invoice' && (
                      <>
                        <Text style={styles.small}>
                          Selecione a fatura que este débito quitou. Isso libera limite sem duplicar
                          o gasto.
                        </Text>
                        <Chips
                          value={choice.cardId ?? ''}
                          onChange={(cardId) => update(r.key, { cardId })}
                          options={data.cards.map((c) => ({ value: c.id, label: c.name }))}
                        />
                        <Field
                          label="Mês da fatura (AAAA-MM)"
                          value={choice.billMonth ?? ''}
                          onChangeText={(billMonth) => update(r.key, { billMonth })}
                          maxLength={7}
                          hint="Deixe vazio para abater das faturas mais antigas."
                        />
                      </>
                    )}
                  </>
                )}
              </Card>
            );
          })}
          {choices.length > limit && (
            <Button
              label="Mostrar mais registros"
              variant="secondary"
              onPress={() => setLimit((v) => v + 30)}
            />
          )}
          <Button
            label={saving ? 'Importando…' : `Importar ${selected.length} registro(s)`}
            disabled={saving || !selected.length}
            onPress={save}
          />
        </>
      )}
      <ErrorText message={error} />
    </Page>
  );
}
