import * as Application from 'expo-application';

const GITHUB_USER = "steveyout";
const GITHUB_REPO = "youplex-apk";

export const checkForUpdates = async () => {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`);
        const data = await response.json();

        // Extract the number from the tag (e.g., "v45" -> 45)
        const latestBuildNumber = parseInt(data.tag_name.replace(/[^\d]/g, ''), 10);

        // Get the local versionCode (ensure this matches what you put in app.json)
        const currentBuildNumber = Application.nativeBuildVersion;

        console.log(`Checking: Local Build ${currentBuildNumber} vs Remote Build ${latestBuildNumber}`);

        if (latestBuildNumber > parseInt(currentBuildNumber, 10)) {
            return {
                updateAvailable: true,
                downloadUrl: `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest/download/youplex-latest.apk`,
                versionName: data.tag_name
            };
        }

        return { updateAvailable: false };
    } catch (error) {
        console.error("Update check failed:", error);
        return { updateAvailable: false };
    }
};