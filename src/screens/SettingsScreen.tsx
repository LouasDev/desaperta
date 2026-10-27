import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { parseBackup } from '../domain/finance';
import { exportBackup, importBackup } from '../services/backup';
import { useFinance } from '../state/FinanceContext';
import { repository } from '../storage/repository';
import { styles } from '../styles/theme';
export default function SettingsScreen() {
  const { data, commit, saving } = useFinance();
  const { notify, confirm } = useFeedback();
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [showText, setShowText] = useState(false);
  const [paste, setPaste] = useState('');
  const busy = saving || working;
  const restore = async (raw: string) => {
    const restored = parseBackup(raw);
    if (
      !(await confirm({
        title: 'Restaurar este backup?',
        message: `O arquivo contém ${restored.transactions.length} movimentação(ões), ${restored.debts.length} pendência(s) e ${restored.payments.length} pagamento(s). Ele substituirá os registros atuais. Uma cópia do estado atual será preservada no aparelho.`,
        accept: 'Restaurar backup',
      }))
    )
      return;
    await commit(() => restored, true);
    setPaste('');
    notify('Backup restaurado. Seus registros estão disponíveis.');
  };
  const run = async (operation: () => Promise<void>) => {
    setWorking(true);
    setError('');
    try {
      await operation();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setWorking(false);
    }
  };
  return (
    <Page title="Ajustes">
      <Card>
        <Text style={styles.eyebrow}>Só no seu aparelho</Text>
        <Text style={styles.subtitle}>Armazenamento local</Text>
        <Text style={styles.body}>
          O Desaperta guarda seus dados neste aparelho. No navegador, eles ficam salvos neste
          navegador e neste endereço. Não há sincronização entre dispositivos.
        </Text>
        <Text style={styles.small}>
          O armazenamento local não é criptografado. Apagar os dados do app, desinstalar ou limpar
          os dados do navegador pode remover os registros. Guarde backups em um lugar privado.
        </Text>
      </Card>
      <ErrorText message={error} />
      <Card>
        <Text style={styles.subtitle}>Backup dos dados</Text>
        <Text style={styles.body}>
          Exporte seus registros antes de trocar de aparelho. O arquivo JSON permite restaurar tudo
          depois.
        </Text>
        <Text style={styles.small}>
          {data.transactions.length} movimentação(ões) · {data.debts.length} pendência(s) ·{' '}
          {data.people.length} pessoa(s)
        </Text>
        <Button
          label={working ? 'Aguarde…' : 'Exportar backup'}
          disabled={busy}
          onPress={() =>
            run(async () => {
              await exportBackup(JSON.stringify(data, null, 2));
            })
          }
        />
        <Button
          label="Restaurar arquivo de backup"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const raw = await importBackup();
              if (raw !== null) await restore(raw);
            })
          }
        />
        <Button
          label="Exportar cópia anterior à restauração"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const previous = await repository.readPrevious();
              if (!previous)
                throw new Error(
                  'Ainda não há uma cópia anterior. Ela será criada quando você restaurar um backup.',
                );
              await exportBackup(JSON.stringify(previous, null, 2));
            })
          }
        />
      </Card>
      <Card>
        <Text style={styles.subtitle}>Backup em texto</Text>
        <Text style={styles.body}>
          Se não conseguir usar arquivos, copie o texto completo do backup e guarde em um documento
          privado. Para restaurar, cole o texto abaixo.
        </Text>
        <Button
          label={showText ? 'Ocultar texto do backup' : 'Mostrar texto para copiar'}
          variant="secondary"
          onPress={() => setShowText((v) => !v)}
        />
        {showText && (
          <Field
            label="Seu backup completo"
            value={JSON.stringify(data)}
            readOnly
            multiline
            selectTextOnFocus
            maxLength={5_000_000}
            style={{ maxHeight: 200 }}
          />
        )}
        <Field
          label="Cole um backup para restaurar"
          placeholder="Cole aqui o JSON completo"
          value={paste}
          onChangeText={setPaste}
          multiline
          maxLength={5_000_000}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          label="Validar e restaurar texto"
          variant="secondary"
          disabled={busy || !paste.trim()}
          onPress={() => run(() => restore(paste))}
        />
      </Card>
      <Card>
        <Text style={styles.subtitle}>Como o saldo funciona</Text>
        <Text style={styles.body}>
          O saldo é a soma das entradas menos as saídas registradas. Para começar com dinheiro que
          você já tem, adicione uma entrada chamada “Saldo inicial”.
        </Text>
        <Text style={styles.body}>
          “Eu devo” e “Me devem” são compromissos. Eles só afetam o saldo quando você registra um
          pagamento ou recebimento nos detalhes. O app cria essa movimentação automaticamente.
        </Text>
        <Text style={styles.body}>
          Precisou corrigir uma baixa? Use “Desfazer” no histórico da pendência e registre o valor
          correto. Evite lançar a mesma operação duas vezes.
        </Text>
      </Card>
      <Text style={[styles.small, { textAlign: 'center' }]}>Desaperta · versão 1.0.0</Text>
    </Page>
  );
}
