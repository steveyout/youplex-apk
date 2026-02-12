package cc.youplex.movies

import android.app.Application
import android.content.res.Configuration
import com.pawns.sdk.common.dto.ServiceConfig
import com.pawns.sdk.common.dto.ServiceNotificationPriority
import com.pawns.sdk.common.dto.ServiceType
import com.pawns.sdk.common.sdk.Pawns

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
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

    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
