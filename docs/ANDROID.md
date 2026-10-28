# Instalação no Android

O APK de teste é uma versão release assinada do Desaperta. Funciona sem Expo Go e sem o computador ligado. Os dados permanecem no armazenamento local do aplicativo.

1. Copie `Desaperta-1.3.0.apk` para o celular e abra o arquivo.
2. Se o Android solicitar, permita a instalação de aplicativos pelo gerenciador de arquivos ou navegador utilizado e toque em **Instalar**.
3. Abra **Desaperta** e configure suas contas e cartões.

Os dados usados no navegador do computador não são transferidos automaticamente. Para levá-los ao celular, exporte um backup em **Ajustes**, copie o arquivo para o aparelho e importe pelo aplicativo. Guarde uma cópia do backup antes de importar ou desinstalar.

Atualizações devem ser instaladas sobre a versão existente, usando a mesma assinatura. Desinstalar apaga o armazenamento local.

## Compilação local no Windows

O identificador Android é `br.com.louas.desaperta`; a versão 1.3.0 tem `versionCode: 2`. Incremente esse código nas próximas versões distribuídas.

O ambiente local usa Node 22 e Java 17 em `.tools/`. O Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1 e cache Gradle ficam em `Documentos/Codex/android-tools`, para manter caminhos curtos no Windows. Essas ferramentas e suas licenças são obtidas dos fornecedores oficiais.

Execute na pasta do projeto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1
```

O script copia os fontes e dependências para `Documentos/Codex/apk`, uma pasta curta de compilação, para evitar os limites de caminhos das ferramentas nativas do Windows. Ele gera o projeto nativo nessa pasta, assina a versão release e verifica a assinatura. O APK inclui o código JavaScript e as bibliotecas ARM de 32 e 64 bits. A saída padrão é a pasta `android` ao lado da pasta do projeto.

A chave privada e a senha ficam em `.tools/signing/`, fora do Git. Preserve essa pasta em um backup privado: ela permite assinar as próximas atualizações com a mesma identidade. Não envie a chave ou a senha junto com o APK.

O APK não contém os dados financeiros usados no navegador. A validação da assinatura e a compilação não substituem os testes em aparelho físico; confira cadastro, persistência ao reabrir, backup, tema e abertura do WhatsApp no seu celular.

## Atualizar a instalação existente

Instale a versão 1.3.0 sobre a 1.2.0, usando o mesmo aplicativo, sem desinstalar. A chave de assinatura e o identificador são preservados e o banco local migra para a versão 4. Guarde um backup antes de atualizar.

Este APK adiciona o mecanismo de atualizações remotas. Depois de instalado, consulte **Mais → Ajustes → Atualizações do app**. Veja [como publicar melhorias sem reinstalar](ATUALIZACOES.md). Recursos nativos continuam exigindo novo APK.
