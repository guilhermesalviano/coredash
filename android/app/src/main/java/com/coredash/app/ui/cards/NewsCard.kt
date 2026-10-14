package com.coredash.app.ui.cards

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.coredash.app.data.remote.NewsArticle

@Composable
fun NewsCard(
    articles: List<NewsArticle>,
    configured: Boolean,
    error: Boolean,
) {
    val uriHandler = LocalUriHandler.current

    DashboardCard(title = "Notícias") {
        when {
            !configured -> HintText("Configure a chave da Mediastack para ver as notícias.")
            error -> ErrorText("Erro ao carregar as notícias")
            articles.isEmpty() -> HintText("Nenhuma notícia disponível")
            else -> articles.forEach { article ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { uriHandler.openUri(article.url) },
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        text = article.title,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Text(
                        text = listOf(article.source, article.publishedAt.take(10))
                            .filter { it.isNotBlank() }
                            .joinToString(" • "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
