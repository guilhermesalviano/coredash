package com.coredash.app.data.remote

import com.coredash.app.data.settings.WeatherUnit
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.url
import kotlinx.serialization.Serializable

data class DailyForecast(
    val date: String,
    val max: Double,
    val min: Double,
    val weatherCode: Int,
)

data class Weather(
    val temperature: Double,
    val weatherCode: Int,
    val windSpeed: Double,
    val daily: List<DailyForecast>,
)

@Serializable
internal data class OpenMeteoResponse(
    val current: CurrentDto? = null,
    val daily: DailyDto? = null,
)

@Serializable
internal data class CurrentDto(
    val temperature_2m: Double? = null,
    val weather_code: Int? = null,
    val wind_speed_10m: Double? = null,
)

@Serializable
internal data class DailyDto(
    val time: List<String> = emptyList(),
    val weather_code: List<Int> = emptyList(),
    val temperature_2m_max: List<Double> = emptyList(),
    val temperature_2m_min: List<Double> = emptyList(),
)

class WeatherRepository(
    private val client: HttpClient,
    private val baseUrl: String = "https://api.open-meteo.com/v1/forecast",
) {

    suspend fun getWeather(
        latitude: Double,
        longitude: Double,
        timezone: String = "UTC",
        temperatureUnit: WeatherUnit = WeatherUnit.CELSIUS,
    ): Result<Weather> = runCatching {
        val response: OpenMeteoResponse = client.get(baseUrl) {
            url {
                parameters.append("latitude", latitude.toString())
                parameters.append("longitude", longitude.toString())
                parameters.append("current", "temperature_2m,weather_code,wind_speed_10m")
                parameters.append("daily", "weather_code,temperature_2m_max,temperature_2m_min")
                parameters.append("forecast_days", "5")
                parameters.append("timezone", timezone)
                parameters.append("temperature_unit", temperatureUnit.apiValue)
            }
        }.body()

        val current = response.current ?: error("Open-Meteo response missing current weather")
        val daily = response.daily

        Weather(
            temperature = current.temperature_2m ?: 0.0,
            weatherCode = current.weather_code ?: 0,
            windSpeed = current.wind_speed_10m ?: 0.0,
            daily = daily?.let { d ->
                d.time.indices.map { index ->
                    DailyForecast(
                        date = d.time[index],
                        max = d.temperature_2m_max.getOrElse(index) { 0.0 },
                        min = d.temperature_2m_min.getOrElse(index) { 0.0 },
                        weatherCode = d.weather_code.getOrElse(index) { 0 },
                    )
                }
            } ?: emptyList(),
        )
    }
}
