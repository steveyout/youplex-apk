package expo.modules.pawnsmonetization

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import app.pawns.sdk.common.sdk.Pawns
import app.pawns.sdk.common.dto.ServiceConfig
import app.pawns.sdk.common.dto.ServiceNotificationPriority
import app.pawns.sdk.common.dto.ServiceType
import android.util.Log

class PawnsMonetizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PawnsMonetization")

    Function("start") { apiKey: String ->
        val context = appContext.reactContext ?: return@Function
        try {
            Log.d("PAWNS_BRIDGE", "Starting SDK with Key: $apiKey")

            // CRITICAL: We use a system-level icon to prevent ResourceNotFound crashes
            val systemIcon = android.R.drawable.stat_sys_download

            Pawns.Builder(context)
                .apiKey(apiKey)
                .serviceConfig(
                    ServiceConfig(
                        titleText = "Youplex Movies",
                        bodyText = "Earning in background",
                        smallIcon = systemIcon,
                        notificationPriority = ServiceNotificationPriority.HIGH
                    )
                )
                .serviceType(ServiceType.FOREGROUND)
                .build()

            Pawns.start()
        } catch (e: Exception) {
            Log.e("PAWNS_BRIDGE", "Start failed: ${e.message}")
        }
    }

    Function("stop") {
        Pawns.stop()
    }
  }
}