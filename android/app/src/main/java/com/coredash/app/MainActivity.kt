package com.coredash.app

import android.content.pm.ActivityInfo
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.coredash.app.data.settings.ThemeMode
import com.coredash.app.ui.AppNavHost
import com.coredash.app.ui.motion.MotionScreensaver
import com.coredash.app.ui.motion.MotionWakeController
import com.coredash.app.ui.theme.CoreDashTheme

class MainActivity : ComponentActivity() {
    private lateinit var motionWake: MotionWakeController
    private var consumingWakeTouch = false
    private var wakeKeyCode: Int? = null

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (::motionWake.isInitialized) motionWake.setWindowFocused(hasFocus)
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        if (::motionWake.isInitialized) motionWake.onInteraction()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (::motionWake.isInitialized && motionWake.dimmed.value && event.action == KeyEvent.ACTION_DOWN) {
            wakeKeyCode = event.keyCode
            motionWake.onInteraction()
        }
        if (event.keyCode == wakeKeyCode) {
            if (event.action == KeyEvent.ACTION_UP) wakeKeyCode = null
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_DOWN) {
            consumingWakeTouch = ::motionWake.isInitialized && motionWake.dimmed.value
            if (consumingWakeTouch) motionWake.onInteraction()
        }
        if (consumingWakeTouch) {
            if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
                consumingWakeTouch = false
            }
            return true // A wake tap must not activate a dashboard control underneath the overlay.
        }
        if (::motionWake.isInitialized) motionWake.onInteraction()
        return super.dispatchTouchEvent(event)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (resources.configuration.smallestScreenWidthDp < 600) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
        enableEdgeToEdge()

        val container = (application as CoreDashApp).container

        motionWake = MotionWakeController(this, container.settingsRepository)

        setContent {
            val settings by container.settingsRepository.settingsFlow
                .collectAsState(initial = null)

            CoreDashTheme(themeMode = settings?.theme ?: ThemeMode.SYSTEM) {
                val dimmed by motionWake.dimmed.collectAsState()
                Box(Modifier.fillMaxSize()) {
                    AppNavHost(motionWake = motionWake)
                    if (dimmed) {
                        MotionScreensaver(timezone = settings?.timezone ?: "UTC", onWake = motionWake::onInteraction)
                    }
                }
            }
        }
    }
}
