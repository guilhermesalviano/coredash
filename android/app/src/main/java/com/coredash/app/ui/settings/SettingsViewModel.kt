package com.coredash.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.coredash.app.AppContainer
import com.coredash.app.data.calendar.DeviceCalendar
import com.coredash.app.data.calendar.DeviceCalendarRepository
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.MotionSensitivity
import com.coredash.app.data.settings.CardId
import com.coredash.app.data.settings.SettingsRepository
import com.coredash.app.data.settings.ThemeMode
import com.coredash.app.data.settings.WeatherUnit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    private val calendarRepository: DeviceCalendarRepository,
) : ViewModel() {

    val settings: StateFlow<AppSettings> = settingsRepository.settingsFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = AppSettings(),
        )

    private val _calendars = MutableStateFlow<List<DeviceCalendar>>(emptyList())
    val calendars: StateFlow<List<DeviceCalendar>> = _calendars.asStateFlow()

    fun setMotionWakeEnabled(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setMotionWakeEnabled(enabled) }
    }

    fun setQuietPeriod(seconds: Int) {
        viewModelScope.launch { settingsRepository.setQuietPeriod(seconds) }
    }

    fun setMotionSensitivity(sensitivity: MotionSensitivity) {
        viewModelScope.launch { settingsRepository.setMotionSensitivity(sensitivity) }
    }

    fun setTheme(theme: ThemeMode) {
        viewModelScope.launch { settingsRepository.setTheme(theme) }
    }

    fun setCardEnabled(cardId: CardId, enabled: Boolean) {
        viewModelScope.launch {
            val current = settings.value.activeCards
            settingsRepository.setActiveCards(
                if (enabled) current + cardId else current - cardId,
            )
        }
    }

    fun moveCard(cardId: CardId, up: Boolean) {
        viewModelScope.launch {
            val order = settings.value.cardOrder.toMutableList()
            val index = order.indexOf(cardId)
            if (index < 0) return@launch
            val target = if (up) index - 1 else index + 1
            if (target !in order.indices) return@launch
            order.add(target, order.removeAt(index))
            settingsRepository.setCardOrder(order)
        }
    }

    fun setNewsCount(count: Int) {
        viewModelScope.launch { settingsRepository.setNewsCount(count) }
    }

    fun setNewsTopic(topic: String) {
        viewModelScope.launch { settingsRepository.setNewsTopic(topic) }
    }

    fun setCalendarDays(days: Int) {
        viewModelScope.launch { settingsRepository.setCalendarDays(days) }
    }

    fun setWeatherUnit(unit: WeatherUnit) {
        viewModelScope.launch { settingsRepository.setWeatherUnit(unit) }
    }

    fun loadCalendars() {
        viewModelScope.launch {
            _calendars.value = calendarRepository.listCalendars()
        }
    }

    fun setCalendarSelected(id: Long, selected: Boolean) {
        viewModelScope.launch {
            val current = settings.value.selectedCalendarIds
            settingsRepository.setSelectedCalendarIds(
                if (selected) current + id else current - id,
            )
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                SettingsViewModel(
                    settingsRepository = container.settingsRepository,
                    calendarRepository = container.calendarRepository,
                )
            }
        }
    }
}
