package com.coredash.app.data.remote

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import kotlinx.serialization.Serializable

data class Stock(
    val symbol: String,
    val price: Double,
    val changePercent: Double,
)

@Serializable
internal data class BrapiResponse(
    val results: List<BrapiResult> = emptyList(),
)

@Serializable
internal data class BrapiResult(
    val symbol: String = "",
    val regularMarketPrice: Double? = null,
    val regularMarketChangePercent: Double? = null,
)

class StocksRepository(
    private val client: HttpClient,
    private val baseUrl: String = "https://brapi.dev",
) {

    suspend fun getQuotes(
        tickers: List<String>,
        token: String? = null,
    ): Result<List<Stock>> = runCatching {
        val path = tickers.map { it.trim() }.filter { it.isNotEmpty() }.joinToString(",")
        if (path.isEmpty()) return@runCatching emptyList()

        val response: BrapiResponse = client.get("$baseUrl/api/quote/$path") {
            if (!token.isNullOrBlank()) parameter("token", token)
        }.body()

        response.results.map { result ->
            Stock(
                symbol = result.symbol,
                price = result.regularMarketPrice ?: 0.0,
                changePercent = result.regularMarketChangePercent ?: 0.0,
            )
        }
    }
}
