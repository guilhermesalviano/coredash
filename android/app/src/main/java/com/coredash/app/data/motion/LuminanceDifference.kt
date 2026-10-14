package com.coredash.app.data.motion

import kotlin.math.abs

/** Y-plane bytes are unsigned. No Android types, image retention, or network access. */
fun meanAbsoluteLuminanceDifference(previous: ByteArray, current: ByteArray): Double {
    require(previous.isNotEmpty()) { "Frames must not be empty" }
    require(previous.size == current.size) { "Frames must have equal sample counts" }
    var total = 0L
    for (index in current.indices) {
        total += abs((previous[index].toInt() and 0xff) - (current[index].toInt() and 0xff))
    }
    return total.toDouble() / current.size
}

class LuminanceMotionDetector {
    private var previous: ByteArray? = null

    /** A first frame or changed resolution establishes a baseline, never motion. */
    fun detect(samples: ByteArray, threshold: Double): Boolean {
        require(samples.isNotEmpty())
        require(threshold in 0.0..255.0)
        val baseline = previous
        previous = samples.copyOf()
        return baseline != null && baseline.size == samples.size &&
            meanAbsoluteLuminanceDifference(baseline, samples) > threshold
    }

    fun reset() {
        previous = null
    }
}
