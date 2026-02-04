import Constants from 'expo-constants';

const GITHUB_USER = "steveyout";
const GITHUB_REPO = "youplex-apk";

export const checkForUpdates = async () => {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`
        );

        if (!response.ok) throw new Error('Failed to fetch from GitHub');
        const data = await response.json();

        // 1. Remote Build: (e.g., "v52" -> 52)
        const remoteBuild = parseInt(data.tag_name.replace(/[^\d]/g, ''), 10);

        // 2. Local Build: Use expoConfig to get the injected versionCode
        // We fallback to 0 to avoid NaN if the config isn't loaded yet
        const localBuild = Constants.expoConfig?.android?.versionCode || 0;

        console.log(`[UpdateCheck] Local: ${localBuild} | Remote: ${remoteBuild}`);

        // 3. Logic: If GitHub is strictly ahead of our internal version
        if (remoteBuild > localBuild && localBuild !== 0) {
            const apkAsset = data.assets.find(asset => asset.name === "youplex-latest.apk");

            return {
                updateAvailable: true,
                versionName: data.tag_name,
                downloadUrl: apkAsset
                    ? apkAsset.browser_download_url
                    : `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest/download/youplex-latest.apk`
            };
        }

        return { updateAvailable: false };
    } catch (error) {
        console.error("Update check failed:", error);
        return { updateAvailable: false };
    }
};