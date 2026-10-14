package com.coredash.app.data.settings

const val DEFAULT_NEWS_COUNT = 10
const val MIN_NEWS_COUNT = 5
const val MAX_NEWS_COUNT = 25
const val DEFAULT_NEWS_TOPIC = "general"

val NEWS_TOPICS: List<String> = listOf(
    "general",
    "business",
    "technology",
    "science",
    "sports",
    "health",
    "entertainment",
)

fun normalizeCardOrder(stored: List<String>?): List<CardId> {
    val known = stored.orEmpty()
        .mapNotNull { value ->
            CardId.entries.firstOrNull { it.name.equals(value.trim(), ignoreCase = true) }
        }
        .distinct()
    return known + CardId.entries.filterNot { it in known }
}

fun normalizeNewsCount(value: Int?): Int =
    (value ?: DEFAULT_NEWS_COUNT).coerceIn(MIN_NEWS_COUNT, MAX_NEWS_COUNT)

fun normalizeNewsTopic(value: String?): String =
    NEWS_TOPICS.firstOrNull { it.equals(value?.trim(), ignoreCase = true) } ?: DEFAULT_NEWS_TOPIC

fun normalizeWeatherUnit(value: String?): WeatherUnit =
    WeatherUnit.entries.firstOrNull { it.name.equals(value?.trim(), ignoreCase = true) }
        ?: WeatherUnit.CELSIUS
