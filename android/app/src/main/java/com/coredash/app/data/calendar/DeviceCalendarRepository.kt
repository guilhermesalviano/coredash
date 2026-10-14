package com.coredash.app.data.calendar

import android.content.ContentUris
import android.content.Context
import android.provider.CalendarContract
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

data class DeviceCalendar(
    val id: Long,
    val displayName: String,
    val accountName: String,
    val color: Int,
)

data class CalendarEvent(
    val id: Long,
    val title: String,
    val start: Instant,
    val end: Instant,
    val allDay: Boolean,
    val calendarName: String,
    val color: Int,
    val location: String,
)

class DeviceCalendarRepository(private val context: Context) {

    private val resolver = context.contentResolver

    suspend fun listCalendars(): List<DeviceCalendar> = withContext(Dispatchers.IO) {
        runCatching {
            val projection = arrayOf(
                CalendarContract.Calendars._ID,
                CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
                CalendarContract.Calendars.ACCOUNT_NAME,
                CalendarContract.Calendars.CALENDAR_COLOR,
            )

            val calendars = mutableListOf<DeviceCalendar>()
            resolver.query(
                CalendarContract.Calendars.CONTENT_URI,
                projection,
                "${CalendarContract.Calendars.VISIBLE} = 1",
                null,
                "${CalendarContract.Calendars.CALENDAR_DISPLAY_NAME} ASC",
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars._ID)
                val nameIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
                val accountIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Calendars.ACCOUNT_NAME)
                val colorIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_COLOR)

                while (cursor.moveToNext()) {
                    calendars += DeviceCalendar(
                        id = cursor.getLong(idIndex),
                        displayName = cursor.getString(nameIndex) ?: "",
                        accountName = cursor.getString(accountIndex) ?: "",
                        color = cursor.getInt(colorIndex),
                    )
                }
            }
            calendars
        }.getOrDefault(emptyList())
    }

    suspend fun upcomingEvents(
        calendarIds: Set<Long> = emptySet(),
        days: Int = 3,
    ): List<CalendarEvent> = withContext(Dispatchers.IO) {
        runCatching {
            val zone = ZoneId.systemDefault()
            val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
            val end = Instant.now().plus(days.toLong(), ChronoUnit.DAYS)

            val builder = CalendarContract.Instances.CONTENT_URI.buildUpon()
            ContentUris.appendId(builder, start.toEpochMilli())
            ContentUris.appendId(builder, end.toEpochMilli())

            val projection = arrayOf(
                CalendarContract.Instances.EVENT_ID,
                CalendarContract.Instances.TITLE,
                CalendarContract.Instances.BEGIN,
                CalendarContract.Instances.END,
                CalendarContract.Instances.ALL_DAY,
                CalendarContract.Instances.CALENDAR_DISPLAY_NAME,
                CalendarContract.Instances.CALENDAR_COLOR,
                CalendarContract.Instances.EVENT_LOCATION,
            )

            val selection: String?
            val selectionArgs: Array<String>?
            if (calendarIds.isEmpty()) {
                selection = "${CalendarContract.Events.DELETED} = 0"
                selectionArgs = null
            } else {
                val placeholders = calendarIds.joinToString(", ") { "?" }
                selection =
                    "${CalendarContract.Events.DELETED} = 0 AND " +
                        "${CalendarContract.Instances.CALENDAR_ID} IN ($placeholders)"
                selectionArgs = calendarIds.map { it.toString() }.toTypedArray()
            }

            val events = mutableListOf<CalendarEvent>()
            resolver.query(
                builder.build(),
                projection,
                selection,
                selectionArgs,
                "${CalendarContract.Instances.BEGIN} ASC",
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_ID)
                val titleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.TITLE)
                val beginIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.BEGIN)
                val endIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.END)
                val allDayIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.ALL_DAY)
                val nameIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Instances.CALENDAR_DISPLAY_NAME)
                val colorIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Instances.CALENDAR_COLOR)
                val locationIndex =
                    cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_LOCATION)

                while (cursor.moveToNext()) {
                    events += CalendarEvent(
                        id = cursor.getLong(idIndex),
                        title = cursor.getString(titleIndex) ?: "",
                        start = Instant.ofEpochMilli(cursor.getLong(beginIndex)),
                        end = Instant.ofEpochMilli(cursor.getLong(endIndex)),
                        allDay = cursor.getInt(allDayIndex) == 1,
                        calendarName = cursor.getString(nameIndex) ?: "",
                        color = cursor.getInt(colorIndex),
                        location = cursor.getString(locationIndex) ?: "",
                    )
                }
            }
            events
        }.getOrDefault(emptyList())
    }
}
