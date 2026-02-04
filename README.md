# 🎬 YouPlex 🚀

![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**YouPlex** is a high-performance, native Android application designed to aggregate the best streaming providers into one seamless interface. Access thousands of Movies, TV Shows, and **Live TV** channels without the clutter.

---

## 📸 App Preview

| UI Showcase | Home Interface |
| :---: | :---: |
| <img src="https://i.ibb.co/nqHd9m1z/screenshot1.png" width="300"> | <img src="https://i.ibb.co/nq4FJGhY/screenshot2.png" width="300"> |

---

## 📥 Download & Installation

Click the button below to grab the latest official version.

[![Download APK](https://img.shields.io/badge/Download-Latest%20APK-E91E63?style=for-the-badge&logo=android)](https://github.com/steveyout/youplex-apk/releases/latest/download/youplex-latest.apk)

1. **Download** the `.apk` file from the button above.
2. **Open** the file on your Android device.
3. **Allow** "Install from Unknown Sources" in your settings if prompted.
4. **Launch** YouPlex and start your cinema experience!

---

## ✨ Key Features

* 📺 **Live TV Suite:** Integrated support for high-speed live servers including `vidsrcme`, `vidsrc-me`, and `vidsrc-embed`.
* 🎥 **Massive Library:** Powered by 6+ premium VOD providers (Vidsrc, Superembed, 2Embed, and more).
* 🛡️ **Ad-Blocker Logic:** Custom-built WebView controllers that hide intrusive ads and provider UI elements for a "Cinema" feel.
* 🔢 **Auto-Versioning:** The app detects new GitHub releases automatically and prompts you to update instantly.
* 🚀 **Native Performance:** Built with React Native & Expo for a smooth, lag-free experience.

---

## 🛠 Tech Stack

| Feature | Technology |
| :--- | :--- |
| **Framework** | React Native / Expo |
| **Automation** | GitHub Actions (CI/CD) |
| **Package Management** | NPM / EAS CLI |
| **Versioning** | Auto-injected via `jq` & Gradle |

---

## 🤖 CI/CD Automation

This project uses **GitHub Actions** to automate the build process. Every push to `main` triggers:
1.  **Auto-Versioning:** Injects the GitHub Run Number into the Android `versionCode`.
2.  **Local EAS Build:** Compiles the native APK.
3.  **Automatic Release:** Tags the build and uploads the APK to the "Releases" page.

---

## 🤝 Community & Support

[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord)](https://t.me/youplexannouncments)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Channel-26A6E4?style=for-the-badge&logo=telegram)](https://discord.gg/5eWu9Vz6tQ)

---

## ⚖️ Disclaimer

*YouPlex does not host any files. It simply provides a convenient interface to access publicly available content via third-party providers. Please support the official creators where possible.*
