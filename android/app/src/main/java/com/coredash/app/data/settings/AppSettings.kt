package com.coredash.app.data.settings

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}

enum class WeatherUnit {
    CELSIUS,
    FAHRENHEIT,
    ;

    val apiValue: String
        get() = when (this) {
            CELSIUS -> "celsius"
            FAHRENHEIT -> "fahrenheit"
        }
}

enum class CardId {
    WEATHER,
    CALENDAR,
    GMAIL,
    TODO,
    NEWS,
    ;

    companion object {
        val DEFAULT_ACTIVE: Set<CardId> = setOf(WEATHER, CALENDAR, GMAIL, TODO)
        val DEFAULT_ORDER: List<CardId> = entries.toList()
    }
}

data class AppSettings(
    val motionWakeEnabled: Boolean = false,
    val quietPeriodSeconds: Int = DEFAULT_QUIET_PERIOD_SECONDS,
    val motionSensitivity: MotionSensitivity = MotionSensitivity.MEDIUM,
    val timezone: String = "UTC",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String = "",
    val theme: ThemeMode = ThemeMode.SYSTEM,
    val activeCards: Set<CardId> = CardId.DEFAULT_ACTIVE,
    val focusMode: Boolean = false,
    val selectedCalendarIds: Set<Long> = emptySet(),
    val calendarDays: Int = 3,
    val cardOrder: List<CardId> = CardId.DEFAULT_ORDER,
    val newsCount: Int = DEFAULT_NEWS_COUNT,
    val newsTopic: String = DEFAULT_NEWS_TOPIC,
    val weatherUnit: WeatherUnit = WeatherUnit.CELSIUS,
)
