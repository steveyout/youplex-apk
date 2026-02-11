import Constants from 'expo-constants';

const GITHUB_USER = "steveyout";
const GITHUB_REPO = "youplex-apk";

// This will be injected during the build process
const GH_TOKEN = process.env.EXPO_PUBLIC_GITHUB_PAT;

export const checkForUpdates = async () => {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Youplex-apk'
        };

        // Only add Authorization if the token exists
        if (GH_TOKEN) {
            headers['Authorization'] = `token ${GH_TOKEN}`;
        }

        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`,
            { headers }
        );

        if (!response.ok) {
            // Log rate limit info if available in headers to help debugging
            const remaining = response.headers.get('x-ratelimit-remaining');
            console.warn(`[UpdateCheck] API Error. Remaining calls: ${remaining}`);
            throw new Error('Failed to fetch from GitHub');
        }

        const data = await response.json();

        const remoteBuild = parseInt(data.tag_name.replace(/[^\d]/g, ''), 10);
        const localBuild = Constants.expoConfig?.android?.versionCode || 0;

        console.log(`[UpdateCheck] Local: ${localBuild} | Remote: ${remoteBuild}`);

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