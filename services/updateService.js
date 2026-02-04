import * as Application from 'expo-application';

const GITHUB_API = "https://api.github.com/repos/steveyout/youplex-apk/releases/latest";

export const checkForUpdates = async () => {
    try {
        const response = await fetch(GITHUB_API);
        const data = await response.json();

        // GitHub returns the tag_name (e.g., "v1.0.5" or "latest")
        // If you use tag_name for versioning, compare it here
        const latestVersion = data.tag_name;
        const currentVersion = Application.nativeApplicationVersion;

        // For a "Every Commit" build, we can compare the commit SHA
        // or just check the published_at date.
        const lastBuildDate = data.published_at;

        // Find the APK in the assets array
        const apkAsset = data.assets.find(asset => asset.name === "youplex-latest.apk");

        return {
            updateAvailable: latestVersion !== currentVersion, // Logic depends on your tagging
            downloadUrl: apkAsset ? apkAsset.browser_download_url : null,
            releaseNotes: data.body,
            version: latestVersion
        };
    } catch (error) {
        console.error("Update check failed:", error);
        return { updateAvailable: false };
    }
};