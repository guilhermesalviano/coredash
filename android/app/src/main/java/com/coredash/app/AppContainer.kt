package com.coredash.app

import android.content.Context
import com.coredash.app.data.calendar.DeviceCalendarRepository
import com.coredash.app.data.location.DeviceLocationProvider
import com.coredash.app.data.remote.HttpClientFactory
import com.coredash.app.data.remote.NewsRepository
import com.coredash.app.data.remote.WeatherRepository
import com.coredash.app.data.settings.SecretStore
import com.coredash.app.data.settings.SettingsRepository
import com.coredash.app.data.todo.AppDatabase
import com.coredash.app.data.todo.TodoRepository
import io.ktor.client.HttpClient

class AppContainer(context: Context) {

    private val appContext: Context = context.applicationContext

    val httpClient: HttpClient = HttpClientFactory.create()

    val database: AppDatabase = AppDatabase.get(appContext)

    val todoRepository: TodoRepository = TodoRepository(database.todoDao())

    val settingsRepository: SettingsRepository = SettingsRepository(appContext)

    val calendarRepository: DeviceCalendarRepository = DeviceCalendarRepository(appContext)

    val locationProvider: DeviceLocationProvider = DeviceLocationProvider(appContext)

    val secretStore: SecretStore = SecretStore(appContext)

    val weatherRepository: WeatherRepository = WeatherRepository(httpClient)

    val newsRepository: NewsRepository = NewsRepository(httpClient)
}
