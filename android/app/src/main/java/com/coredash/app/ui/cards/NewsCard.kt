package com.coredash.app.ui.cards

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import com.coredash.app.data.remote.NewsArticle
import com.coredash.app.ui.theme.Spacing

@Composable
fun NewsCard(
    articles: List<NewsArticle>,
    configured: Boolean,
    error: Boolean,
    loading: Boolean,
    onRetry: () -> Unit,
) {
    val uriHandler = LocalUriHandler.current

    DashboardCard(title = "Notícias", icon = Icons.AutoMirrored.Filled.List) {
        when {
            !configured -> EmptyState("Conecte suas notícias", "Adicione a chave da Mediastack na configuração inicial para acompanhar as novidades.")
            loading -> LoadingState("Atualizando notícias…")
            error -> ErrorState("Não foi possível carregar as notícias", onRetry)
            articles.isEmpty() -> EmptyState("Nenhuma notícia por aqui", "As notícias disponíveis aparecerão aqui.")
            else -> articles.forEachIndexed { index, article ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClickLabel = "Ler notícia") { uriHandler.openUri(article.url) }
                        .padding(vertical = Spacing.xs),
                    verticalArrangement = Arrangement.spacedBy(Spacing.xs),
                ) {
                    Text(
                        text = article.title,
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Text(
                        text = listOf(article.source, article.publishedAt.take(10))
                            .filter { it.isNotBlank() }
                            .joinToString(" • "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (index < articles.lastIndex) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                }
            }
        }
    }
}
