package com.coredash.app.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconToggleButton
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.coredash.app.CoreDashApp
import com.coredash.app.data.settings.CardId
import com.coredash.app.ui.cards.CalendarCard
import com.coredash.app.ui.cards.DashboardCard
import com.coredash.app.ui.cards.EmptyState
import com.coredash.app.ui.cards.LoadingState
import com.coredash.app.ui.cards.NewsCard
import com.coredash.app.ui.cards.PlaceholderCard
import com.coredash.app.ui.cards.TodoCard
import com.coredash.app.ui.cards.WeatherCard
import com.coredash.app.ui.theme.Spacing
import com.coredash.app.ui.theme.TabletDashboardTypography

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onOpenSettings: () -> Unit,
    viewModel: DashboardViewModel = viewModel(
        factory = DashboardViewModel.factory(
            (LocalContext.current.applicationContext as CoreDashApp).container,
        ),
    ),
) {
    val uiState by viewModel.uiState.collectAsState()
    val settings = uiState.settings
    val focusMode = settings?.focusMode == true

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CoreDash") },
                actions = {
                    IconToggleButton(checked = focusMode, onCheckedChange = { viewModel.toggleFocusMode() }) {
                        Icon(
                            imageVector = if (focusMode) Icons.Filled.Star else Icons.Outlined.Star,
                            contentDescription = if (focusMode) "Desativar modo foco" else "Ativar modo foco",
                            tint = if (focusMode) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                LocalContentColor.current
                            },
                        )
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Configurações",
                        )
                    }
                },
            )
        },
    ) { padding ->
        val current = settings
        if (current == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center,
            ) {
                LoadingState("Preparando seu painel…")
            }
            return@Scaffold
        }

        val cards = if (current.focusMode) {
            listOf(CardId.TODO)
        } else {
            current.cardOrder.filter { it in current.activeCards }
        }

        BoxWithConstraints(Modifier.fillMaxSize().padding(padding)) {
            val columns = when {
                maxWidth < 600.dp -> 1
                maxWidth < 840.dp -> 2
                else -> 3
            }
            MaterialTheme(typography = if (columns > 1) TabletDashboardTypography else MaterialTheme.typography) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(columns),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(Spacing.md),
                    verticalArrangement = Arrangement.spacedBy(Spacing.md),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                ) {
                    item(key = "intro", span = { GridItemSpan(maxLineSpan) }) {
                        Column(
                            modifier = Modifier.padding(vertical = Spacing.xs),
                            verticalArrangement = Arrangement.spacedBy(Spacing.xxs),
                        ) {
                            Text(
                                if (focusMode) "Hora de focar" else "Seu dia, em um só lugar",
                                style = MaterialTheme.typography.headlineSmall,
                            )
                            Text(
                                if (focusMode) "Um passo de cada vez. Suas tarefas em destaque."
                                else current.city.takeIf { it.isNotBlank() } ?: "O que importa, sempre por perto.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    if (cards.isEmpty()) {
                        item(key = "empty", span = { GridItemSpan(maxLineSpan) }) {
                            DashboardCard(title = "Seu painel", icon = Icons.Default.Settings) {
                                EmptyState("Um espaço do seu jeito", "Escolha os widgets que deseja ver nas configurações.")
                                TextButton(onClick = onOpenSettings) { Text("Personalizar painel") }
                            }
                        }
                    }
                    items(cards, key = { it.name }, span = { GridItemSpan(if (focusMode) maxLineSpan else 1) }) { card ->
                        when (card) {
                            CardId.WEATHER -> WeatherCard(
                                weather = uiState.weather,
                                error = uiState.weatherError,
                                loading = uiState.weatherLoading,
                                onRetry = viewModel::retryWeather,
                            )
                            CardId.CALENDAR -> CalendarCard(
                                events = uiState.calendarEvents,
                                loading = uiState.calendarLoading,
                                selectedCalendarIds = current.selectedCalendarIds,
                                calendarDays = current.calendarDays,
                                onLoad = viewModel::loadCalendar,
                            )
                            CardId.GMAIL -> PlaceholderCard(title = "Gmail")
                            CardId.TODO -> TodoCard(
                                todos = uiState.todos,
                                onToggleComplete = viewModel::toggleTodoComplete,
                                onDelete = viewModel::deleteTodo,
                                onAdd = viewModel::addTodo,
                            )
                            CardId.NEWS -> NewsCard(
                                articles = uiState.news,
                                configured = uiState.newsConfigured,
                                error = uiState.newsError,
                                loading = uiState.newsLoading,
                                onRetry = viewModel::retryNews,
                            )
                        }
                    }
                }
            }
        }
    }
}
