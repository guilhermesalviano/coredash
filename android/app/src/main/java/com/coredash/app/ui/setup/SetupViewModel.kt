package com.coredash.app.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.coredash.app.AppContainer
import com.coredash.app.data.settings.SecretStore
import com.coredash.app.data.settings.SettingsRepository
import com.coredash.app.data.settings.SetupValidation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.ZoneId

data class SetupUiState(
    val timezone: String = "",
    val latitude: String = "",
    val longitude: String = "",
    val city: String = "",
    val tickers: String = "",
    val mediastackApiKey: String = "",
    val serpApiKey: String = "",
    val brapiToken: String = "",
    val googleServiceAccountJson: String = "",
    val googleCalendarId: String = "",
    val gmailClientId: String = "",
    val gmailClientSecret: String = "",
    val gmailRefreshToken: String = "",
    val errors: List<String> = emptyList(),
    val isLoading: Boolean = true,
    val isSaved: Boolean = false,
)

class SetupViewModel(
    private val settingsRepository: SettingsRepository,
    private val secretStore: SecretStore,
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        SetupUiState(timezone = ZoneId.systemDefault().id),
    )
    val uiState: StateFlow<SetupUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val loaded = withContext(Dispatchers.IO) { loadInitialState() }
            _uiState.update { current ->
                loaded.copy(errors = current.errors, isSaved = current.isSaved)
            }
        }
    }

    private suspend fun loadInitialState(): SetupUiState {
        val settings = settingsRepository.settingsFlow.first()
        val defaultTimezone = ZoneId.systemDefault().id

        return SetupUiState(
            timezone = if (SetupValidation.isComplete(settings)) settings.timezone else defaultTimezone,
            latitude = settings.latitude?.toString().orEmpty(),
            longitude = settings.longitude?.toString().orEmpty(),
            city = settings.city,
            tickers = settings.stockTickers.joinToString(", "),
            mediastackApiKey = secretStore.getMediastackApiKey().orEmpty(),
            serpApiKey = secretStore.getSerpApiKey().orEmpty(),
            brapiToken = secretStore.getBrapiToken().orEmpty(),
            googleServiceAccountJson = secretStore.getGoogleServiceAccountJson().orEmpty(),
            googleCalendarId = secretStore.getGoogleCalendarId().orEmpty(),
            gmailClientId = secretStore.getGmailClientId().orEmpty(),
            gmailClientSecret = secretStore.getGmailClientSecret().orEmpty(),
            gmailRefreshToken = secretStore.getGmailRefreshToken().orEmpty(),
            isLoading = false,
        )
    }

    fun onTimezoneChange(value: String) = _uiState.update { it.copy(timezone = value) }

    fun onLatitudeChange(value: String) = _uiState.update { it.copy(latitude = value) }

    fun onLongitudeChange(value: String) = _uiState.update { it.copy(longitude = value) }

    fun onCityChange(value: String) = _uiState.update { it.copy(city = value) }

    fun onTickersChange(value: String) = _uiState.update { it.copy(tickers = value) }

    fun onMediastackApiKeyChange(value: String) = _uiState.update { it.copy(mediastackApiKey = value) }

    fun onSerpApiKeyChange(value: String) = _uiState.update { it.copy(serpApiKey = value) }

    fun onBrapiTokenChange(value: String) = _uiState.update { it.copy(brapiToken = value) }

    fun onGoogleServiceAccountJsonChange(value: String) = _uiState.update { it.copy(googleServiceAccountJson = value) }

    fun onGoogleCalendarIdChange(value: String) = _uiState.update { it.copy(googleCalendarId = value) }

    fun onGmailClientIdChange(value: String) = _uiState.update { it.copy(gmailClientId = value) }

    fun onGmailClientSecretChange(value: String) = _uiState.update { it.copy(gmailClientSecret = value) }

    fun onGmailRefreshTokenChange(value: String) = _uiState.update { it.copy(gmailRefreshToken = value) }

    fun save() {
        val current = _uiState.value
        val errors = SetupValidation.validate(
            timezone = current.timezone,
            lat = current.latitude,
            lon = current.longitude,
        )

        if (errors.isNotEmpty()) {
            _uiState.update { it.copy(errors = errors) }
            return
        }

        val latitude = current.latitude.trim().toDouble()
        val longitude = current.longitude.trim().toDouble()

        viewModelScope.launch {
            settingsRepository.setTimezone(current.timezone.trim())
            settingsRepository.setLocation(latitude, longitude)
            settingsRepository.setCity(current.city)
            settingsRepository.setStockTickers(parseTickers(current.tickers))

            secretStore.setMediastackApiKey(current.mediastackApiKey.trim().ifEmpty { null })
            secretStore.setSerpApiKey(current.serpApiKey.trim().ifEmpty { null })
            secretStore.setBrapiToken(current.brapiToken.trim().ifEmpty { null })
            secretStore.setGoogleServiceAccountJson(current.googleServiceAccountJson.trim().ifEmpty { null })
            secretStore.setGoogleCalendarId(current.googleCalendarId.trim().ifEmpty { null })
            secretStore.setGmailClientId(current.gmailClientId.trim().ifEmpty { null })
            secretStore.setGmailClientSecret(current.gmailClientSecret.trim().ifEmpty { null })
            secretStore.setGmailRefreshToken(current.gmailRefreshToken.trim().ifEmpty { null })

            _uiState.update { it.copy(errors = emptyList(), isSaved = true) }
        }
    }

    private fun parseTickers(raw: String): List<String> = raw
        .split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                SetupViewModel(
                    settingsRepository = container.settingsRepository,
                    secretStore = container.secretStore,
                )
            }
        }
    }
}
