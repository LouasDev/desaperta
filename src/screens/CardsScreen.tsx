import React from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Empty, Page } from '../components/ui';
import { money } from '../domain/finance';
import { cardTotals } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function CardsScreen({ navigation }: NativeStackScreenProps<RootParams, 'Cards'>) {
  const { data } = useFinance();
  const { styles, colors } = useTheme();
  return (
    <Page title="Cartões" back={() => navigation.goBack()}>
      <Button label="+ Adicionar cartão" onPress={() => navigation.navigate('CardForm')} />
      {data.cards.length ? (
        data.cards.map((card) => {
          const summary = cardTotals(data, card.id);
          return (
            <Card key={card.id}>
              <Text style={styles.subtitle}>{card.name}</Text>
              <View style={styles.between}>
                <View style={{ gap: 6 }}>
                  <Text style={styles.small}>Crédito disponível</Text>
                  <Text
                    style={[
                      styles.title,
                      { color: summary.available < 0 ? colors.red : colors.ink },
                    ]}
                  >
                    {money(summary.available)}
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={styles.small}>Gastos a pagar</Text>
                  <Text style={styles.subtitle}>{money(summary.outstanding)}</Text>
                </View>
              </View>
              <Text style={styles.small}>Limite total: {money(card.limit)}</Text>
              <Button
                label="Ver gastos e pagar fatura"
                variant="secondary"
                onPress={() => navigation.navigate('CardDetail', { id: card.id })}
              />
              <Button
                label="Registrar gasto no cartão"
                onPress={() =>
                  navigation.navigate('TransactionForm', { type: 'expense', cardId: card.id })
                }
              />
            </Card>
          );
        })
      ) : (
        <Empty
          title="Nenhum cartão cadastrado"
          body="Cadastre o limite e os gastos já existentes para acompanhar seu crédito."
        />
      )}
    </Page>
  );
}
