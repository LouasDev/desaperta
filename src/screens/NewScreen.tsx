import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParams } from '../navigation/types';
import { Card, Page } from '../components/ui';
import { MenuRow } from '../components/MenuRow';
import { useFinance } from '../state/FinanceContext';
export default function NewScreen() {
  const n = useNavigation<NativeStackNavigationProp<RootParams>>();
  const { data } = useFinance();
  return (
    <Page title="O que aconteceu?" subtitle="Escolha a operação que deseja registrar.">
      <Card style={{ gap: 0 }}>
        <MenuRow
          icon="in"
          title="Entrada"
          description="Salário, mesada ou outro recebimento"
          onPress={() => n.navigate('TransactionForm', { type: 'income' })}
        />
        <MenuRow
          icon="out"
          title="Saída da conta"
          description="Pix, débito, dinheiro ou outro gasto"
          onPress={() => n.navigate('TransactionForm', { type: 'expense' })}
        />
        <MenuRow
          icon="card"
          title="Compra no cartão"
          description="À vista ou parcelada, com faturas futuras"
          onPress={() =>
            data.cards.length
              ? n.navigate('TransactionForm', { type: 'expense', cardId: data.cards[0].id })
              : n.navigate('CardForm')
          }
        />
        <MenuRow
          icon="transfer"
          title="Transferir entre contas"
          description="Mova saldo sem duplicar receitas e gastos"
          onPress={() => n.navigate('TransferForm')}
        />
        <MenuRow
          icon="people"
          title="Pendência com alguém"
          description="O que você deve ou tem para receber"
          onPress={() => n.navigate('DebtForm')}
        />
        <MenuRow
          icon="activity"
          title="Importar extrato"
          description="Traga várias movimentações de um CSV ou OFX"
          onPress={() => n.navigate('ImportStatement')}
        />
      </Card>
    </Page>
  );
}
