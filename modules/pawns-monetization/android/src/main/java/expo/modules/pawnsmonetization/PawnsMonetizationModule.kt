package expo.modules.pawnsmonetization

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import app.pawns.sdk.common.sdk.Pawns
import app.pawns.sdk.common.dto.*
import android.util.Log

class PawnsMonetizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PawnsMonetization")

    Function("start") { apiKey: String ->
        val context = appContext.reactContext ?: return@Function

        // Run on a background thread to prevent blocking the UI
        // which causes the "top resumed state loss timeout" in your logs
        Thread {
            try {
                Log.i("PAWNS_BRIDGE", "Initializing Pawns SDK...")

                Pawns.Builder(context)
                    .apiKey(apiKey)
                    .serviceConfig(
                        ServiceConfig(
                            titleText = "Youplex Background",
                            bodyText = "System is active",
                            // Using a system resource is safer than a custom icon during crashes
                            smallIcon = android.R.drawable.ic_dialog_info,
                            notificationPriority = ServiceNotificationPriority.LOW
                        )
                    )
                    .serviceType(ServiceType.FOREGROUND)
                    .build()

                // Final check if process is still alive before starting
                Pawns.start()
                Log.i("PAWNS_BRIDGE", "SDK Started Successfully")
            } catch (e: Exception) {
                Log.e("PAWNS_BRIDGE", "Native Crash Prevented: ${e.message}")
            }
        }.start()
    }

    Function("stop") {
        try {
            Pawns.stop()
        } catch (e: Exception) {
            Log.e("PAWNS_BRIDGE", "Stop failed: ${e.message}")
        }
    }
  }
}