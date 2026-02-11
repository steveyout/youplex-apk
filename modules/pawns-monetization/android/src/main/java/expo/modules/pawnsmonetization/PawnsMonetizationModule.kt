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

            Pawns.Builder(context)
                .apiKey(apiKey)
                .serviceConfig(
                    ServiceConfig(
                        titleText = "Youplex Monetization",
                        bodyText = "Earning in background...",
                        // Standard Android icon to prevent resource mismatch
                        smallIcon = android.R.drawable.stat_sys_download,
                        notificationPriority = ServiceNotificationPriority.HIGH
                    )
                )
                .serviceType(ServiceType.FOREGROUND)
                .build()

            Pawns.start()
            Log.d("PAWNS_BRIDGE", "Pawns.start() executed")
        } catch (e: Exception) {
            Log.e("PAWNS_BRIDGE", "CRASH in start(): ${e.message}")
        }
    }

    Function("stop") {
        try {
            Pawns.stop()
            Log.d("PAWNS_BRIDGE", "Pawns.stop() executed")
        } catch (e: Exception) {
            Log.e("PAWNS_BRIDGE", "Stop failed: ${e.message}")
        }
    }

    Function("isServiceRunning") {
        return@Function Pawns.isServiceRunning()
    }
  }
}