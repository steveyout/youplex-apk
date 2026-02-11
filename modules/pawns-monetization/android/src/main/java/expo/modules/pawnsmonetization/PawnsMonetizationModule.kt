package expo.modules.pawnsmonetization

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import app.pawns.sdk.common.sdk.Pawns
import app.pawns.sdk.common.dto.ServiceConfig
import app.pawns.sdk.common.dto.ServiceNotificationPriority
import app.pawns.sdk.common.dto.ServiceType

class PawnsMonetizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PawnsMonetization")

    Function("start") { apiKey: String ->
        val context = appContext.reactContext ?: return@Function

        try {
            Pawns.Builder(context)
                .apiKey(apiKey)
                .serviceConfig(
                    ServiceConfig(
                        titleText = "App Support Active",
                        bodyText = "Sharing unused bandwidth",
                        // Using a system icon to avoid "Resource Not Found" errors
                        smallIcon = android.R.drawable.stat_notify_sync,
                        notificationPriority = ServiceNotificationPriority.HIGH
                    )
                )
                .loggerEnabled(true)
                .serviceType(ServiceType.FOREGROUND)
                .build()

            // Explicitly call start if the builder doesn't auto-fire in 1.7.0
            Pawns.start()
        } catch (e: Exception) {
            println("PAWNS_ERROR: ${e.message}")
        }
    }

    Function("stop") {
        Pawns.stop()
    }
  }
}