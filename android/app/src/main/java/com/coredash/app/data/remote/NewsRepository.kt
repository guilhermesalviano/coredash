package com.coredash.app.data.remote

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import kotlinx.serialization.Serializable

data class NewsArticle(
    val title: String,
    val url: String,
    val source: String,
    val publishedAt: String,
)

@Serializable
internal data class MediastackResponse(
    val data: List<MediastackArticle> = emptyList(),
)

@Serializable
internal data class MediastackArticle(
    val title: String = "",
    val url: String = "",
    val source: String = "",
    val published_at: String = "",
)

class NewsRepository(
    private val client: HttpClient,
    private val baseUrl: String = "http://api.mediastack.com",
) {

    suspend fun getNews(
        accessKey: String,
        limit: Int = 10,
    ): Result<List<NewsArticle>> = runCatching {
        val response: MediastackResponse = client.get("$baseUrl/v1/news") {
            parameter("access_key", accessKey)
            parameter("languages", "pt,en")
            parameter("limit", limit)
        }.body()

        response.data.map { article ->
            NewsArticle(
                title = article.title,
                url = article.url,
                source = article.source,
                publishedAt = article.published_at,
            )
        }
    }
}
