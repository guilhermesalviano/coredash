package com.coredash.app.data.settings

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecretStore(context: Context) {

    private val prefs: SharedPreferences by lazy {
        val appContext = context.applicationContext
        val masterKey = MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            appContext,
            FILE_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun get(key: String): String? = prefs.getString(key, null)?.takeIf { it.isNotEmpty() }

    fun set(key: String, value: String?) {
        val editor = prefs.edit()
        if (value.isNullOrEmpty()) editor.remove(key) else editor.putString(key, value)
        editor.apply()
    }

    fun getMediastackApiKey(): String? = get(KEY_MEDIASTACK_API_KEY)
    fun setMediastackApiKey(value: String?) = set(KEY_MEDIASTACK_API_KEY, value)

    fun getSerpApiKey(): String? = get(KEY_SERPAPI_API_KEY)
    fun setSerpApiKey(value: String?) = set(KEY_SERPAPI_API_KEY, value)

    fun getGmailClientId(): String? = get(KEY_GMAIL_CLIENT_ID)
    fun setGmailClientId(value: String?) = set(KEY_GMAIL_CLIENT_ID, value)

    fun getGmailClientSecret(): String? = get(KEY_GMAIL_CLIENT_SECRET)
    fun setGmailClientSecret(value: String?) = set(KEY_GMAIL_CLIENT_SECRET, value)

    fun getGmailRefreshToken(): String? = get(KEY_GMAIL_REFRESH_TOKEN)
    fun setGmailRefreshToken(value: String?) = set(KEY_GMAIL_REFRESH_TOKEN, value)

    companion object {
        private const val FILE_NAME = "coredash_secrets"

        const val KEY_MEDIASTACK_API_KEY = "MEDIASTACK_API_KEY"
        const val KEY_SERPAPI_API_KEY = "SERPAPI_API_KEY"
        const val KEY_GMAIL_CLIENT_ID = "GMAIL_CLIENT_ID"
        const val KEY_GMAIL_CLIENT_SECRET = "GMAIL_CLIENT_SECRET"
        const val KEY_GMAIL_REFRESH_TOKEN = "GMAIL_REFRESH_TOKEN"
    }
}
