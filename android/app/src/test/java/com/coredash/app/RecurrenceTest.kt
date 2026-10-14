package com.coredash.app

import com.coredash.app.data.todo.Recurrence
import com.coredash.app.data.todo.nextDueDate
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class RecurrenceTest {

    @Test
    fun `NONE has no next due date`() {
        assertNull(nextDueDate(LocalDate.of(2024, 1, 31), Recurrence.NONE))
    }

    @Test
    fun `DAILY advances one day`() {
        assertEquals(
            LocalDate.of(2024, 1, 2),
            nextDueDate(LocalDate.of(2024, 1, 1), Recurrence.DAILY),
        )
    }

    @Test
    fun `DAILY advances to next month`() {
        assertEquals(
            LocalDate.of(2024, 2, 1),
            nextDueDate(LocalDate.of(2024, 1, 31), Recurrence.DAILY),
        )
    }

    @Test
    fun `WEEKLY advances seven days`() {
        assertEquals(
            LocalDate.of(2024, 1, 8),
            nextDueDate(LocalDate.of(2024, 1, 1), Recurrence.WEEKLY),
        )
    }

    @Test
    fun `MONTHLY advances one month keeping the day`() {
        assertEquals(
            LocalDate.of(2024, 2, 15),
            nextDueDate(LocalDate.of(2024, 1, 15), Recurrence.MONTHLY),
        )
    }

    @Test
    fun `MONTHLY clamps Jan 31 to leap February end`() {
        assertEquals(
            LocalDate.of(2024, 2, 29),
            nextDueDate(LocalDate.of(2024, 1, 31), Recurrence.MONTHLY),
        )
    }

    @Test
    fun `MONTHLY clamps Jan 31 to non-leap February end`() {
        assertEquals(
            LocalDate.of(2023, 2, 28),
            nextDueDate(LocalDate.of(2023, 1, 31), Recurrence.MONTHLY),
        )
    }

    @Test
    fun `from parses enum names case-insensitively`() {
        assertEquals(Recurrence.DAILY, Recurrence.from("daily"))
        assertEquals(Recurrence.WEEKLY, Recurrence.from("  Weekly "))
        assertEquals(Recurrence.MONTHLY, Recurrence.from("MONTHLY"))
    }

    @Test
    fun `from falls back to NONE for null or unknown values`() {
        assertEquals(Recurrence.NONE, Recurrence.from(null))
        assertEquals(Recurrence.NONE, Recurrence.from(""))
        assertEquals(Recurrence.NONE, Recurrence.from("yearly"))
    }
}
