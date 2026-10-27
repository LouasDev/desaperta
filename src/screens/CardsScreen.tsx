import React from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Empty, Page } from '../components/ui';
import { CreditUsage } from '../components/CreditUsage';
import { cardTotals } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
export default function CardsScreen({ navigation }: NativeStackScreenProps<RootParams, 'Cards'>) {
  const { data } = useFinance();
  return (
    <Page title="Cartões" back={() => navigation.goBack()}>
      <Button label="+ Adicionar cartão" onPress={() => navigation.navigate('CardForm')} />
      {data.cards.length ? (
        data.cards.map((card) => (
          <Card key={card.id}>
            <CreditUsage card={card} used={cardTotals(data, card.id).outstanding} />
            <Button
              label={`Ver gastos de ${card.name}`}
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
        ))
      ) : (
        <Empty
          title="Nenhum cartão cadastrado"
          body="Adicione quantos cartões você usa. Cada um tem limite e gastos separados."
        />
      )}
    </Page>
  );
}
