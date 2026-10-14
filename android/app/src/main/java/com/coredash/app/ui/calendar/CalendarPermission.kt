package com.coredash.app.ui.calendar

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

data class CalendarPermission(
    val granted: Boolean,
    val permanentlyDenied: Boolean,
    val request: () -> Unit,
)

@Composable
fun rememberCalendarPermission(): CalendarPermission {
    val context = LocalContext.current
    var granted by remember { mutableStateOf(context.hasCalendarPermission()) }
    var hasRequested by rememberSaveable { mutableStateOf(false) }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                granted = context.hasCalendarPermission()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { result ->
        hasRequested = true
        granted = result
    }

    val activity = context.findActivity()
    val permanentlyDenied = !granted &&
        hasRequested &&
        activity != null &&
        !ActivityCompat.shouldShowRequestPermissionRationale(
            activity,
            Manifest.permission.READ_CALENDAR,
        )

    return CalendarPermission(
        granted = granted,
        permanentlyDenied = permanentlyDenied,
        request = { launcher.launch(Manifest.permission.READ_CALENDAR) },
    )
}

fun Context.hasCalendarPermission(): Boolean =
    ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALENDAR) ==
        PackageManager.PERMISSION_GRANTED

private fun Context.findActivity(): Activity? {
    var current: Context = this
    while (current is ContextWrapper) {
        if (current is Activity) return current
        current = current.baseContext
    }
    return null
}
