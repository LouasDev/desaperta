# Atualizações sem reinstalar

O projeto está vinculado a `@louas/desaperta` no Expo. O Android usa o canal **production**, a branch **production** e o runtime nativo **1.3.0**. O código distribuído fica no EAS Update; registros financeiros, extratos e backups não são enviados ao serviço pelo aplicativo.

## No celular

Instale o APK 1.3.0 uma vez para incluir o mecanismo nativo de atualizações. O APK 1.2.0 ainda não possui esse mecanismo.

Depois, o aplicativo consulta melhorias ao abrir, baixa em segundo plano e aplica na próxima abertura completa. Em **Mais → Ajustes → Atualizações do app**, você também pode buscar, baixar e escolher **Atualizar e reiniciar**. Os dados já salvos permanecem no armazenamento local. A internet é necessária para buscar melhorias; o controle financeiro continua funcionando sem ela.

Telas, cores, textos, regras de cálculo e correções de importação podem ser atualizados dessa forma. Adicionar um módulo nativo, trocar a versão do Expo/React Native ou mudar permissões/configuração nativa ainda exige um novo APK.

## Publicar uma melhoria compatível

Na pasta do projeto, usando a conta Expo `louas` autenticada:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-update.ps1 -Message "Descrição da melhoria"
```

O comando verifica a compatibilidade com o último APK, executa TypeScript e os testes, exporta o pacote Android e publica no canal de produção. O EAS CLI fica em `.tools/eas-cli`; a autenticação fica na área privada do Expo no computador, fora do Git. Não coloque tokens ou senhas nos scripts.

`native-runtime.json` registra a assinatura de compatibilidade após uma compilação assinada bem-sucedida. O controle é conservador: mudanças nas dependências resolvidas, plugins, ícones ou configuração nativa bloqueiam a publicação até gerar um novo runtime/APK. Alterações somente no código das telas e regras não mudam essa assinatura.

## Quando mudar a parte nativa

1. Altere `runtimeVersion` em `app.json` para uma nova versão, como `1.4.0`, e incremente `android.versionCode`.
2. Atualize as dependências/configurações e execute `scripts/build-apk.ps1`.
3. Distribua o novo APK com a mesma chave e instale sobre o anterior.
4. Publique melhorias compatíveis somente para o novo runtime.

O servidor só entrega atualizações cujo runtime corresponde ao APK instalado. A compilação também bloqueia alterações nativas sem incremento de runtime, para preservar aparelhos que continuam na versão anterior. Não distribua uma atualização que torne os dados locais incompatíveis com o leitor do APK incorporado: mantenha migrações e recuperação de dados ao planejar alterações de esquema.

A busca, o download e o reinício precisam ser conferidos no aparelho após instalar o primeiro APK com EAS Update. Configuração remota e manifesto publicado podem ser verificados antes, mas isso não substitui esse teste físico.
