import * as Application from 'expo-application';

const GITHUB_USER = "steveyout"; // Replace with your actual username
const GITHUB_REPO = "youplex-apk";     // Replace with your actual repo name

/**
 * Checks GitHub for a newer version by comparing the numeric build version.
 */
export const checkForUpdates = async () => {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from GitHub');
        }

        const data = await response.json();

        // 1. Get the remote build number from the tag (e.g., "v47" -> 47)
        const remoteBuildNumber = parseInt(data.tag_name.replace(/[^\d]/g, ''), 10);

        // 2. Get the local build number (the versionCode we injected via GitHub Actions)
        // On Android, nativeBuildVersion returns the versionCode.
        const localBuildNumber = parseInt(Application.nativeBuildVersion, 10);

        console.log(`[UpdateCheck] Local Build: ${localBuildNumber} | Remote Build: ${remoteBuildNumber}`);

        // 3. Compare as integers
        if (remoteBuildNumber > localBuildNumber) {
            // Look for the specific APK asset name
            const apkAsset = data.assets.find(asset => asset.name === "youplex-latest.apk");

            return {
                updateAvailable: true,
                versionName: data.tag_name, // e.g., "v47"
                releaseNotes: data.body,
                // Fallback to the generic latest link if asset find fails
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