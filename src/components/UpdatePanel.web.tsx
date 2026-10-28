import React from 'react';
import { Text } from 'react-native';
import { Card } from './ui';
import { useTheme } from '../state/ThemeContext';
export function UpdatePanel() {
  const { styles } = useTheme();
  return (
    <Card>
      <Text style={styles.subtitle}>Atualizações do app</Text>
      <Text style={styles.body}>
        No navegador, recarregue a página para ver a versão publicada. No Android instalado, as
        melhorias compatíveis são baixadas pelo canal de atualizações.
      </Text>
      <Text style={styles.small}>
        Telas e regras podem ser atualizadas sem APK. Novos recursos nativos ainda exigem um
        instalador.
      </Text>
    </Card>
  );
}
