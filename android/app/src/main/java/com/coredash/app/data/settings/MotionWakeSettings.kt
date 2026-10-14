package com.coredash.app.data.settings

const val DEFAULT_QUIET_PERIOD_SECONDS = 60
const val MIN_QUIET_PERIOD_SECONDS = 15
const val MAX_QUIET_PERIOD_SECONDS = 300

fun normalizeQuietPeriod(seconds: Int): Int =
    seconds.coerceIn(MIN_QUIET_PERIOD_SECONDS, MAX_QUIET_PERIOD_SECONDS)

/** Mean absolute difference in unsigned luminance units (0–255). */
enum class MotionSensitivity(val threshold: Double, val label: String) {
    LOW(18.0, "Baixa"),
    MEDIUM(10.0, "Média"),
    HIGH(5.0, "Alta"),
}
