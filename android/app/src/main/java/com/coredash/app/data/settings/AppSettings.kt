package com.coredash.app.data.settings

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}

enum class CardId {
    WEATHER,
    CALENDAR,
    GMAIL,
    TODO,
    STOCKS,
    NEWS,
    ;

    companion object {
        val DEFAULT_ACTIVE: Set<CardId> = setOf(WEATHER, CALENDAR, GMAIL, TODO)
    }
}

data class AppSettings(
    val timezone: String = "UTC",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String = "",
    val theme: ThemeMode = ThemeMode.SYSTEM,
    val activeCards: Set<CardId> = CardId.DEFAULT_ACTIVE,
    val focusMode: Boolean = false,
    val stockTickers: List<String> = emptyList(),
)
