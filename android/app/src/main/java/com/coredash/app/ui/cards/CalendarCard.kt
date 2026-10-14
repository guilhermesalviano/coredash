package com.coredash.app.ui.cards

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.coredash.app.data.calendar.CalendarEvent
import com.coredash.app.ui.calendar.rememberCalendarPermission
import com.coredash.app.ui.theme.Spacing
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")
private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM")

@Composable
fun CalendarCard(
    events: List<CalendarEvent>,
    loading: Boolean,
    selectedCalendarIds: Set<Long>,
    calendarDays: Int,
    onLoad: (Set<Long>, Int) -> Unit,
) {
    val permission = rememberCalendarPermission()
    val context = LocalContext.current

    DashboardCard(title = "Calendário", icon = Icons.Default.DateRange) {
        when {
            permission.granted -> {
                LaunchedEffect(selectedCalendarIds, calendarDays) {
                    onLoad(selectedCalendarIds, calendarDays)
                }
                CalendarEvents(events = events, loading = loading)
            }
            permission.permanentlyDenied -> {
                HintText("O acesso à agenda está bloqueado.")
                HintText("Ative a permissão nas configurações do aplicativo para ver seus compromissos.")
                OutlinedButton(
                    onClick = { context.openAppSettings() },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Abrir configurações")
                }
            }
            else -> {
                HintText("Permita o acesso à agenda para ver seus próximos compromissos.")
                OutlinedButton(
                    onClick = permission.request,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Permitir acesso à agenda")
                }
            }
        }
    }
}

@Composable
private fun CalendarEvents(
    events: List<CalendarEvent>,
    loading: Boolean,
) {
    when {
        loading -> LoadingState("Carregando sua agenda…")
        events.isEmpty() -> EmptyState("Sua agenda está livre", "Nenhum compromisso nos próximos dias.")
        else -> {
            val grouped = remember(events) { groupByDay(events) }
            grouped.forEach { (date, dayEvents) ->
                Text(
                    text = dayLabel(date),
                    style = MaterialTheme.typography.titleSmall,
                )
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    dayEvents.forEach { event -> EventRow(event) }
                }
            }
        }
    }
}

@Composable
private fun EventRow(event: CalendarEvent) {
    val zone = ZoneId.systemDefault()
    val eventColor = Color(event.color)

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xxs),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(
                if (eventColor.alpha == 0f) MaterialTheme.colorScheme.primary else eventColor,
            ),
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = event.title,
                style = MaterialTheme.typography.bodyMedium,
            )
            if (event.location.isNotBlank()) {
                Text(
                    text = event.location,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Text(
            text = if (event.allDay) "Dia todo" else event.start.atZone(zone).format(timeFormatter),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun groupByDay(events: List<CalendarEvent>): List<Pair<LocalDate, List<CalendarEvent>>> {
    val zone = ZoneId.systemDefault()
    return events
        .groupBy { it.start.atZone(zone).toLocalDate() }
        .toSortedMap()
        .map { (date, dayEvents) -> date to dayEvents }
}

private fun dayLabel(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> "Hoje"
        today.plusDays(1) -> "Amanhã"
        else -> date.format(dateFormatter)
    }
}

private fun Context.openAppSettings() {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    startActivity(intent)
}
