import * as Application from 'expo-application';

const GITHUB_USER = "steveyout";
const GITHUB_REPO = "youplex-apk";

export const checkForUpdates = async () => {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`
        );

        if (!response.ok) throw new Error('Failed to fetch from GitHub');

        const data = await response.json();

        // 1. Get remote build (e.g., "v52" -> 52)
        const remoteBuildNumber = parseInt(data.tag_name.replace(/[^\d]/g, ''), 10);

        // 2. Get local build.
        // NOTE: On some Expo versions, nativeBuildVersion might be undefined in dev.
        // We use || 0 to prevent NaN comparisons.
        const localBuildNumber = parseInt(Application.nativeBuildVersion || "0", 10);

        // DEBUG LOG - Check these in your terminal/flipper!
        console.log(`[UpdateCheck] Raw Local: ${Application.nativeBuildVersion}`);
        console.log(`[UpdateCheck] Parsed Local: ${localBuildNumber} vs Remote: ${remoteBuildNumber}`);

        // 3. Robust Comparison
        // We only trigger if remote is strictly higher and both are valid numbers
        if (!isNaN(remoteBuildNumber) && !isNaN(localBuildNumber)) {
            if (remoteBuildNumber > localBuildNumber) {
                const apkAsset = data.assets.find(asset => asset.name === "youplex-latest.apk");

                return {
                    updateAvailable: true,
                    versionName: data.tag_name,
                    downloadUrl: apkAsset
                        ? apkAsset.browser_download_url
                        : `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest/download/youplex-latest.apk`
                };
            }
        }

        return { updateAvailable: false };
    } catch (error) {
        console.error("Update check failed:", error);
        return { updateAvailable: false };
    }
};