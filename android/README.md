# CoreDash — App Android

Aplicativo Android nativo do CoreDash, escrito em Kotlin com Jetpack Compose.

O app funciona de forma **local no aparelho**, sem depender do servidor Next.js do
restante do CoreDash. A persistência é feita com **Room** (banco de dados local),
**DataStore** (preferências) e **EncryptedSharedPreferences** (segredos/credenciais),
e as integrações externas são chamadas diretamente pela rede com **Ktor**.

## Visão geral

- **Linguagem/UI:** Kotlin + Jetpack Compose com **Material 3** (visual atualizado),
  incluindo **cor dinâmica** (Android 12+) e **modo escuro** (claro/escuro/sistema).
- **Arquitetura:** MVVM com `ViewModel` + `StateFlow`, separando `data/`, `ui/` e
  injeção manual via `AppContainer`.
- **Persistência local:**
  - **Room** para o To-Do (tarefas com recorrência).
  - **DataStore Preferences** para configurações do app (tema, cards ativos, modo foco,
    localização, etc.) e para a **personalização dos widgets** (ver abaixo).
  - **EncryptedSharedPreferences** para chaves de API e dados sensíveis.
- **Rede:** **Ktor Client** (engine OkHttp) chamando APIs externas diretamente
  (Open-Meteo para clima, Mediastack para notícias).
- **Sem backend próprio:** não é necessário subir o servidor Next.js / Docker para usar
  o app.

### Personalização dos widgets

Os cards do painel podem ser configurados nas **Configurações** e as preferências ficam
persistidas no **DataStore**:

- **Ativar/desativar** cards individualmente.
- **Reordenar** os cards na ordem de exibição.
- **Opções por card:**
  - **Notícias:** quantidade de itens e tópico.
  - **Agenda:** número de dias exibidos.
  - **Clima:** unidade em **°C ou °F**.
  - **Agenda do dispositivo:** escolha de quais agendas exibir.

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
        │   │   ├── todo/               # Room: entities, DAO, DB, recorrência
        │   │   ├── settings/           # DataStore, EncryptedSharedPreferences, validação
        │   │   ├── calendar/           # agenda do dispositivo (CalendarContract)
        │   │   ├── location/           # GPS/rede + Geocoder (usar minha localização)
        │   │   └── remote/             # Ktor: clima, notícias
        │   └── ui/
        │       ├── dashboard/          # tela e ViewModel do painel
        │       ├── cards/              # cards (Weather, Todo, Calendar, News, Gmail)
        │       ├── setup/              # formulário inicial
        │       ├── settings/           # tela de configurações
        │       └── theme/              # tema (claro/escuro/sistema + cor dinâmica)
        └── test/java/com/coredash/app/     # testes unitários JUnit4
            ├── RecurrenceTest.kt
            ├── CardOrderTest.kt
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

## Permissões

Declaradas no `AndroidManifest.xml`:

- `INTERNET` — chamadas de rede (clima e notícias).
- `READ_CALENDAR` — leitura da **agenda do dispositivo** para o card de Calendar.
- `ACCESS_COARSE_LOCATION` e `ACCESS_FINE_LOCATION` — usadas pelo botão
  **“Usar minha localização”** no formulário inicial (GPS/rede + Geocoder).

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

| Funcionalidade                          | Web |     Android      | Observações                                       |
| --------------------------------------- | :-: | :--------------: | ------------------------------------------------- |
| Weather (Open-Meteo)                    | ✅  |        ✅        | Ktor + Open-Meteo (unidade °C/°F)                 |
| To-Do com recorrência                   | ✅  |        ✅        | Room (daily/weekly/monthly)                       |
| Stocks / ações                          | ✅  | 🚫 Não planejado | Sem integração de ações no app Android            |
| News (Mediastack)                       | ✅  |        ✅        | Ktor + Mediastack (quantidade/tópico configuráveis) |
| Calendar                                | ✅  |        ✅        | Agenda do dispositivo via CalendarContract (READ_CALENDAR), escolha de agendas |
| Gmail                                   | ✅  |        ⏳        | TODO                                              |
| Modo foco                               | ✅  |        ✅        |                                                   |
| Tema (claro/escuro/sistema)             | ✅  |        ✅        | Material 3 com cor dinâmica (Android 12+)         |
| Personalização de widgets               | ✅  |        ✅        | Ativar/desativar, reordenar e opções (DataStore)  |
| Formulário inicial                      | ✅  |        ✅        | Validação de timezone/lat/lon + “Usar minha localização” |
| SerpAPI / Google News fallback          | ✅  |        ⏳        | TODO                                              |
