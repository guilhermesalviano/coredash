package com.coredash.app.ui.motion

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@Composable
fun MotionScreensaver(timezone: String, onWake: () -> Unit) {
    val zone = remember(timezone) { runCatching { ZoneId.of(timezone) }.getOrDefault(ZoneId.systemDefault()) }
    var time by remember(zone) { mutableStateOf(ZonedDateTime.now(zone)) }
    LaunchedEffect(zone) {
        while (true) {
            time = ZonedDateTime.now(zone)
            delay(30_000L)
        }
    }
    BackHandler(onBack = onWake)
    Box(
        Modifier.fillMaxSize().background(Color.Black).clickable(onClickLabel = "Despertar painel", onClick = onWake),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(time.format(DateTimeFormatter.ofPattern("HH:mm")), color = Color(0xFF777777),
                style = MaterialTheme.typography.displayLarge)
            Text("Mova-se ou toque para despertar", color = Color(0xFF555555),
                style = MaterialTheme.typography.bodyLarge)
        }
    }
}
