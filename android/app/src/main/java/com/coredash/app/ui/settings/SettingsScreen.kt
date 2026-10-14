package com.coredash.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.lifecycle.viewmodel.compose.viewModel
import com.coredash.app.CoreDashApp
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.CardId
import com.coredash.app.data.settings.MAX_NEWS_COUNT
import com.coredash.app.data.settings.MIN_NEWS_COUNT
import com.coredash.app.data.settings.NEWS_TOPICS
import com.coredash.app.data.settings.ThemeMode
import com.coredash.app.data.settings.WeatherUnit
import com.coredash.app.ui.calendar.rememberCalendarPermission
import com.coredash.app.ui.cards.DashboardCard
import com.coredash.app.ui.theme.Spacing
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onOpenSetup: () -> Unit,
    viewModel: SettingsViewModel = viewModel(
        factory = SettingsViewModel.factory(
            (LocalContext.current.applicationContext as CoreDashApp).container,
        ),
    ),
) {
    val settings by viewModel.settings.collectAsState()
    val calendars by viewModel.calendars.collectAsState()
    val calendarPermission = rememberCalendarPermission()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configurações") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Voltar",
                        )
                    }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding).imePadding(), contentAlignment = Alignment.TopCenter) {
            Column(
                modifier = Modifier
                    .widthIn(max = Spacing.screenMaxWidth)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(Spacing.md),
                verticalArrangement = Arrangement.spacedBy(Spacing.md),
            ) {
                Text("Deixe o painel com a sua cara.", style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                DashboardCard(title = "Aparência", icon = Icons.Default.Star) {
                    Text("Escolha um tema ou acompanhe o sistema.", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                        ThemeMode.entries.forEach { mode ->
                            FilterChip(
                                selected = settings.theme == mode,
                                onClick = { viewModel.setTheme(mode) },
                                label = { Text(mode.label()) },
                            )
                        }
                    }
                }

                DashboardCard(title = "Widgets", icon = Icons.Default.Settings) {
                    Text("Escolha o que aparece e organize a ordem do painel.", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    WidgetCustomization(
                        settings = settings,
                        onToggle = viewModel::setCardEnabled,
                        onMove = viewModel::moveCard,
                        onNewsCount = viewModel::setNewsCount,
                        onNewsTopic = viewModel::setNewsTopic,
                        onCalendarDays = viewModel::setCalendarDays,
                        onWeatherUnit = viewModel::setWeatherUnit,
                    )
                }

                if (calendarPermission.granted) {
                    LaunchedEffect(Unit) { viewModel.loadCalendars() }

                    DashboardCard(title = "Agendas do dispositivo", icon = Icons.Default.DateRange) {
                        if (calendars.isEmpty()) {
                            Text(
                                text = "Nenhuma agenda encontrada",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        } else {
                            calendars.forEach { calendar ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().toggleable(
                                        value = calendar.id in settings.selectedCalendarIds,
                                        role = Role.Checkbox,
                                        onValueChange = { viewModel.setCalendarSelected(calendar.id, it) },
                                    ),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = calendar.displayName,
                                        modifier = Modifier.weight(1f),
                                    )
                                    Checkbox(
                                        checked = calendar.id in settings.selectedCalendarIds,
                                        onCheckedChange = null,
                                    )
                                }
                            }
                            Text(
                                text = "Nenhuma marcada significa todas as agendas.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }

                DashboardCard(title = "Região e integrações", icon = Icons.Default.Edit) {
                    Text("Atualize sua localização, fuso horário e chaves de acesso.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    OutlinedButton(
                        onClick = onOpenSetup,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Reabrir configuração inicial")
                    }
                }
            }
        }
    }
}

private fun ThemeMode.label(): String = when (this) {
    ThemeMode.SYSTEM -> "Sistema"
    ThemeMode.LIGHT -> "Claro"
    ThemeMode.DARK -> "Escuro"
}

private fun CardId.label(): String = when (this) {
    CardId.WEATHER -> "Clima"
    CardId.CALENDAR -> "Calendário"
    CardId.GMAIL -> "Gmail"
    CardId.TODO -> "Tarefas"
    CardId.NEWS -> "Notícias"
}

private val CardId.hasOptions: Boolean
    get() = this == CardId.NEWS || this == CardId.CALENDAR || this == CardId.WEATHER

@Composable
private fun WidgetCustomization(
    settings: AppSettings,
    onToggle: (CardId, Boolean) -> Unit,
    onMove: (CardId, Boolean) -> Unit,
    onNewsCount: (Int) -> Unit,
    onNewsTopic: (String) -> Unit,
    onCalendarDays: (Int) -> Unit,
    onWeatherUnit: (WeatherUnit) -> Unit,
) {
    val expanded = remember { mutableStateMapOf<CardId, Boolean>() }

    settings.cardOrder.forEachIndexed { index, card ->
        val isExpanded = expanded[card] == true

        Surface(shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.surfaceContainerLow) {
            Column(modifier = Modifier.fillMaxWidth().padding(Spacing.sm)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = card.label(),
                        modifier = Modifier.weight(1f),
                    )
                    Switch(
                        checked = card in settings.activeCards,
                        onCheckedChange = { enabled -> onToggle(card, enabled) },
                        modifier = Modifier.semantics { contentDescription = "Exibir ${card.label()}" },
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Posição ${index + 1}", modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    IconButton(
                        onClick = { onMove(card, true) },
                        enabled = index > 0,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.KeyboardArrowUp,
                            contentDescription = "Mover ${card.label()} para cima",
                        )
                    }
                    IconButton(
                        onClick = { onMove(card, false) },
                        enabled = index < settings.cardOrder.lastIndex,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.KeyboardArrowDown,
                            contentDescription = "Mover ${card.label()} para baixo",
                        )
                    }
                    if (card.hasOptions) {
                        IconButton(onClick = { expanded[card] = !isExpanded }) {
                            Icon(
                                imageVector = Icons.Filled.MoreVert,
                                contentDescription = if (isExpanded) {
                                    "Recolher opções de ${card.label()}"
                                } else {
                                    "Expandir opções de ${card.label()}"
                                },
                            )
                        }
                    }
                }

                if (isExpanded) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = Spacing.xs, end = Spacing.xs, bottom = Spacing.xs),
                        verticalArrangement = Arrangement.spacedBy(Spacing.xs),
                    ) {
                        when (card) {
                            CardId.NEWS -> NewsOptions(
                                count = settings.newsCount,
                                topic = settings.newsTopic,
                                onCountChange = onNewsCount,
                                onTopicChange = onNewsTopic,
                            )
                            CardId.CALENDAR -> CalendarOptions(
                                days = settings.calendarDays,
                                onDaysChange = onCalendarDays,
                            )
                            CardId.WEATHER -> WeatherOptions(
                                unit = settings.weatherUnit,
                                onUnitChange = onWeatherUnit,
                            )
                            else -> Unit
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NewsOptions(
    count: Int,
    topic: String,
    onCountChange: (Int) -> Unit,
    onTopicChange: (String) -> Unit,
) {
    Text(
        text = "Notícias por vez: $count",
        style = MaterialTheme.typography.bodyMedium,
    )
    Slider(
        value = count.toFloat(),
        onValueChange = { value -> onCountChange(value.roundToInt()) },
        valueRange = MIN_NEWS_COUNT.toFloat()..MAX_NEWS_COUNT.toFloat(),
        steps = MAX_NEWS_COUNT - MIN_NEWS_COUNT - 1,
    )

    var topicExpanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { topicExpanded = true }) {
            Text("Tópico: ${topic.label()}")
        }
        DropdownMenu(
            expanded = topicExpanded,
            onDismissRequest = { topicExpanded = false },
        ) {
            NEWS_TOPICS.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option.label()) },
                    onClick = {
                        onTopicChange(option)
                        topicExpanded = false
                    },
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CalendarOptions(
    days: Int,
    onDaysChange: (Int) -> Unit,
) {
    Text(
        text = "Dias exibidos",
        style = MaterialTheme.typography.bodyMedium,
    )
    FlowRow(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
        listOf(1, 3, 7, 14).forEach { option ->
            FilterChip(
                selected = days == option,
                onClick = { onDaysChange(option) },
                label = { Text(option.toString()) },
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WeatherOptions(
    unit: WeatherUnit,
    onUnitChange: (WeatherUnit) -> Unit,
) {
    Text(
        text = "Unidade de temperatura",
        style = MaterialTheme.typography.bodyMedium,
    )
    FlowRow(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
        WeatherUnit.entries.forEach { option ->
            FilterChip(
                selected = unit == option,
                onClick = { onUnitChange(option) },
                label = { Text(option.label()) },
            )
        }
    }
}

private fun WeatherUnit.label(): String = when (this) {
    WeatherUnit.CELSIUS -> "Celsius"
    WeatherUnit.FAHRENHEIT -> "Fahrenheit"
}

private fun String.label(): String = replaceFirstChar { it.uppercaseChar() }
