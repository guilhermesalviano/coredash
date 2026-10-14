package com.coredash.app

import com.coredash.app.data.motion.LuminanceMotionDetector
import com.coredash.app.data.motion.meanAbsoluteLuminanceDifference
import com.coredash.app.data.settings.MotionSensitivity
import com.coredash.app.data.settings.normalizeQuietPeriod
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LuminanceDifferenceTest {
    @Test
    fun `identical frames have zero difference`() {
        val frame = byteArrayOf(0, 127, 128.toByte(), 255.toByte())
        assertEquals(0.0, meanAbsoluteLuminanceDifference(frame, frame), 0.0)
    }

    @Test
    fun `luminance bytes are unsigned and differences are averaged`() {
        assertEquals(127.5, meanAbsoluteLuminanceDifference(
            byteArrayOf(0, 255.toByte()), byteArrayOf(255.toByte(), 255.toByte()),
        ), 0.0)
        assertEquals(1.0, meanAbsoluteLuminanceDifference(byteArrayOf(127), byteArrayOf(128.toByte())), 0.0)
    }

    @Test
    fun `first frame establishes baseline and threshold is strictly exceeded`() {
        val detector = LuminanceMotionDetector()
        assertFalse(detector.detect(byteArrayOf(0, 0), 10.0))
        assertFalse(detector.detect(byteArrayOf(10, 10), 10.0))
        assertTrue(detector.detect(byteArrayOf(21, 21), 10.0))
        assertFalse(detector.detect(byteArrayOf(21, 21), 10.0))
    }

    @Test
    fun `small noise is rejected and high sensitivity detects smaller motion`() {
        for (sensitivity in MotionSensitivity.entries) {
            val detector = LuminanceMotionDetector()
            detector.detect(byteArrayOf(100, 100), sensitivity.threshold)
            assertFalse(detector.detect(byteArrayOf(101, 99), sensitivity.threshold))
        }
        val high = LuminanceMotionDetector()
        val low = LuminanceMotionDetector()
        high.detect(byteArrayOf(100), MotionSensitivity.HIGH.threshold)
        low.detect(byteArrayOf(100), MotionSensitivity.LOW.threshold)
        assertTrue(high.detect(byteArrayOf(110), MotionSensitivity.HIGH.threshold))
        assertFalse(low.detect(byteArrayOf(110), MotionSensitivity.LOW.threshold))
    }

    @Test
    fun `reset and resolution changes establish a new baseline`() {
        val detector = LuminanceMotionDetector()
        detector.detect(byteArrayOf(0), 5.0)
        assertFalse(detector.detect(byteArrayOf(100, 100), 5.0))
        detector.reset()
        assertFalse(detector.detect(byteArrayOf(0, 0), 5.0))
    }

    @Test
    fun `baseline is not affected by reusing the input array`() {
        val detector = LuminanceMotionDetector()
        val frame = byteArrayOf(0)
        detector.detect(frame, 10.0)
        frame[0] = 100
        assertTrue(detector.detect(frame, 10.0))
    }

    @Test(expected = IllegalArgumentException::class)
    fun `empty frames are rejected`() {
        meanAbsoluteLuminanceDifference(byteArrayOf(), byteArrayOf())
    }

    @Test(expected = IllegalArgumentException::class)
    fun `unequal sample counts are rejected`() {
        meanAbsoluteLuminanceDifference(byteArrayOf(0), byteArrayOf(0, 1))
    }

    @Test
    fun `quiet period is bounded to fifteen seconds through five minutes`() {
        assertEquals(15, normalizeQuietPeriod(-1))
        assertEquals(60, normalizeQuietPeriod(60))
        assertEquals(300, normalizeQuietPeriod(301))
    }
}
