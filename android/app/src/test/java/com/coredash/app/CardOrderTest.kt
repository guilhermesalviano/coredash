package com.coredash.app

import com.coredash.app.data.settings.CardId
import com.coredash.app.data.settings.normalizeCardOrder
import org.junit.Assert.assertEquals
import org.junit.Test

class CardOrderTest {

    @Test
    fun `null stored order falls back to enum order`() {
        assertEquals(CardId.entries.toList(), normalizeCardOrder(null))
    }

    @Test
    fun `empty stored order falls back to enum order`() {
        assertEquals(CardId.entries.toList(), normalizeCardOrder(emptyList()))
    }

    @Test
    fun `stored order is preserved`() {
        assertEquals(
            listOf(CardId.NEWS, CardId.TODO, CardId.WEATHER, CardId.CALENDAR, CardId.GMAIL),
            normalizeCardOrder(listOf("NEWS", "TODO", "WEATHER", "CALENDAR", "GMAIL")),
        )
    }

    @Test
    fun `unknown ids are ignored and missing ids are appended`() {
        val normalized = normalizeCardOrder(listOf("NEWS", "BOGUS", "weather"))

        assertEquals(listOf(CardId.NEWS, CardId.WEATHER), normalized.take(2))
        assertEquals(CardId.entries.toSet(), normalized.toSet())
        assertEquals(CardId.entries.size, normalized.size)
    }

    @Test
    fun `duplicate ids are removed`() {
        val normalized = normalizeCardOrder(listOf("news", "NEWS", "News"))

        assertEquals(CardId.entries.size, normalized.size)
        assertEquals(normalized.distinct(), normalized)
    }

    @Test
    fun `matching is case-insensitive and trims whitespace`() {
        assertEquals(CardId.WEATHER, normalizeCardOrder(listOf("  weather  ")).first())
    }
}
