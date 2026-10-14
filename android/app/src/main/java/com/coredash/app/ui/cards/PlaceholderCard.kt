package com.coredash.app.ui.cards

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.runtime.Composable

@Composable
fun PlaceholderCard(title: String) {
    DashboardCard(title = title, icon = Icons.Default.Email) {
        // TODO: enable Google OAuth sign-in before implementing Calendar and Gmail cards on Android.
        EmptyState("Em breve", "Esta integração ainda não está disponível no Android.")
    }
}
