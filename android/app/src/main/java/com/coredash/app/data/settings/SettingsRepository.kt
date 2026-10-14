package com.coredash.app.data.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "coredash_settings")

class SettingsRepository(private val context: Context) {

    private object Keys {
        val TIMEZONE = stringPreferencesKey("timezone")
        val LATITUDE = doublePreferencesKey("latitude")
        val LONGITUDE = doublePreferencesKey("longitude")
        val CITY = stringPreferencesKey("city")
        val THEME = stringPreferencesKey("theme")
        val ACTIVE_CARDS = stringSetPreferencesKey("active_cards")
        val FOCUS_MODE = booleanPreferencesKey("focus_mode")
        val SELECTED_CALENDAR_IDS = stringSetPreferencesKey("selected_calendar_ids")
        val CALENDAR_DAYS = intPreferencesKey("calendar_days")
        val CARD_ORDER = stringPreferencesKey("card_order")
        val NEWS_COUNT = intPreferencesKey("news_count")
        val NEWS_TOPIC = stringPreferencesKey("news_topic")
        val WEATHER_UNIT = stringPreferencesKey("weather_unit")
    }

    val settingsFlow: Flow<AppSettings> = context.dataStore.data.map { prefs ->
        AppSettings(
            timezone = prefs[Keys.TIMEZONE] ?: "UTC",
            latitude = prefs[Keys.LATITUDE],
            longitude = prefs[Keys.LONGITUDE],
            city = prefs[Keys.CITY] ?: "",
            theme = prefs[Keys.THEME]
                ?.let { stored -> ThemeMode.entries.firstOrNull { it.name.equals(stored, ignoreCase = true) } }
                ?: ThemeMode.SYSTEM,
            activeCards = prefs[Keys.ACTIVE_CARDS]
                ?.mapNotNull { stored -> CardId.entries.firstOrNull { it.name.equals(stored, ignoreCase = true) } }
                ?.toSet()
                ?: CardId.DEFAULT_ACTIVE,
            focusMode = prefs[Keys.FOCUS_MODE] ?: false,
            selectedCalendarIds = prefs[Keys.SELECTED_CALENDAR_IDS]
                ?.mapNotNull { stored -> stored.toLongOrNull() }
                ?.toSet()
                ?: emptySet(),
            calendarDays = prefs[Keys.CALENDAR_DAYS] ?: 3,
            cardOrder = normalizeCardOrder(prefs[Keys.CARD_ORDER]?.split(",")),
            newsCount = normalizeNewsCount(prefs[Keys.NEWS_COUNT]),
            newsTopic = normalizeNewsTopic(prefs[Keys.NEWS_TOPIC]),
            weatherUnit = normalizeWeatherUnit(prefs[Keys.WEATHER_UNIT]),
        )
    }

    suspend fun setTimezone(timezone: String) {
        context.dataStore.edit { it[Keys.TIMEZONE] = timezone.trim() }
    }

    suspend fun setLocation(latitude: Double?, longitude: Double?) {
        context.dataStore.edit { prefs ->
            if (latitude == null) prefs.remove(Keys.LATITUDE) else prefs[Keys.LATITUDE] = latitude
            if (longitude == null) prefs.remove(Keys.LONGITUDE) else prefs[Keys.LONGITUDE] = longitude
        }
    }

    suspend fun setCity(city: String) {
        context.dataStore.edit { it[Keys.CITY] = city.trim() }
    }

    suspend fun setTheme(theme: ThemeMode) {
        context.dataStore.edit { it[Keys.THEME] = theme.name }
    }

    suspend fun setActiveCards(cards: Set<CardId>) {
        context.dataStore.edit { it[Keys.ACTIVE_CARDS] = cards.map { card -> card.name }.toSet() }
    }

    suspend fun setFocusMode(enabled: Boolean) {
        context.dataStore.edit { it[Keys.FOCUS_MODE] = enabled }
    }

    suspend fun setSelectedCalendarIds(ids: Set<Long>) {
        context.dataStore.edit { it[Keys.SELECTED_CALENDAR_IDS] = ids.map { id -> id.toString() }.toSet() }
    }

    suspend fun setCalendarDays(days: Int) {
        context.dataStore.edit { it[Keys.CALENDAR_DAYS] = days }
    }

    suspend fun setCardOrder(order: List<CardId>) {
        context.dataStore.edit {
            it[Keys.CARD_ORDER] = order.joinToString(",") { card -> card.name }
        }
    }

    suspend fun setNewsCount(count: Int) {
        context.dataStore.edit { it[Keys.NEWS_COUNT] = normalizeNewsCount(count) }
    }

    suspend fun setNewsTopic(topic: String) {
        context.dataStore.edit { it[Keys.NEWS_TOPIC] = normalizeNewsTopic(topic) }
    }

    suspend fun setWeatherUnit(unit: WeatherUnit) {
        context.dataStore.edit { it[Keys.WEATHER_UNIT] = unit.name }
    }
}
