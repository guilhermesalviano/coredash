package com.coredash.app.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.time.ZoneId
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import kotlin.coroutines.resume

data class DeviceLocation(
    val lat: Double,
    val lon: Double,
    val city: String?,
    val timezone: String,
)

class LocationDisabledException : Exception("location-disabled")

class LocationUnavailableException : Exception("location-unavailable")

class LocationPermissionException : SecurityException("location-permission-denied")

class DeviceLocationProvider(private val context: Context) {

    private val locationManager: LocationManager? =
        context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

    private val callbackExecutor: Executor = Executors.newSingleThreadExecutor()

    suspend fun current(): Result<DeviceLocation> = withContext(Dispatchers.IO) {
        runCatching {
            val manager = locationManager ?: throw LocationUnavailableException()
            if (!hasLocationPermission()) throw LocationPermissionException()

            val enabledProviders = listOf(
                LocationManager.NETWORK_PROVIDER,
                LocationManager.GPS_PROVIDER,
                LocationManager.PASSIVE_PROVIDER,
            ).filter(manager::isProviderEnabled)

            if (enabledProviders.isEmpty()) throw LocationDisabledException()

            val location = fetchLocation(manager, enabledProviders)
                ?: throw LocationUnavailableException()

            DeviceLocation(
                lat = location.latitude,
                lon = location.longitude,
                city = resolveCity(location),
                timezone = ZoneId.systemDefault().id,
            )
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun fetchLocation(
        manager: LocationManager,
        providers: List<String>,
    ): Location? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            for (provider in providers) {
                val location = awaitCurrentLocation(manager, provider)
                if (location != null) return location
            }
        }
        return providers.firstNotNullOfOrNull { manager.getLastKnownLocation(it) }
    }

    @SuppressLint("MissingPermission")
    private suspend fun awaitCurrentLocation(
        manager: LocationManager,
        provider: String,
    ): Location? = suspendCancellableCoroutine { continuation ->
        val signal = CancellationSignal()
        continuation.invokeOnCancellation { signal.cancel() }
        manager.getCurrentLocation(
            provider,
            signal,
            callbackExecutor,
        ) { location -> continuation.resume(location) }
    }

    @Suppress("DEPRECATION")
    private fun resolveCity(location: Location): String? {
        if (!Geocoder.isPresent()) return null
        return runCatching {
            Geocoder(context)
                .getFromLocation(location.latitude, location.longitude, 1)
                ?.firstOrNull()
                ?.locality
        }.getOrNull()
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
}
