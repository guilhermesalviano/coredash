package com.coredash.app.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.coredash.app.CoreDashApp

@Composable
fun SetupScreen(
    onNavigateToDashboard: () -> Unit,
    viewModel: SetupViewModel = viewModel(
        factory = SetupViewModel.factory(
            (LocalContext.current.applicationContext as CoreDashApp).container,
        ),
    ),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSaved) {
        if (uiState.isSaved) {
            onNavigateToDashboard()
        }
    }

    Scaffold { padding ->
        if (uiState.isLoading) {
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

        val errors = uiState.errors
        val timezoneError = errors.any { it.startsWith("timezone") }
        val latitudeError = errors.any { it.startsWith("latitude") }
        val longitudeError = errors.any { it.startsWith("longitude") }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Configuração inicial",
                style = MaterialTheme.typography.headlineSmall,
            )
            Text(
                text = "Preencha os dados obrigatórios para começar.",
                style = MaterialTheme.typography.bodyMedium,
            )

            if (errors.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        errors.forEach { error ->
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }

            OutlinedTextField(
                value = uiState.timezone,
                onValueChange = viewModel::onTimezoneChange,
                label = { Text("Timezone") },
                supportingText = { Text("Ex.: America/Sao_Paulo") },
                isError = timezoneError,
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = uiState.latitude,
                onValueChange = viewModel::onLatitudeChange,
                label = { Text("Latitude") },
                isError = latitudeError,
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = uiState.longitude,
                onValueChange = viewModel::onLongitudeChange,
                label = { Text("Longitude") },
                isError = longitudeError,
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = uiState.city,
                onValueChange = viewModel::onCityChange,
                label = { Text("Cidade (opcional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = uiState.tickers,
                onValueChange = viewModel::onTickersChange,
                label = { Text("Ações (opcional)") },
                supportingText = { Text("Separadas por vírgula, ex.: PETR4, VALE3") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            Text(
                text = "Segredos (opcional)",
                style = MaterialTheme.typography.titleMedium,
            )

            SecretField(
                label = "Mediastack API Key",
                value = uiState.mediastackApiKey,
                onValueChange = viewModel::onMediastackApiKeyChange,
            )
            SecretField(
                label = "SerpApi API Key",
                value = uiState.serpApiKey,
                onValueChange = viewModel::onSerpApiKeyChange,
            )
            SecretField(
                label = "BRAPI Token",
                value = uiState.brapiToken,
                onValueChange = viewModel::onBrapiTokenChange,
            )
            SecretField(
                label = "Google Service Account JSON",
                value = uiState.googleServiceAccountJson,
                onValueChange = viewModel::onGoogleServiceAccountJsonChange,
            )
            SecretField(
                label = "Google Calendar ID",
                value = uiState.googleCalendarId,
                onValueChange = viewModel::onGoogleCalendarIdChange,
            )
            SecretField(
                label = "Gmail Client ID",
                value = uiState.gmailClientId,
                onValueChange = viewModel::onGmailClientIdChange,
            )
            SecretField(
                label = "Gmail Client Secret",
                value = uiState.gmailClientSecret,
                onValueChange = viewModel::onGmailClientSecretChange,
            )
            SecretField(
                label = "Gmail Refresh Token",
                value = uiState.gmailRefreshToken,
                onValueChange = viewModel::onGmailRefreshTokenChange,
            )

            Button(
                onClick = viewModel::save,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Salvar")
            }
        }
    }
}

@Composable
private fun SecretField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        modifier = Modifier.fillMaxWidth(),
    )
}
