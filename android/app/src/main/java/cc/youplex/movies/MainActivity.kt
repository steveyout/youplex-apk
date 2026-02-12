package cc.youplex.movies

import android.os.Build
import android.os.Bundle
import com.pawns.sdk.common.dto.ServiceConfig
import com.pawns.sdk.common.dto.ServiceNotificationPriority
import com.pawns.sdk.common.dto.ServiceType
import com.pawns.sdk.common.sdk.Pawns
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    // Start Pawns only after the Activity is created
    startPawnsService()
    super.onCreate(null)
  }


  private fun startPawnsService() {
          try {
              Pawns.Builder(this)
              .apiKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZGsiOnRydWUsImV4cCI6MjA4NjE2NTM1MSwianRpIjoiMDFLSDYzSk45SzJFQjFDOVhOU0ZIMzJISFciLCJpYXQiOjE3NzA4MDUzNTEsInN1YiI6IjAxS0dON1M3RENRMlkzVEowWFM3NzFROFRCIn0.PdjQ123Udh__J-OMUH6gDUqV_yvGC_Rjh1suRDRnYG8")
               .serviceConfig(
                ServiceConfig(
                 title = R.string.pawns_service_title,
                   body = R.string.pawns_service_body,
                   smallIcon = android.R.drawable.ic_dialog_info,
                      notificationPriority = ServiceNotificationPriority.HIGH
                )
              )
                 .loggerEnabled(true)
                  .serviceType(ServiceType.FOREGROUND)
                    .build()
                              // 2. ACTUALLY START THE SERVICE (Crucial Step)
                    Pawns.getInstance().startSharing(this)
              Log.d("PawnsSDK", "Service started from MainActivity")
          } catch (e: Exception) {
              Log.e("PawnsSDK", "Failed to start: ${e.message}")
          }
      }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
