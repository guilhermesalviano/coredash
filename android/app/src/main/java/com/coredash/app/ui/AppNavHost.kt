package com.coredash.app.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.coredash.app.CoreDashApp
import com.coredash.app.data.settings.SetupValidation
import com.coredash.app.ui.cards.LoadingState
import com.coredash.app.ui.dashboard.DashboardScreen
import com.coredash.app.ui.motion.MotionWakeController
import com.coredash.app.ui.settings.SettingsScreen
import com.coredash.app.ui.setup.SetupScreen

object Routes {
    const val SETUP = "setup"
    const val DASHBOARD = "dashboard"
    const val SETTINGS = "settings"
}

@Composable
fun AppNavHost(motionWake: MotionWakeController) {
    val context = LocalContext.current
    val container = (context.applicationContext as CoreDashApp).container
    val settings by container.settingsRepository.settingsFlow.collectAsState(initial = null)

    var startRoute by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(settings) {
        val current = settings
        if (startRoute.isEmpty() && current != null) {
            startRoute = if (SetupValidation.isComplete(current)) Routes.DASHBOARD else Routes.SETUP
        }
    }

    if (startRoute.isEmpty()) {
        Surface(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                LoadingState("Abrindo CoreDash…")
            }
        }
        return
    }

    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = startRoute,
    ) {
        composable(Routes.SETUP) {
            SetupScreen(
                onNavigateToDashboard = {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.SETUP) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.DASHBOARD) {
            DisposableEffect(motionWake) {
                motionWake.setDashboardActive(true)
                onDispose { motionWake.setDashboardActive(false) }
            }
            DashboardScreen(
                onOpenSettings = { navController.navigate(Routes.SETTINGS) },
            )
        }

        composable(Routes.SETTINGS) {
            val cameraError by motionWake.cameraError.collectAsState()
            SettingsScreen(
                cameraError = cameraError,
                onBack = { navController.popBackStack() },
                onOpenSetup = {
                    navController.navigate(Routes.SETUP) {
                        popUpTo(Routes.DASHBOARD) { inclusive = true }
                    }
                },
            )
        }
    }
}
