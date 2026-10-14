package com.coredash.app.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.coredash.app.AppContainer
import com.coredash.app.data.location.DeviceLocation
import com.coredash.app.data.location.DeviceLocationProvider
import com.coredash.app.data.location.LocationDisabledException
import com.coredash.app.data.location.LocationPermissionException
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
    val mediastackApiKey: String = "",
    val serpApiKey: String = "",
    val gmailClientId: String = "",
    val gmailClientSecret: String = "",
    val gmailRefreshToken: String = "",
    val errors: List<String> = emptyList(),
    val isLoading: Boolean = true,
    val isSaved: Boolean = false,
    val isLocating: Boolean = false,
    val locationMessage: String? = null,
)

class SetupViewModel(
    private val settingsRepository: SettingsRepository,
    private val secretStore: SecretStore,
    private val locationProvider: DeviceLocationProvider,
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
            mediastackApiKey = secretStore.getMediastackApiKey().orEmpty(),
            serpApiKey = secretStore.getSerpApiKey().orEmpty(),
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

    fun onMediastackApiKeyChange(value: String) = _uiState.update { it.copy(mediastackApiKey = value) }

    fun onSerpApiKeyChange(value: String) = _uiState.update { it.copy(serpApiKey = value) }

    fun onGmailClientIdChange(value: String) = _uiState.update { it.copy(gmailClientId = value) }

    fun onGmailClientSecretChange(value: String) = _uiState.update { it.copy(gmailClientSecret = value) }

    fun onGmailRefreshTokenChange(value: String) = _uiState.update { it.copy(gmailRefreshToken = value) }

    fun onLocationPermissionDenied() {
        _uiState.update { it.copy(locationMessage = "Permissão de localização negada.") }
    }

    fun useMyLocation() {
        if (_uiState.value.isLocating) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLocating = true, locationMessage = null) }
            locationProvider.current()
                .onSuccess { location -> onLocationLoaded(location) }
                .onFailure { error ->
                    _uiState.update { it.copy(locationMessage = locationMessageFor(error)) }
                }
            _uiState.update { it.copy(isLocating = false) }
        }
    }

    private fun onLocationLoaded(location: DeviceLocation) {
        _uiState.update { current ->
            current.copy(
                timezone = location.timezone,
                latitude = location.lat.toString(),
                longitude = location.lon.toString(),
                city = location.city ?: current.city,
                errors = emptyList(),
                locationMessage = null,
            )
        }
    }

    private fun locationMessageFor(error: Throwable): String = when (error) {
        is LocationDisabledException ->
            "Localização desativada. Ative a localização do dispositivo e tente novamente."
        is LocationPermissionException -> "Permissão de localização negada."
        else -> "Não foi possível obter sua localização."
    }

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

            secretStore.setMediastackApiKey(current.mediastackApiKey.trim().ifEmpty { null })
            secretStore.setSerpApiKey(current.serpApiKey.trim().ifEmpty { null })
            secretStore.setGmailClientId(current.gmailClientId.trim().ifEmpty { null })
            secretStore.setGmailClientSecret(current.gmailClientSecret.trim().ifEmpty { null })
            secretStore.setGmailRefreshToken(current.gmailRefreshToken.trim().ifEmpty { null })

            _uiState.update { it.copy(errors = emptyList(), isSaved = true) }
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                SetupViewModel(
                    settingsRepository = container.settingsRepository,
                    secretStore = container.secretStore,
                    locationProvider = container.locationProvider,
                )
            }
        }
    }
}
