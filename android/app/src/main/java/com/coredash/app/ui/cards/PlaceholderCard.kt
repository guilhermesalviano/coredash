package com.coredash.app.ui.cards

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun PlaceholderCard(title: String) {
    DashboardCard(title = title) {
        // TODO: enable Google OAuth sign-in before implementing Calendar and Gmail cards on Android.
        HintText("Ainda não disponível no Android")
    }
}
