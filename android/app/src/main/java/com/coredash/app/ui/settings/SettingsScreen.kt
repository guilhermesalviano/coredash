package com.coredash.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
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
import com.coredash.app.data.settings.ThemeMode

@OptIn(ExperimentalMaterial3Api::class)
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "Tema",
                style = MaterialTheme.typography.titleMedium,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ThemeMode.entries.forEach { mode ->
                    FilterChip(
                        selected = settings.theme == mode,
                        onClick = { viewModel.setTheme(mode) },
                        label = { Text(mode.label()) },
                    )
                }
            }

            Text(
                text = "Cartões",
                style = MaterialTheme.typography.titleMedium,
            )
            CardId.entries.forEach { card ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = card.label(),
                        modifier = Modifier.weight(1f),
                    )
                    Switch(
                        checked = card in settings.activeCards,
                        onCheckedChange = { enabled -> viewModel.setCardEnabled(card, enabled) },
                    )
                }
            }

            OutlinedButton(
                onClick = onOpenSetup,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Reabrir configuração inicial")
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
    CardId.STOCKS -> "Ações"
    CardId.NEWS -> "Notícias"
}
