import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, messageOf, Page } from '../components/ui';
import { configureMany } from '../domain/purchases';
import { signedMoney, moneyOrZero } from '../domain/formValues';
import { id, inputMoney, money, parseMoney, today } from '../domain/finance';
import { cycleForDate } from '../domain/billing';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function OnboardingScreen() {
  const { data, commit, saving } = useFinance();
  const { styles, colors } = useTheme();
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState(() =>
    data.cashAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: inputMoney(a.openingBalance),
    })),
  );
  const [cards, setCards] = useState(() =>
    data.cards.map((c) => ({
      id: c.id,
      name: c.name,
      limitValue: inputMoney(c.limit),
      used: inputMoney(c.openingUsed),
      closing: String(c.closingDay ?? 25),
      due: String(c.dueDay ?? 5),
      openingMonth: c.openingBillMonth ?? today().slice(0, 7),
    })),
  );
  const [error, setError] = useState('');
  const accountValues = () =>
    accounts.map((a) => ({ id: a.id, name: a.name, openingBalance: signedMoney(a.balance) }));
  const cardValues = () =>
    cards.map((c) => ({
      id: c.id,
      name: c.name,
      limit: parseMoney(c.limitValue),
      openingUsed: moneyOrZero(c.used),
      closingDay: Number(c.closing),
      dueDay: Number(c.due),
      openingBillMonth: c.openingMonth || cycleForDate(today(), Number(c.closing)),
    }));
  const advance = async () => {
    setError('');
    try {
      const next = configureMany(data, accountValues(), step === 0 ? [] : cardValues());
      if (step === 2) await commit(() => next);
      else setStep((value) => value + 1);
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page
      title="Sua vida financeira"
      subtitle="Monte seu ponto de partida. Você poderá ajustar tudo depois."
    >
      <View style={styles.row}>
        {['Contas', 'Cartões', 'Revisão'].map((label, index) => (
          <View key={label} style={{ flex: 1, gap: 8 }}>
            <View
              style={{ height: 3, backgroundColor: index <= step ? colors.accent : colors.line }}
            />
            <Text style={[styles.small, { color: index === step ? colors.accent : colors.muted }]}>
              {index + 1}. {label}
            </Text>
          </View>
        ))}
      </View>
      {step === 0 && (
        <>
          <Text style={styles.subtitle}>Onde seu dinheiro está?</Text>
          {accounts.map((account, index) => (
            <Card key={account.id}>
              <Text style={styles.eyebrow}>CONTA {index + 1}</Text>
              <Field
                label={`Nome da conta ${index + 1} *`}
                value={account.name}
                onChangeText={(name) =>
                  setAccounts((all) => all.map((a) => (a.id === account.id ? { ...a, name } : a)))
                }
                placeholder="Ex.: Nubank, Inter ou Carteira"
              />
              <Field
                label={`Saldo da conta ${index + 1} (R$)`}
                value={account.balance}
                onChangeText={(balance) =>
                  setAccounts((all) =>
                    all.map((a) => (a.id === account.id ? { ...a, balance } : a)),
                  )
                }
                keyboardType="numbers-and-punctuation"
                hint="Saldo que você já tem. Pode ser negativo. Não repita como uma entrada."
              />
              {accounts.length > 1 &&
                !data.transactions.some((t) => t.cashAccountId === account.id) && (
                  <Button
                    label={`Remover conta ${index + 1}`}
                    variant="secondary"
                    onPress={() => setAccounts((all) => all.filter((a) => a.id !== account.id))}
                  />
                )}
            </Card>
          ))}
          <Button
            label="+ Adicionar outra conta"
            variant="secondary"
            disabled={accounts.length >= 20}
            onPress={() => setAccounts((all) => [...all, { id: id(), name: '', balance: '0,00' }])}
          />
        </>
      )}
      {step === 1 && (
        <>
          <Text style={styles.subtitle}>Seus cartões de crédito</Text>
          {!cards.length && (
            <Card>
              <Text style={styles.body}>
                Você pode cadastrar vários cartões ou continuar sem cartão.
              </Text>
            </Card>
          )}
          {cards.map((card, index) => {
            const update = (value: Partial<typeof card>) =>
              setCards((all) => all.map((c) => (c.id === card.id ? { ...c, ...value } : c)));
            return (
              <Card key={card.id}>
                <Text style={styles.eyebrow}>CARTÃO {index + 1}</Text>
                <Field
                  label={`Nome do cartão ${index + 1} *`}
                  value={card.name}
                  onChangeText={(name) => update({ name })}
                  placeholder="Ex.: Nubank ou Inter"
                />
                <Field
                  label={`Limite do cartão ${index + 1} (R$) *`}
                  value={card.limitValue}
                  onChangeText={(limitValue) => update({ limitValue })}
                  keyboardType="decimal-pad"
                />
                <Field
                  label={`Gastos anteriores do cartão ${index + 1} (R$)`}
                  value={card.used}
                  onChangeText={(used) => update({ used })}
                  keyboardType="decimal-pad"
                  hint="Total já comprometido e não pago. Para distribuir parcelas antigas por mês, cadastre as compras depois e deixe zero aqui."
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Dia do fechamento *"
                      value={card.closing}
                      onChangeText={(closing) => update({ closing })}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Dia do vencimento *"
                      value={card.due}
                      onChangeText={(due) => update({ due })}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
                <Field
                  label="Fatura dos gastos anteriores (AAAA-MM)"
                  value={card.openingMonth}
                  onChangeText={(openingMonth) => update({ openingMonth })}
                  maxLength={7}
                  hint="Mês do fechamento da fatura desse saldo anterior."
                />
                <Button
                  label={`Remover cartão ${index + 1}`}
                  variant="secondary"
                  onPress={() => setCards((all) => all.filter((c) => c.id !== card.id))}
                />
              </Card>
            );
          })}
          <Button
            label="+ Adicionar cartão"
            variant="secondary"
            disabled={cards.length >= 20}
            onPress={() =>
              setCards((all) => [
                ...all,
                {
                  id: id(),
                  name: '',
                  limitValue: '',
                  used: '0,00',
                  closing: '25',
                  due: '5',
                  openingMonth: cycleForDate(today(), 25),
                },
              ])
            }
          />
          <Text style={styles.small}>
            Compras no dia do fechamento entram no próximo ciclo. Confira os dias no app do seu
            banco.
          </Text>
        </>
      )}
      {step === 2 && (
        <Card>
          <Text style={styles.subtitle}>Confira antes de começar</Text>
          {accounts.map((a) => (
            <View key={a.id} style={styles.between}>
              <Text style={styles.body}>{a.name}</Text>
              <Text style={styles.subtitle}>{money(signedMoney(a.balance))}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          {cards.length ? (
            cards.map((c) => (
              <View key={c.id} style={{ gap: 4 }}>
                <Text style={styles.subtitle}>{c.name}</Text>
                <Text style={styles.body}>
                  Limite {money(parseMoney(c.limitValue))} · já usado {money(moneyOrZero(c.used))}
                </Text>
                <Text style={styles.small}>
                  Fecha dia {c.closing} · vence dia {c.due}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>Sem cartões por enquanto.</Text>
          )}
          <Text style={styles.small}>
            Limite de crédito não é saldo em conta. Seus dados ficam neste aparelho.
          </Text>
        </Card>
      )}
      <ErrorText message={error} />
      <Button
        label={saving ? 'Salvando…' : step === 2 ? 'Começar a usar' : 'Continuar'}
        disabled={saving}
        onPress={advance}
      />
      {step > 0 && (
        <Button
          label="Voltar"
          variant="secondary"
          disabled={saving}
          onPress={() => {
            setError('');
            setStep((s) => s - 1);
          }}
        />
      )}
    </Page>
  );
}
