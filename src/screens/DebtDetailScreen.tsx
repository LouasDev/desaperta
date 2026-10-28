import { CashAccountPicker } from '../components/CashAccountPicker';
import React, { useState } from 'react';
import { Linking, Share, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import {
  addPayment,
  debtStatus,
  deleteDebt,
  deletePayment,
  displayDate,
  inputMoney,
  money,
  paidAmount,
  parseDate,
  parseMoney,
  remaining,
  today,
} from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { personSummary, whatsappURL } from '../domain/planning';
export default function DebtDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'DebtDetail'>) {
  const { colors, styles, clay } = useTheme();
  const { data, commit, saving } = useFinance();
  const { notify, confirm } = useFeedback();
  const debt = data.debts.find((d) => d.id === route.params.id);
  const [cashAccountId, setCashAccountId] = useState(data.cashAccounts[0].id);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(displayDate(today()));
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);
  const [showSummary, setShowSummary] = useState(false);
  if (!debt)
    return (
      <Page title="Registro não encontrado" back={() => navigation.goBack()}>
        <Text style={styles.body}>Esta pendência não está mais disponível.</Text>
      </Page>
    );
  const rest = remaining(data, debt),
    paid = paidAmount(data, debt.id),
    incoming = debt.direction === 'receivable';
  const payments = data.payments
    .filter((p) => p.debtId === debt.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const person = data.people.find((p) => p.id === debt.personId)!;
  const summary = personSummary(data, person.id);
  const openWhatsApp = async () => {
    setError('');
    try {
      if (!person.phone) throw new Error('Edite a pendência e cadastre o WhatsApp da pessoa.');
      await Linking.openURL(whatsappURL(person.phone, summary));
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const pay = async () => {
    setError('');
    try {
      const cents = parseMoney(amount),
        iso = parseDate(date, false);
      if (cents > rest) throw new Error('O valor não pode ultrapassar o que falta pagar.');
      if (
        !(await confirm({
          title: incoming ? 'Confirmar recebimento?' : 'Confirmar pagamento?',
          message: `${money(cents)} ${incoming ? 'serão somados ao' : 'serão descontados do'} saldo e abatidos desta pendência. Registre apenas dinheiro que já foi ${incoming ? 'recebido' : 'pago'}.`,
          accept: incoming ? 'Confirmar recebimento' : 'Confirmar pagamento',
        }))
      )
        return;
      await commit((current) => addPayment(current, debt.id, cents, iso, cashAccountId));
      setAmount('');
      notify(
        incoming ? 'Recebimento salvo e saldo atualizado.' : 'Pagamento salvo e saldo atualizado.',
      );
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const undo = async (paymentId: string) => {
    if (
      !(await confirm({
        title: 'Desfazer este registro?',
        message:
          'A baixa e sua movimentação de caixa serão removidas juntas. O saldo e o valor pendente serão recalculados.',
        accept: 'Desfazer registro',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => deletePayment(current, paymentId));
      notify('Registro desfeito e saldo recalculado.');
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const remove = async () => {
    if (
      !(await confirm({
        title: 'Excluir esta pendência?',
        message: `A pendência e seus ${payments.length} pagamento(s)/recebimento(s) serão excluídos, incluindo as movimentações vinculadas. Isso recalcula seu saldo. Para manter o histórico, deixe o registro como quitado.`,
        accept: 'Excluir tudo deste registro',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => deleteDebt(current, debt.id));
      notify('Pendência e registros vinculados excluídos.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page
      title={data.people.find((p) => p.id === debt.personId)?.name ?? 'Pendência'}
      subtitle={debt.title}
      back={() => navigation.goBack()}
    >
      <Card>
        <View style={styles.between}>
          <Text style={styles.eyebrow}>{incoming ? 'Me devem' : 'Eu devo'}</Text>
          <Text
            style={{
              fontWeight: '700',
              color: debtStatus(data, debt) === 'Atrasado' ? colors.red : colors.ink,
            }}
          >
            {debtStatus(data, debt)}
          </Text>
        </View>
        <Text style={styles.body}>
          {rest === 0 ? 'Pendência quitada' : incoming ? 'Falta receber' : 'Falta pagar'}
        </Text>
        <Text
          style={{
            fontSize: 36,
            color: colors.ink,
            fontWeight: '500',
            letterSpacing: -1,
            fontVariant: ['tabular-nums'],
          }}
        >
          {money(rest)}
        </Text>
        <View style={styles.between}>
          <Text style={styles.small}>Total: {money(debt.amount)}</Text>
          <Text style={styles.small}>
            Já {incoming ? 'recebido' : 'pago'}: {money(paid)}
          </Text>
        </View>
        <View
          style={{ height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line }}
        >
          <View
            style={{
              height: 4,
              width: `${(paid / debt.amount) * 100}%`,
              backgroundColor: colors.mintDark,
            }}
          />
        </View>
        <Text style={styles.small}>Vencimento: {displayDate(debt.dueDate)}</Text>
      </Card>
      <Button
        label="Editar pendência"
        variant="secondary"
        onPress={() => navigation.navigate('DebtForm', { id: debt.id })}
        disabled={saving}
      />
      <ErrorText message={error} />
      <Card>
        <Text style={styles.subtitle}>Resumo para {person.name}</Text>
        <Text style={styles.body}>
          Inclui todas as pendências em aberto com esta pessoa, descontando os pagamentos já
          registrados.
        </Text>
        <Button
          label={showSummary ? 'Ocultar resumo' : 'Revisar resumo da pessoa'}
          variant="secondary"
          onPress={() => setShowSummary((value) => !value)}
        />
        {showSummary && (
          <View
            style={{
              padding: 16,
              backgroundColor: colors.input,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text selectable style={[styles.body, { color: colors.ink, fontSize: 13 }]}>
              {summary}
            </Text>
          </View>
        )}
        <Button label="Abrir mensagem no WhatsApp" onPress={openWhatsApp} />
        <Button
          label="Compartilhar resumo"
          variant="secondary"
          onPress={async () => {
            try {
              await Share.share({ title: `Resumo para ${person.name}`, message: summary });
            } catch (e) {
              setError(messageOf(e));
            }
          }}
        />
        <Text style={styles.small}>
          {person.phone
            ? `Destino: +${person.phone}. `
            : 'Cadastre o telefone em Editar pendência. '}
          O texto abre na conversa; você revisa e envia no WhatsApp.
        </Text>
      </Card>
      {rest > 0 && (
        <Card>
          <Text style={styles.subtitle}>
            {incoming ? 'Registrar recebimento' : 'Registrar pagamento'}
          </Text>
          <Text style={styles.body}>Informe o valor recebido ou pago, total ou parcial.</Text>
          <CashAccountPicker
            label="Conta do pagamento ou recebimento"
            value={cashAccountId}
            onChange={setCashAccountId}
          />
          <Field
            label={incoming ? 'Valor recebido (R$) *' : 'Valor pago (R$) *'}
            placeholder="0,00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            maxLength={20}
          />
          <Button
            label={`Preencher restante: ${money(rest)}`}
            variant="secondary"
            compact
            onPress={() => setAmount(inputMoney(rest))}
          />
          <Field
            label="Data do registro *"
            value={date}
            onChangeText={setDate}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            keyboardType="numbers-and-punctuation"
          />
          <Button
            label={
              saving ? 'Salvando…' : incoming ? 'Registrar recebimento' : 'Registrar pagamento'
            }
            disabled={saving}
            onPress={pay}
          />
          <Text style={styles.small}>
            Este registro também gera uma {incoming ? 'entrada' : 'saída'} nas movimentações. Não
            lance o mesmo valor novamente.
          </Text>
        </Card>
      )}
      <Text style={styles.subtitle}>Histórico de {incoming ? 'recebimentos' : 'pagamentos'}</Text>
      {payments.length ? (
        payments.slice(0, limit).map((payment) => (
          <Card key={payment.id}>
            <View style={styles.between}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.subtitle}>{money(payment.amount)}</Text>
                <Text style={styles.small}>{displayDate(payment.date)}</Text>
              </View>
              <Button
                label="Desfazer"
                compact
                variant="secondary"
                disabled={saving}
                onPress={() => undo(payment.id)}
              />
            </View>
          </Card>
        ))
      ) : (
        <Text style={styles.body}>
          Nenhum registro ainda. Quando você registrar um valor, ele aparece aqui.
        </Text>
      )}
      {payments.length > limit && (
        <Button label="Mostrar mais" variant="secondary" onPress={() => setLimit((v) => v + 20)} />
      )}
      <Button label="Excluir pendência" variant="danger" disabled={saving} onPress={remove} />
    </Page>
  );
}
