package com.coredash.app.ui.settings

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings as AndroidSettings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.MAX_QUIET_PERIOD_SECONDS
import com.coredash.app.data.settings.MIN_QUIET_PERIOD_SECONDS
import com.coredash.app.data.settings.MotionSensitivity
import com.coredash.app.ui.cards.DashboardCard
import com.coredash.app.ui.theme.Spacing
import kotlin.math.roundToInt

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MotionWakeSettingsCard(
    settings: AppSettings,
    cameraError: String?,
    onEnabledChange: (Boolean) -> Unit,
    onQuietPeriodChange: (Int) -> Unit,
    onSensitivityChange: (MotionSensitivity) -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    fun hasPermission() = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
        PackageManager.PERMISSION_GRANTED
    var granted by remember { mutableStateOf(hasPermission()) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }
    DisposableEffect(lifecycleOwner, context) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) granted = hasPermission()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
    var quietSeconds by remember(settings.quietPeriodSeconds) { mutableStateOf(settings.quietPeriodSeconds.toFloat()) }

    DashboardCard(title = "Painel de parede", icon = Icons.Default.Settings) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Despertar por movimento", Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
            Switch(
                checked = settings.motionWakeEnabled,
                onCheckedChange = { enabled ->
                    onEnabledChange(enabled)
                    if (enabled && !granted) launcher.launch(Manifest.permission.CAMERA)
                },
                modifier = Modifier.semantics { contentDescription = "Despertar por movimento" },
            )
        }
        Text("O painel escurece após um período sem movimento ou interação. Movimento ou toque restaura o brilho.",
            style = MaterialTheme.typography.bodyMedium)
        if (!granted) {
            Text("Sem permissão da câmera, o despertar por movimento e o escurecimento automático ficam desativados.",
                style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                OutlinedButton(onClick = { launcher.launch(Manifest.permission.CAMERA) }) { Text("Permitir câmera") }
                OutlinedButton(onClick = {
                    context.startActivity(Intent(AndroidSettings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:${context.packageName}")))
                }) { Text("Permissões do app") }
            }
        }
        if (settings.motionWakeEnabled && granted && cameraError != null) {
            Text("Última tentativa: $cameraError", color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium)
        }
        Text("Escurecer após ${quietSeconds.roundToInt()} s sem movimento", style = MaterialTheme.typography.bodyLarge)
        Slider(
            value = quietSeconds,
            onValueChange = { quietSeconds = it },
            onValueChangeFinished = { onQuietPeriodChange(quietSeconds.roundToInt()) },
            valueRange = MIN_QUIET_PERIOD_SECONDS.toFloat()..MAX_QUIET_PERIOD_SECONDS.toFloat(),
            steps = 18, // 15-second increments, inclusive of 15 and 300.
            enabled = settings.motionWakeEnabled,
            modifier = Modifier.semantics { contentDescription = "Período sem movimento, em segundos" },
        )
        Text("Sensibilidade", style = MaterialTheme.typography.titleSmall)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
            MotionSensitivity.entries.forEach { sensitivity ->
                FilterChip(
                    selected = settings.motionSensitivity == sensitivity,
                    onClick = { onSensitivityChange(sensitivity) },
                    enabled = settings.motionWakeEnabled,
                    label = { Text(sensitivity.label) },
                )
            }
        }
        Text("A câmera funciona apenas com o painel em primeiro plano, inclusive escurecido. Imagens são processadas no aparelho, sem gravação ou envio. Recomenda-se alimentação na tomada.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
