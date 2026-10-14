package com.coredash.app.ui.dashboard

import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.coredash.app.CoreDashApp
import com.coredash.app.data.settings.CardId
import com.coredash.app.ui.cards.NewsCard
import com.coredash.app.ui.cards.PlaceholderCard
import com.coredash.app.ui.cards.StocksCard
import com.coredash.app.ui.cards.TodoCard
import com.coredash.app.ui.cards.WeatherCard

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
                    IconButton(onClick = viewModel::toggleFocusMode) {
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
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        val cards = if (current.focusMode) {
            listOf(CardId.TODO)
        } else {
            CardId.entries.filter { it in current.activeCards }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            items(cards, key = { it.name }) { card ->
                when (card) {
                    CardId.WEATHER -> WeatherCard(
                        weather = uiState.weather,
                        error = uiState.weatherError,
                    )
                    CardId.CALENDAR -> PlaceholderCard(title = "Calendário")
                    CardId.GMAIL -> PlaceholderCard(title = "Gmail")
                    CardId.TODO -> TodoCard(
                        todos = uiState.todos,
                        onToggleComplete = viewModel::toggleTodoComplete,
                        onDelete = viewModel::deleteTodo,
                        onAdd = viewModel::addTodo,
                    )
                    CardId.STOCKS -> StocksCard(
                        stocks = uiState.stocks,
                        configured = uiState.stocksConfigured,
                        error = uiState.stocksError,
                    )
                    CardId.NEWS -> NewsCard(
                        articles = uiState.news,
                        configured = uiState.newsConfigured,
                        error = uiState.newsError,
                    )
                }
            }
        }
    }
}
