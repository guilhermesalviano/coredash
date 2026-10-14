package com.coredash.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.coredash.app.data.settings.ThemeMode

private val LightColors = lightColorScheme(
    primary = Color(0xFF006B5F), onPrimary = Color.White,
    primaryContainer = Color(0xFF9EF2DF), onPrimaryContainer = Color(0xFF00201B),
    secondary = Color(0xFF4B635D), onSecondary = Color.White,
    secondaryContainer = Color(0xFFCDE8DF), onSecondaryContainer = Color(0xFF08201A),
    tertiary = Color(0xFF416277), onTertiary = Color.White,
    tertiaryContainer = Color(0xFFC5E7FF), onTertiaryContainer = Color(0xFF001E2E),
    background = Color(0xFFF5FAF7), onBackground = Color(0xFF17211E),
    surface = Color(0xFFF5FAF7), onSurface = Color(0xFF17211E),
    surfaceVariant = Color(0xFFDBE5DF), onSurfaceVariant = Color(0xFF3F4944),
    surfaceDim = Color(0xFFD5DBD7), surfaceBright = Color(0xFFF5FAF7),
    surfaceContainerLowest = Color.White, surfaceContainerLow = Color(0xFFEFF5F1),
    surfaceContainer = Color(0xFFE9EFEB), surfaceContainerHigh = Color(0xFFE3EAE5),
    surfaceContainerHighest = Color(0xFFDDE4DF),
    outline = Color(0xFF6F7973), outlineVariant = Color(0xFFBFC9C2),
    inverseSurface = Color(0xFF2C3631), inverseOnSurface = Color(0xFFEDF3EE),
    inversePrimary = Color(0xFF82D6C3), surfaceTint = Color(0xFF006B5F),
    error = Color(0xFFBA1A1A), onError = Color.White,
    errorContainer = Color(0xFFFFDAD6), onErrorContainer = Color(0xFF410002),
)
private val DarkColors = darkColorScheme(
    primary = Color(0xFF82D6C3), onPrimary = Color(0xFF00382F),
    primaryContainer = Color(0xFF005045), onPrimaryContainer = Color(0xFF9EF2DF),
    secondary = Color(0xFFB1CCC3), onSecondary = Color(0xFF1D352E),
    secondaryContainer = Color(0xFF344C44), onSecondaryContainer = Color(0xFFCDE8DF),
    tertiary = Color(0xFFA0CCE5), onTertiary = Color(0xFF093448),
    tertiaryContainer = Color(0xFF284B5F), onTertiaryContainer = Color(0xFFC5E7FF),
    background = Color(0xFF0F1512), onBackground = Color(0xFFDDE4DF),
    surface = Color(0xFF0F1512), onSurface = Color(0xFFDDE4DF),
    surfaceVariant = Color(0xFF3F4944), onSurfaceVariant = Color(0xFFBFC9C2),
    surfaceDim = Color(0xFF0F1512), surfaceBright = Color(0xFF343C37),
    surfaceContainerLowest = Color(0xFF0A100D), surfaceContainerLow = Color(0xFF17201B),
    surfaceContainer = Color(0xFF1B241F), surfaceContainerHigh = Color(0xFF263029),
    surfaceContainerHighest = Color(0xFF313B34),
    outline = Color(0xFF89938C), outlineVariant = Color(0xFF3F4944),
    inverseSurface = Color(0xFFDDE4DF), inverseOnSurface = Color(0xFF2C3631),
    inversePrimary = Color(0xFF006B5F), surfaceTint = Color(0xFF82D6C3),
    error = Color(0xFFFFB4AB), onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A), onErrorContainer = Color(0xFFFFDAD6),
)

@Composable
fun CoreDashTheme(
    themeMode: ThemeMode,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val context = LocalContext.current
    val supportsDynamicColor = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

    val colorScheme = when {
        supportsDynamicColor && darkTheme -> dynamicDarkColorScheme(context)
        supportsDynamicColor -> dynamicLightColorScheme(context)
        darkTheme -> DarkColors
        else -> LightColors
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            (view.context as? Activity)?.window?.let { window ->
                WindowCompat.getInsetsController(window, view).apply {
                    isAppearanceLightStatusBars = !darkTheme
                    isAppearanceLightNavigationBars = !darkTheme
                }
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = CoreDashTypography,
        shapes = CoreDashShapes,
        content = content,
    )
}
