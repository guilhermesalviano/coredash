package com.coredash.app.ui.cards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.coredash.app.data.remote.Weather
import com.coredash.app.ui.theme.Spacing
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

@Composable
fun WeatherCard(
    weather: Weather?,
    error: Boolean,
    loading: Boolean,
    onRetry: () -> Unit,
) {
    DashboardCard(title = "Clima", icon = Icons.Default.LocationOn) {
        when {
            loading -> LoadingState("Atualizando o clima…")
            error -> ErrorState("Não foi possível carregar o clima", onRetry)
            weather != null -> {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    shape = MaterialTheme.shapes.medium,
                ) {
                    Row(modifier = Modifier.fillMaxWidth().padding(Spacing.md), verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${weather.temperature.roundToInt()}°",
                            style = MaterialTheme.typography.displayMedium,
                        )
                        Column(
                            modifier = Modifier.padding(start = Spacing.sm),
                            verticalArrangement = Arrangement.spacedBy(Spacing.xxs),
                        ) {
                            Text(
                                text = weatherCondition(weather.weatherCode),
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(
                                text = "Vento: ${weather.windSpeed.roundToInt()} km/h",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                            )
                        }
                    }
                }
                weather.daily.forEach { forecast ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = shortDate(forecast.date),
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = weatherCondition(forecast.weatherCode),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1.5f),
                        )
                        Text(
                            text = "${forecast.min.roundToInt()}° / ${forecast.max.roundToInt()}°",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
            else -> EmptyState("Clima indisponível", "Adicione sua localização na configuração inicial.")
        }
    }
}

private fun weatherCondition(code: Int): String = when (code) {
    0 -> "Céu limpo"
    1 -> "Predominantemente limpo"
    2 -> "Parcialmente nublado"
    3 -> "Nublado"
    45, 48 -> "Neblina"
    in 51..57 -> "Garoa"
    in 61..67 -> "Chuva"
    in 71..77 -> "Neve"
    in 80..82 -> "Pancadas de chuva"
    85, 86 -> "Pancadas de neve"
    in 95..99 -> "Tempestade"
    else -> "Condição desconhecida"
}

private fun shortDate(value: String): String =
    runCatching { LocalDate.parse(value).format(DateTimeFormatter.ofPattern("dd/MM")) }
        .getOrDefault(value)
