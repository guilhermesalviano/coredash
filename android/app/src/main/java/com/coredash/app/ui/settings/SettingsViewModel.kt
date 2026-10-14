package com.coredash.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.coredash.app.AppContainer
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.CardId
import com.coredash.app.data.settings.SettingsRepository
import com.coredash.app.data.settings.ThemeMode
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    val settings: StateFlow<AppSettings> = settingsRepository.settingsFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = AppSettings(),
        )

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

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                SettingsViewModel(settingsRepository = container.settingsRepository)
            }
        }
    }
}
