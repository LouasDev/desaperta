import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useFeedback } from '../components/ui';

export function useUnsavedChanges(dirty: boolean, saving: boolean) {
  const navigation = useNavigation();
  const { confirm } = useFeedback();
  const completed = useRef(false);
  usePreventRemove(dirty || saving, ({ data }) => {
    if (completed.current) {
      navigation.dispatch(data.action);
      return;
    }
    if (saving) return;
    void confirm({
      title: 'Sair sem salvar?',
      message: 'As alterações deste formulário ainda não foram salvas.',
      accept: 'Sair sem salvar',
    }).then((leave) => {
      if (leave) navigation.dispatch(data.action);
    });
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || typeof window === 'undefined') return;
    const handler = (event: BeforeUnloadEvent) => {
      if (!completed.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return () => {
    completed.current = true;
  };
}
