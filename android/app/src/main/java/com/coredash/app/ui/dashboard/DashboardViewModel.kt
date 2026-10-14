package com.coredash.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.coredash.app.AppContainer
import com.coredash.app.data.calendar.CalendarEvent
import com.coredash.app.data.calendar.DeviceCalendarRepository
import com.coredash.app.data.remote.NewsArticle
import com.coredash.app.data.remote.NewsRepository
import com.coredash.app.data.remote.Weather
import com.coredash.app.data.remote.WeatherRepository
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.SecretStore
import com.coredash.app.data.settings.SettingsRepository
import com.coredash.app.data.todo.Recurrence
import com.coredash.app.data.todo.TodoEntity
import com.coredash.app.data.todo.TodoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

data class DashboardUiState(
    val settings: AppSettings? = null,
    val todos: List<TodoEntity> = emptyList(),
    val weather: Weather? = null,
    val weatherError: Boolean = false,
    val news: List<NewsArticle> = emptyList(),
    val newsConfigured: Boolean = false,
    val newsError: Boolean = false,
    val calendarEvents: List<CalendarEvent> = emptyList(),
    val calendarLoading: Boolean = false,
)

class DashboardViewModel(
    private val settingsRepository: SettingsRepository,
    private val todoRepository: TodoRepository,
    private val weatherRepository: WeatherRepository,
    private val newsRepository: NewsRepository,
    private val calendarRepository: DeviceCalendarRepository,
    private val secretStore: SecretStore,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var remoteKey: String? = null

    init {
        viewModelScope.launch {
            settingsRepository.settingsFlow.collect { settings ->
                _uiState.update { it.copy(settings = settings) }
                loadRemote(settings)
            }
        }
        viewModelScope.launch {
            todoRepository.observe().collect { todos ->
                _uiState.update { it.copy(todos = todos) }
            }
        }
    }

    fun toggleFocusMode() {
        val current = _uiState.value.settings?.focusMode ?: return
        viewModelScope.launch { settingsRepository.setFocusMode(!current) }
    }

    fun toggleTodoComplete(id: Long) {
        viewModelScope.launch { todoRepository.toggleComplete(id) }
    }

    fun deleteTodo(id: Long) {
        viewModelScope.launch { todoRepository.deleteById(id) }
    }

    fun loadCalendar(calendarIds: Set<Long>, days: Int) {
        _uiState.update { it.copy(calendarLoading = true) }
        viewModelScope.launch {
            val events = calendarRepository.upcomingEvents(calendarIds, days)
            _uiState.update { it.copy(calendarEvents = events, calendarLoading = false) }
        }
    }

    fun addTodo(title: String, priority: String, dueDate: LocalDate?, recurrence: Recurrence) {
        if (title.isBlank()) return
        viewModelScope.launch {
            todoRepository.add(
                TodoEntity(
                    title = title.trim(),
                    priority = priority,
                    dueDate = dueDate?.toEpochDay(),
                    recurrence = recurrence.name,
                ),
            )
        }
    }

    private fun loadRemote(settings: AppSettings) {
        val mediastackKey = secretStore.getMediastackApiKey()?.takeIf { it.isNotBlank() }

        _uiState.update {
            it.copy(
                newsConfigured = mediastackKey != null,
            )
        }

        val key = listOf(
            settings.latitude,
            settings.longitude,
            settings.timezone,
            mediastackKey,
            settings.newsCount,
            settings.newsTopic,
            settings.weatherUnit,
        ).joinToString("|")
        if (key == remoteKey) return
        remoteKey = key

        val latitude = settings.latitude
        val longitude = settings.longitude
        if (latitude != null && longitude != null) {
            viewModelScope.launch {
                weatherRepository.getWeather(latitude, longitude, settings.timezone, settings.weatherUnit)
                    .onSuccess { weather -> _uiState.update { it.copy(weather = weather, weatherError = false) } }
                    .onFailure { _uiState.update { it.copy(weatherError = true) } }
            }
        } else {
            _uiState.update { it.copy(weather = null, weatherError = false) }
        }

        if (mediastackKey != null) {
            viewModelScope.launch {
                newsRepository.getNews(mediastackKey, settings.newsCount, settings.newsTopic)
                    .onSuccess { news -> _uiState.update { it.copy(news = news, newsError = false) } }
                    .onFailure { _uiState.update { it.copy(newsError = true) } }
            }
        } else {
            _uiState.update { it.copy(news = emptyList(), newsError = false) }
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                DashboardViewModel(
                    settingsRepository = container.settingsRepository,
                    todoRepository = container.todoRepository,
                    weatherRepository = container.weatherRepository,
                    newsRepository = container.newsRepository,
                    calendarRepository = container.calendarRepository,
                    secretStore = container.secretStore,
                )
            }
        }
    }
}
