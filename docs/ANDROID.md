# Instalação no Android

O APK de teste é uma versão release assinada do Desaperta. Funciona sem Expo Go e sem o computador ligado. Os dados permanecem no armazenamento local do aplicativo.

1. Copie `Desaperta-1.2.0.apk` para o celular e abra o arquivo.
2. Se o Android solicitar, permita a instalação de aplicativos pelo gerenciador de arquivos ou navegador utilizado e toque em **Instalar**.
3. Abra **Desaperta** e configure suas contas e cartões.

Os dados usados no navegador do computador não são transferidos automaticamente. Para levá-los ao celular, exporte um backup em **Ajustes**, copie o arquivo para o aparelho e importe pelo aplicativo. Guarde uma cópia do backup antes de importar ou desinstalar.

Atualizações devem ser instaladas sobre a versão existente, usando a mesma assinatura. Desinstalar apaga o armazenamento local.

## Compilação local no Windows

O identificador Android é `br.com.louas.desaperta`; a primeira versão tem `versionCode: 1`. Incremente esse código nas próximas versões distribuídas.

O ambiente local usa Node 22 e Java 17 em `.tools/`. O Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1 e cache Gradle ficam em `Documentos/Codex/android-tools`, para manter caminhos curtos no Windows. Essas ferramentas e suas licenças são obtidas dos fornecedores oficiais.

Execute na pasta do projeto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1
```

O script copia os fontes e dependências para `Documentos/Codex/apk`, uma pasta curta de compilação, para evitar os limites de caminhos das ferramentas nativas do Windows. Ele gera o projeto nativo nessa pasta, assina a versão release e verifica a assinatura. O APK inclui o código JavaScript e as bibliotecas ARM de 32 e 64 bits. A saída padrão é a pasta `android` ao lado da pasta do projeto.

A chave privada e a senha ficam em `.tools/signing/`, fora do Git. Preserve essa pasta em um backup privado: ela permite assinar as próximas atualizações com a mesma identidade. Não envie a chave ou a senha junto com o APK.

O APK não contém os dados financeiros usados no navegador. A validação da assinatura e a compilação não substituem os testes em aparelho físico; confira cadastro, persistência ao reabrir, backup, tema e abertura do WhatsApp no seu celular.

## Pacote gerado

O APK 1.2.0 foi compilado com sucesso, com assinatura própria verificada, alinhamento de páginas de 16 KB validado e bundle JavaScript incluído. O pacote tem 37.647.362 bytes, identificador `br.com.louas.desaperta`, versão interna 1 e suporte a ARM de 32/64 bits a partir do Android 7. O teste em aparelho físico será realizado pelo usuário.
