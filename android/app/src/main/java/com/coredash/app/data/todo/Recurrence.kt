package com.coredash.app.data.todo

import java.time.LocalDate

enum class Recurrence {
    NONE,
    DAILY,
    WEEKLY,
    MONTHLY,
    ;

    companion object {
        fun from(value: String?): Recurrence =
            Recurrence.entries.firstOrNull { it.name.equals(value?.trim(), ignoreCase = true) } ?: NONE
    }
}

fun nextDueDate(from: LocalDate, recurrence: Recurrence): LocalDate? = when (recurrence) {
    Recurrence.NONE -> null
    Recurrence.DAILY -> from.plusDays(1)
    Recurrence.WEEKLY -> from.plusWeeks(1)
    Recurrence.MONTHLY -> from.plusMonths(1)
}
