# CoreDash — App Android

Aplicativo Android nativo do CoreDash, escrito em Kotlin com Jetpack Compose.

O app funciona de forma **local no aparelho**, sem depender do servidor Next.js do
restante do CoreDash. A persistência é feita com **Room** (banco de dados local),
**DataStore** (preferências) e **EncryptedSharedPreferences** (segredos/credenciais),
e as integrações externas são chamadas diretamente pela rede com **Ktor**.

## Visão geral

- **Linguagem/UI:** Kotlin + Jetpack Compose (Material 3).
- **Arquitetura:** MVVM com `ViewModel` + `StateFlow`, separando `data/`, `ui/` e
  injeção manual via `AppContainer`.
- **Persistência local:**
  - **Room** para o To-Do (tarefas com recorrência).
  - **DataStore Preferences** para configurações do app (tema, cards ativos, modo foco,
    localização, etc.).
  - **EncryptedSharedPreferences** para chaves de API e dados sensíveis.
- **Rede:** **Ktor Client** (engine OkHttp) chamando APIs externas diretamente
  (Open-Meteo para clima, brapi para ações, Mediastack para notícias).
- **Sem backend próprio:** não é necessário subir o servidor Next.js / Docker para usar
  o app.

## Arquitetura e estrutura de pastas

```
android/
├── build.gradle.kts                # configuração raiz do Gradle
├── settings.gradle.kts             # módulos incluídos
├── gradle/libs.versions.toml       # catálogo de versões/dependências
└── app/
    ├── build.gradle.kts            # módulo do app (SDK 35, Java 17, JUnit)
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   └── java/com/coredash/app/
        │       ├── CoreDashApp.kt          # Application
        │       ├── AppContainer.kt         # injeção de dependências
        │       ├── MainActivity.kt
        │       ├── data/
        │       │   ├── todo/               # Room: entities, DAO, DB, recorrência
        │       │   ├── settings/           # DataStore, EncryptedSharedPreferences, validação
        │       │   └── remote/             # Ktor: clima, ações, notícias
        │       └── ui/
        │           ├── dashboard/          # tela e ViewModel do painel
        │           ├── cards/              # cards (Weather, Todo, Stocks, News, ...)
        │           ├── setup/              # formulário inicial
        │           ├── settings/           # tela de configurações
        │           └── theme/              # tema (claro/escuro/sistema)
        └── test/java/com/coredash/app/     # testes unitários JUnit4
            ├── RecurrenceTest.kt
            └── SetupValidationTest.kt
```

## Pré-requisitos

- **JDK 17**
- **Android SDK 35** (compileSdk/targetSdk = 35, minSdk = 26)
- Variável de ambiente `ANDROID_HOME`/`ANDROID_SDK_ROOT` configurada **ou** um arquivo
  `local.properties` na pasta `android/` com o caminho do SDK, por exemplo:

  ```properties
  sdk.dir=/caminho/para/Android/Sdk
  ```

## Como compilar e testar

Execute os comandos a partir da pasta `android/`:

```bash
# Compila o APK de debug
./gradlew assembleDebug

# Roda os testes unitários (JVM)
./gradlew testDebugUnitTest
```

O APK gerado fica em:

```
app/build/outputs/apk/debug/app-debug.apk
```

## Paridade de funcionalidades: Web x Android

| Funcionalidade                    | Web | Android | Observações                          |
| --------------------------------- | :-: | :-----: | ------------------------------------ |
| Weather (Open-Meteo)              | ✅  |   ✅    | Ktor + Open-Meteo                    |
| To-Do com recorrência             | ✅  |   ✅    | Room (daily/weekly/monthly)          |
| Stocks (brapi)                    | ✅  |   ✅    | Ktor + brapi                         |
| News (Mediastack)                 | ✅  |   ✅    | Ktor + Mediastack                    |
| Calendar                          | ✅  |   ✅    | Agenda do dispositivo (READ_CALENDAR) |
| Gmail                             | ✅  |   ⏳    | TODO                                 |
| Modo foco                         | ✅  |   ✅    |                                      |
| Tema (claro/escuro/sistema)       | ✅  |   ✅    |                                      |
| Toggle de cards                   | ✅  |   ✅    |                                      |
| Formulário inicial                | ✅  |   ✅    | Validação de timezone/lat/lon        |
| SerpAPI / Google News fallback    | ✅  |   ⏳    | TODO                                 |
