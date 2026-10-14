package com.coredash.app.ui.cards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.coredash.app.data.remote.Stock

@Composable
fun StocksCard(
    stocks: List<Stock>,
    configured: Boolean,
    error: Boolean,
) {
    DashboardCard(title = "Ações") {
        when {
            !configured -> HintText("Configure o token da BRAPI e os tickers para ver as cotações.")
            error -> ErrorText("Erro ao carregar as cotações")
            stocks.isEmpty() -> HintText("Nenhuma cotação disponível")
            else -> stocks.forEach { stock ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = stock.symbol,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = "%.2f".format(stock.price),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    val positive = stock.changePercent >= 0
                    Text(
                        text = "%+.2f%%".format(stock.changePercent),
                        color = if (positive) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.error
                        },
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}
