package com.coredash.app.ui.motion

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.coredash.app.data.motion.CameraMotionSensor
import com.coredash.app.data.settings.AppSettings
import com.coredash.app.data.settings.SettingsRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Activity-scoped: never starts a service, holds a wake lock, or launches a background Activity. */
class MotionWakeController(
    private val activity: ComponentActivity,
    settingsRepository: SettingsRepository,
) : DefaultLifecycleObserver {
    private val sensor = CameraMotionSensor(activity, activity)
    private val powerManager = requireNotNull(activity.getSystemService(PowerManager::class.java))
    private var settings = AppSettings()
    private var resumed = false
    private var windowFocused = false
    private var dashboardActive = false
    private var monitoring = false
    private var timer: Job? = null
    private var lastActivityAt = 0L
    private var lastFrameAt = 0L
    private var ignoreMotionUntil = 0L
    private var receivedFrame = false
    private var originalBrightness: Float? = null
    private val _dimmed = MutableStateFlow(false)
    val dimmed = _dimmed.asStateFlow()
    private val _cameraError = MutableStateFlow<String?>(null)
    val cameraError = _cameraError.asStateFlow()

    init {
        activity.lifecycle.addObserver(this)
        activity.lifecycleScope.launch {
            settingsRepository.settingsFlow.collect { updated ->
                val changed = settings.motionWakeEnabled != updated.motionWakeEnabled ||
                    settings.quietPeriodSeconds != updated.quietPeriodSeconds ||
                    settings.motionSensitivity != updated.motionSensitivity
                settings = updated
                if (changed) reconcile()
            }
        }
    }

    fun setDashboardActive(active: Boolean) {
        if (dashboardActive == active) return
        dashboardActive = active
        reconcile()
    }

    fun setWindowFocused(focused: Boolean) {
        if (windowFocused == focused) return
        windowFocused = focused
        reconcile()
    }

    override fun onResume(owner: LifecycleOwner) {
        resumed = true
        reconcile()
    }

    override fun onPause(owner: LifecycleOwner) {
        resumed = false
        reconcile()
    }

    override fun onStop(owner: LifecycleOwner) {
        resumed = false
        reconcile()
    }

    override fun onDestroy(owner: LifecycleOwner) {
        stopMonitoring()
        sensor.close()
        activity.lifecycle.removeObserver(this)
    }

    /** Touch, keyboard input, and camera motion all reset the same monotonic quiet timer. */
    fun onInteraction() {
        lastActivityAt = SystemClock.elapsedRealtime()
        setDimmed(false)
    }

    private fun reconcile() {
        stopMonitoring()
        val kiosk = resumed && dashboardActive
        if (kiosk) {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        setKioskWindowFlags(kiosk)
        if (!kiosk || !windowFocused || !settings.motionWakeEnabled || !powerManager.isInteractive) return
        if (!hasCameraPermission()) {
            _cameraError.value = "Permissão da câmera negada. Despertar por movimento está desativado."
            return
        }

        _cameraError.value = null
        monitoring = true
        receivedFrame = false
        lastActivityAt = SystemClock.elapsedRealtime()
        lastFrameAt = lastActivityAt
        sensor.start(
            threshold = settings.motionSensitivity.threshold,
            onFrame = { motion ->
                receivedFrame = true
                lastFrameAt = SystemClock.elapsedRealtime()
                if (motion && lastFrameAt >= ignoreMotionUntil) onInteraction()
            },
            onError = ::cameraFailed,
        )
        if (!monitoring) return
        timer = activity.lifecycleScope.launch {
            while (monitoring) {
                delay(1_000L)
                if (!powerManager.isInteractive) {
                    stopMonitoring()
                    break
                }
                if (!hasCameraPermission()) {
                    cameraFailed("Permissão da câmera revogada. Despertar por movimento está desativado.")
                    break
                }
                val now = SystemClock.elapsedRealtime()
                if (now - lastFrameAt > 8_000L) {
                    cameraFailed("A câmera não está enviando imagens. Volte ao painel para tentar novamente.")
                    break
                }
                // Never dim without a working wake sensor. A stalled/failed camera restores the UI.
                if (receivedFrame && now - lastActivityAt >= settings.quietPeriodSeconds * 1_000L) {
                    setDimmed(true)
                }
            }
        }
    }

    private fun cameraFailed(message: String) {
        _cameraError.value = message
        stopMonitoring()
    }

    private fun stopMonitoring() {
        monitoring = false
        timer?.cancel()
        timer = null
        sensor.stop()
        setDimmed(false)
    }

    private fun hasCameraPermission(): Boolean =
        ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

    private fun setDimmed(dimmed: Boolean) {
        if (_dimmed.value == dimmed) return
        val attributes = activity.window.attributes
        if (dimmed) {
            // Let auto-exposure settle after our own display dims, avoiding a wake/dim loop.
            ignoreMotionUntil = SystemClock.elapsedRealtime() + 2_000L
            originalBrightness = attributes.screenBrightness
            attributes.screenBrightness = 0.01f
        } else {
            attributes.screenBrightness = originalBrightness ?: WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            originalBrightness = null
            ignoreMotionUntil = 0L
        }
        activity.window.attributes = attributes
        _dimmed.value = dimmed
    }

    @Suppress("DEPRECATION")
    private fun setKioskWindowFlags(enabled: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            activity.setShowWhenLocked(enabled)
            activity.setTurnScreenOn(enabled)
        } else {
            val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            if (enabled) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
        }
    }
}
