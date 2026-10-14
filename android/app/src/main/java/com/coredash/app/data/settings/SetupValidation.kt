package com.coredash.app.data.settings

import java.time.ZoneId

object SetupValidation {

    fun validate(timezone: String, lat: String, lon: String): List<String> {
        val errors = mutableListOf<String>()

        if (timezone.isBlank()) {
            errors += "timezone is required"
        } else {
            runCatching { ZoneId.of(timezone.trim()) }
                .onFailure { errors += "timezone must be a valid IANA timezone" }
        }

        val latitude = lat.trim().toDoubleOrNull()
        if (latitude == null || latitude.isNaN() || latitude < -90.0 || latitude > 90.0) {
            errors += "latitude must be a number between -90 and 90"
        }

        val longitude = lon.trim().toDoubleOrNull()
        if (longitude == null || longitude.isNaN() || longitude < -180.0 || longitude > 180.0) {
            errors += "longitude must be a number between -180 and 180"
        }

        return errors
    }

    fun isComplete(settings: AppSettings): Boolean = validate(
        timezone = settings.timezone,
        lat = settings.latitude?.toString() ?: "",
        lon = settings.longitude?.toString() ?: "",
    ).isEmpty()
}
