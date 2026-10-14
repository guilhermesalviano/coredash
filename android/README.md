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

## Tablet de parede e despertar por movimento

O foco é um tablet **10,1" em paisagem** (`com.coredash.app`). A Activity usa
`sensorLandscape` em tablets (menor dimensão ≥ 600 dp); celulares seguem a rotação
do sistema. O painel ocupa a largura disponível: **1 coluna abaixo de 600 dp,
2 de 600 a 839 dp e 3 a partir de 840 dp**, com tipografia maior nos cards em telas
largas. O modo foco mantém Tarefas na largura toda. Os breakpoints usam as dimensões
do layout Compose, sem dependência adicional de WindowSizeClass.

Em **Configurações → Painel de parede**, ative **Despertar por movimento** e permita
acesso à câmera. A opção começa desativada. O DataStore existente, acessado pelo
`AppContainer`, persiste o toggle, o período sem movimento (**15 s a 5 min**, padrão
**60 s**) e a sensibilidade (**baixa / média / alta**, padrão média). Nenhum segredo
é necessário. Se a permissão for negada, o painel continua funcionando, sem câmera
nem escurecimento automático; é possível tentar novamente ou abrir as permissões
do app pelo mesmo card.

- CameraX (`camera-core`, `camera-camera2`, `camera-lifecycle`) faz análise **sem
  preview**, OpenCV ou ML Kit. Usa a câmera frontal quando disponível e a traseira
  como alternativa; a lente precisa estar voltada para a área a monitorar.
- Solicita **160×120**, negociando a resolução suportada mais próxima pelo aparelho
  (pode ser maior). Amostra até **32×24** valores do plano Y, respeitando crop e
  strides, e compara a diferença absoluta média entre quadros consecutivos.
- Analisa no máximo **1 quadro/s**, descarta os demais e fecha todos os `ImageProxy`.
  As sensibilidades baixa/média/alta usam limiares de 18/10/5 na escala 0–255.
  Os primeiros 2 s estabilizam a exposição; há também 2 s de estabilização após
  reduzir o brilho do painel. Mudanças de iluminação podem ser interpretadas como
  movimento. A câmera não reconhece pessoas.
- A câmera permanece ligada **somente enquanto o dashboard está retomado/em primeiro
  plano**, inclusive no screensaver. Isso permite medir ausência de movimento antes
  de escurecer. Entrar em configurações, abrir um diálogo ou perder o foco da janela, sair do app,
  pausar/parar a Activity ou apagar completamente a tela libera a câmera. Voltar ao painel reinicia a análise.
- Sem movimento ou interação pelo período escolhido, aparece uma tela preta com
  relógio no fuso configurado e brilho da janela em **1%**. Movimento, toque ou tecla
  restaura o brilho anterior (inclusive o controle automático do sistema) e o painel.
  O primeiro toque de despertar não aciona controles por baixo da tela preta.
- `FLAG_KEEP_SCREEN_ON` mantém o dashboard/screensaver ligado; as flags de janela
  permitem exibir o painel sobre a tela bloqueada. Não há serviço em segundo plano,
  wake lock nem desbloqueio de credenciais. **Desligar a tela pelo botão físico
  interrompe a detecção: é preciso ligá-la manualmente**. Este despertar sai do
  screensaver do app, não de um aparelho totalmente suspenso.
- Falta de câmera, permissão revogada, erro de câmera ou ausência de quadros por mais
  de 8 s interrompe o sensor e restaura o painel. O erro fica visível nas configurações;
  voltar ao painel tenta novamente.

**Privacidade e bateria:** os quadros são processados apenas na memória do aparelho,
nunca gravados nem enviados pela rede. O indicador de uso da câmera do Android pode
ficar visível. Limitar a análise a 1 Hz reduz trabalho de CPU, mas **não limita a
captura do sensor a 1 FPS**: manter câmera e tela ligadas consome bateria mesmo com
brilho baixo. Recomenda-se **alimentação na tomada** para um tablet de parede.
Desative o recurso quando não for necessário; sem ele, o painel ainda mantém a tela
ligada enquanto está em primeiro plano.

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
            ├── LuminanceDifferenceTest.kt
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
- `CAMERA` — solicitada em tempo de execução nas configurações para despertar por
  movimento; câmera é hardware opcional e o app funciona sem a permissão.
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

O teste JVM `LuminanceDifferenceTest` cobre luminância unsigned, média da diferença,
limiares/sensibilidade, baseline, reset, tamanho de quadro e limites do período quieto.

Validação manual em dispositivo:

1. Conferir 1/2/3 colunas em janelas de diferentes larguras e rotação em celular/tablet.
2. Ativar movimento, conceder câmera e selecionar 15 s; manter cena imóvel, aguardar
   escurecer e mover-se diante da lente para restaurar o painel e o brilho.
3. Despertar por toque e confirmar que nenhuma tarefa/ação foi acionada pelo toque.
4. Negar/revogar câmera e verificar mensagem, painel utilizável e ausência de crash.
5. Ir às configurações, colocar o app em segundo plano e apagar a tela; verificar
   liberação da câmera. Retornar e testar novamente, inclusive após reiniciar o app
   para confirmar persistência das preferências.

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
