import React, { useState } from 'react';
import { Text } from 'react-native';
import * as Updates from 'expo-updates';
import { Button, Card, ErrorText, messageOf, useFeedback } from './ui';
import { useTheme } from '../state/ThemeContext';
import { useFinance } from '../state/FinanceContext';
export function UpdatePanel() {
  const { styles } = useTheme();
  const { saving } = useFinance();
  const { confirm } = useFeedback();
  const update = Updates.useUpdates();
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const check = async () => {
    setWorking(true);
    setError('');
    setStatus('Buscando melhorias…');
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable || result.isRollBackToEmbedded) {
        setStatus('Baixando atualização…');
        await Updates.fetchUpdateAsync();
        setStatus('Atualização pronta. Reinicie para aplicar.');
      } else setStatus('Você já está usando a versão mais recente disponível.');
    } catch (e) {
      setStatus(
        'Não foi possível consultar agora. O app continua funcionando com a versão instalada.',
      );
      setError(messageOf(e));
    } finally {
      setWorking(false);
    }
  };
  const apply = async () => {
    if (saving) return;
    if (
      !(await confirm({
        title: 'Aplicar atualização?',
        message:
          'O app será reiniciado. Os registros já salvos serão mantidos. Termine qualquer preenchimento antes de continuar.',
        accept: 'Atualizar e reiniciar',
      }))
    )
      return;
    try {
      await Updates.reloadAsync();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Card>
      <Text style={styles.subtitle}>Atualizações do app</Text>
      <Text style={styles.body}>
        Melhorias de telas e regras podem chegar sem instalar outro APK. O app busca ao abrir e usa
        a atualização na próxima abertura. Seus registros continuam neste aparelho.
      </Text>
      <Text style={styles.small}>
        Recursos que mudam a parte nativa do Android ainda precisam de um novo APK.
      </Text>
      {!Updates.isEnabled ? (
        <Text style={styles.small}>
          Disponível na versão instalada com atualizações ativadas. Expo Go e versões de
          desenvolvimento não recebem este canal.
        </Text>
      ) : (
        <>
          <Text style={styles.small}>
            {update.isDownloading
              ? 'Baixando atualização…'
              : update.isUpdatePending
                ? 'Uma atualização está pronta para aplicar.'
                : status || 'Busca automática ativada.'}
          </Text>
          <Button
            label={working ? 'Aguarde…' : 'Buscar atualização'}
            disabled={working || saving || update.isDownloading}
            onPress={check}
          />
          {update.isUpdatePending && (
            <Button label="Atualizar e reiniciar" onPress={apply} disabled={working || saving} />
          )}
        </>
      )}
      <ErrorText message={error} />
    </Card>
  );
}
