package com.coredash.app

import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.SetupValidation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SetupValidationTest {

    @Test
    fun `valid timezone and coordinates produce no errors`() {
        assertTrue(SetupValidation.validate("America/Sao_Paulo", "-23.55", "-46.63").isEmpty())
    }

    @Test
    fun `invalid timezone is rejected`() {
        val errors = SetupValidation.validate("Mars/Olympus", "0", "0")
        assertTrue(errors.contains("timezone must be a valid IANA timezone"))
    }

    @Test
    fun `blank timezone is rejected`() {
        val errors = SetupValidation.validate("   ", "0", "0")
        assertTrue(errors.contains("timezone is required"))
    }

    @Test
    fun `latitude out of range is rejected`() {
        val high = SetupValidation.validate("UTC", "90.1", "0")
        assertTrue(high.contains("latitude must be a number between -90 and 90"))

        val low = SetupValidation.validate("UTC", "-90.1", "0")
        assertTrue(low.contains("latitude must be a number between -90 and 90"))
    }

    @Test
    fun `longitude out of range is rejected`() {
        val high = SetupValidation.validate("UTC", "0", "180.1")
        assertTrue(high.contains("longitude must be a number between -180 and 180"))

        val low = SetupValidation.validate("UTC", "0", "-180.1")
        assertTrue(low.contains("longitude must be a number between -180 and 180"))
    }

    @Test
    fun `non-numeric coordinates are rejected`() {
        val errors = SetupValidation.validate("UTC", "abc", "12x")
        assertTrue(errors.contains("latitude must be a number between -90 and 90"))
        assertTrue(errors.contains("longitude must be a number between -180 and 180"))
    }

    @Test
    fun `isComplete reflects validity of settings`() {
        val valid = AppSettings(timezone = "UTC", latitude = 10.0, longitude = 20.0)
        assertTrue(SetupValidation.isComplete(valid))

        val missingCoordinates = AppSettings(timezone = "UTC")
        assertFalse(SetupValidation.isComplete(missingCoordinates))
    }

    @Test
    fun `boundary coordinates are accepted`() {
        assertEquals(emptyList<String>(), SetupValidation.validate("UTC", "90", "180"))
        assertEquals(emptyList<String>(), SetupValidation.validate("UTC", "-90", "-180"))
    }
}
