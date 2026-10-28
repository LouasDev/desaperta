import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParams } from '../navigation/types';
import { Card, Page } from '../components/ui';
import { MenuRow } from '../components/MenuRow';
export default function MoreScreen() {
  const n = useNavigation<NativeStackNavigationProp<RootParams>>();
  return (
    <Page title="Mais controle" subtitle="Planejamento, pendências e preferências.">
      <Card style={{ gap: 0 }}>
        <MenuRow
          icon="people"
          title="Pendências"
          description="Eu devo · Me devem · WhatsApp"
          onPress={() => n.navigate('Main', { screen: 'Debts' })}
        />
        <MenuRow
          icon="target"
          title="Metas"
          description="Limites de gastos e objetivos de entrada"
          onPress={() => n.navigate('Goals')}
        />
        <MenuRow
          icon="repeat"
          title="Recorrências"
          description="Assinaturas, contas fixas e entradas mensais"
          onPress={() => n.navigate('Recurrences')}
        />
        <MenuRow
          icon="activity"
          title="Importar extrato"
          description="Nubank, Inter e arquivos CSV/OFX compatíveis"
          onPress={() => n.navigate('ImportStatement')}
        />
        <MenuRow
          icon="settings"
          title="Ajustes"
          description="Lembretes, aparência, dados e backups"
          onPress={() => n.navigate('Main', { screen: 'Settings' })}
        />
      </Card>
    </Page>
  );
}
