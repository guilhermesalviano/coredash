package com.coredash.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.coredash.app.data.settings.ThemeMode
import com.coredash.app.ui.AppNavHost
import com.coredash.app.ui.theme.CoreDashTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val container = (application as CoreDashApp).container

        setContent {
            val settings by container.settingsRepository.settingsFlow
                .collectAsState(initial = null)

            CoreDashTheme(themeMode = settings?.theme ?: ThemeMode.SYSTEM) {
                AppNavHost()
            }
        }
    }
}
