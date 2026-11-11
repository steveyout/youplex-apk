/**
 * Vyla Entertainment SDK Primary Stream Resolver Service
 * Programmatic multi-provider stream resolver for Movies and TV shows.
 * Direct client-safe integration for HLS/MP4 streams and Subtitles.
 * https://gitlab.com/vyla-entertainment/sdk | https://vyla.cc/sdk
 */

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const VYLA_API_BASE = 'https://api.youplex.site';
const VIDLINK_BASE = 'https://vidlink.pro';
const SUBTITLE_BASES = [
    'https://sub.vdrk.site/v1',
    'https://sub.vdrk.site/v2',
    'https://opensubtitles-v3.strem.io',
];

// Verified active Vyla backend scrapers (Primary Playback Engine)
export const VYLA_PROVIDERS = [
    { id: 'vyla-vidlink', name: 'Vyla VidLink Pro', label: 'Vyla VidLink (Multi-Quality HLS)', key: 'vidlink' },
    { id: 'vyla-core', name: 'Vyla Aggregator Core', label: 'Vyla Core (Auto-Failover)', key: 'youplex' },
    { id: 'vyla-taroflix', name: 'Vyla TaroFlix', label: 'Vyla TaroFlix (Direct Stream)', key: 'taroflix' },
    { id: 'vyla-vidcore', name: 'Vyla VidCore', label: 'Vyla VidCore (High Speed)', key: 'vidcore' },
    { id: 'vyla-streamrip', name: 'Vyla StreamRip', label: 'Vyla StreamRip (1080p)', key: 'streamrip' },
];

/**
 * Normalizes quality string into human-readable label
 */
function normalizeQuality(q) {
    if (!q || q === 'Auto') return 'auto';
    const str = String(q).trim();
    return /^\d+$/.test(str) ? `${str}p` : str.toLowerCase();
}

/**
 * Resolves streams via VidLink Pro resolver
 */
async function resolveVidLinkStream(tmdbId, isTv, season, episode, timeoutMs = 12000) {
    try {
        const encRes = await fetch(`https://enc-dec.app/api/enc-vidlink?text=${tmdbId}`, {
            headers: { 'User-Agent': USER_AGENT },
            signal: AbortSignal.timeout(6000),
        });
        if (!encRes.ok) return null;
        const encData = await encRes.json();
        if (encData?.status !== 200 || !encData?.result) return null;

        const path = isTv
            ? `${VIDLINK_BASE}/api/b/tv/${encData.result}/${season || 1}/${episode || 1}`
            : `${VIDLINK_BASE}/api/b/movie/${encData.result}`;

        const headers = {
            'User-Agent': USER_AGENT,
            Origin: VIDLINK_BASE,
            Referer: `${VIDLINK_BASE}/`,
        };

        const res = await fetch(path, {
            headers,
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const stream = data?.stream;
        if (!stream) return null;

        const sources = [];

        if (stream.playlist) {
            const isDash = stream.type === 'dash' || stream.deliveryType === 'dash' || stream.playlist.includes('.mpd');
            sources.push({
                url: stream.playlist,
                type: isDash ? 'dash' : 'hls',
                isM3U8: !isDash,
                quality: stream.playbackMetadata?.resolutions?.[0] ? `${stream.playbackMetadata.resolutions[0]}p` : 'auto',
                title: 'Vyla VidLink (Direct HLS)',
                headers: stream.playlistHeaders || headers,
            });
        }

        if (stream.qualities && typeof stream.qualities === 'object') {
            Object.entries(stream.qualities).forEach(([q, f]) => {
                if (f?.url) {
                    sources.push({
                        url: f.url,
                        type: 'mp4',
                        isM3U8: false,
                        quality: `${q}p`,
                        title: `Vyla VidLink (${q}p)`,
                        headers: f.headers || headers,
                    });
                }
            });
        }

        return sources.length > 0 ? sources : null;
    } catch (e) {
        return null;
    }
}

/**
 * Resolves streams via Vyla cluster scraper endpoints
 */
async function resolveVylaClusterStream(tmdbId, isTv, season, episode, subProvider = 'taroflix', timeoutMs = 12000) {
    try {
        const params = new URLSearchParams({
            id: String(tmdbId),
            type: isTv ? 'tv' : 'movie',
            provider: subProvider,
        });
        if (isTv) {
            params.set('s', String(season || 1));
            params.set('e', String(episode || 1));
        }

        const url = `${VYLA_API_BASE}/scrape?${params.toString()}`;
        const res = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': USER_AGENT,
                Origin: 'https://youplex.site',
                Referer: 'https://youplex.site/',
            },
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.success === false) return null;

        const sources = [];

        if (Array.isArray(data.sources) && data.sources.length > 0) {
            data.sources.forEach((src) => {
                if (src?.url) {
                    const isM3U8 = src.url.includes('.m3u8') || src.type === 'hls';
                    sources.push({
                        url: src.url,
                        type: isM3U8 ? 'hls' : 'mp4',
                        isM3U8,
                        quality: normalizeQuality(src.quality),
                        title: `Vyla - ${src.name || subProvider.toUpperCase()}`,
                        headers: {
                            'User-Agent': USER_AGENT,
                            ...(src.headers || {}),
                        },
                    });
                }
            });
        } else if (typeof data.url === 'string' && data.url.startsWith('http')) {
            const isM3U8 = data.url.includes('.m3u8');
            sources.push({
                url: data.url,
                type: isM3U8 ? 'hls' : 'mp4',
                isM3U8,
                quality: 'auto',
                title: `Vyla - ${subProvider.toUpperCase()}`,
                headers: { 'User-Agent': USER_AGENT },
            });
        }

        return sources.length > 0 ? sources : null;
    } catch (e) {
        return null;
    }
}

/**
 * Fetches subtitles from Vyla subtitle bases
 */
export async function fetchVylaSubtitles(tmdbId, isTv, season, episode) {
    const subs = [];
    const seenUrls = new Set();

    for (const base of SUBTITLE_BASES) {
        try {
            const path = isTv
                ? `/subtitles/series/${tmdbId}/${season || 1}/${episode || 1}`
                : `/subtitles/movie/${tmdbId}`;

            const res = await fetch(`${base}${path}`, {
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) continue;
            const data = await res.json();

            if (Array.isArray(data)) {
                data.forEach((item, idx) => {
                    const url = item.file || item.url;
                    if (url && !seenUrls.has(url)) {
                        seenUrls.add(url);
                        subs.push({
                            id: `vyla-sub-${idx}`,
                            url,
                            language: (item.lang || item.language || 'en').toLowerCase(),
                            label: item.label || item.name || `English ${idx + 1}`,
                            type: url.endsWith('.srt') ? 'srt' : 'vtt',
                        });
                    }
                });
            } else if (Array.isArray(data?.subtitles)) {
                data.subtitles.forEach((item, idx) => {
                    if (item?.url && !seenUrls.has(item.url)) {
                        seenUrls.add(item.url);
                        subs.push({
                            id: `vyla-sub-${idx}`,
                            url: item.url,
                            language: (item.lang || 'en').toLowerCase(),
                            label: item.lang ? item.lang.toUpperCase() : `Subtitle ${idx + 1}`,
                            type: item.url.endsWith('.srt') ? 'srt' : 'vtt',
                        });
                    }
                });
            }

            if (subs.length > 0) break;
        } catch (e) {
            // Continue to next base
        }
    }

    return subs;
}

/**
 * Main Primary resolver entry point using @vyla-entertainment/sdk architecture.
 * Prioritizes Vyla multi-provider scrapers as primary stream source.
 */
export async function resolveVylaPrimary({
    id,
    type = 'movie',
    season = 1,
    episode = 1,
    preferredVylaKey = null,
    onProgress = null,
    isFallback = false,
}) {
    const isTv = type === 'tv';

    onProgress?.({
        type: isFallback ? 'vyla_fallback' : 'vyla_primary',
        message: isFallback
            ? 'Fallback: Activating Vyla SDK stream resolver...'
            : 'Connecting to Vyla SDK Primary Stream Engine...',
    });

    const providersToTry = preferredVylaKey
        ? [preferredVylaKey, ...VYLA_PROVIDERS.filter((p) => p.id !== preferredVylaKey).map((p) => p.id)]
        : VYLA_PROVIDERS.map((p) => p.id);

    for (let i = 0; i < providersToTry.length; i++) {
        const provId = providersToTry[i];
        const provObj = VYLA_PROVIDERS.find((p) => p.id === provId) || VYLA_PROVIDERS[0];

        onProgress?.({
            type: 'vyla_attempt',
            provider: provId,
            label: provObj.label,
            index: i + 1,
            total: providersToTry.length,
            message: `Connecting to ${provObj.label} (${i + 1}/${providersToTry.length})...`,
        });

        let sources = null;

        if (provObj.key === 'vidlink') {
            sources = await resolveVidLinkStream(id, isTv, season, episode);
        } else {
            sources = await resolveVylaClusterStream(id, isTv, season, episode, provObj.key);
        }

        if (sources && sources.length > 0) {
            const subtitles = await fetchVylaSubtitles(id, isTv, season, episode);

            return {
                success: true,
                isVylaPrimary: !isFallback,
                isFallback,
                provider: provObj.id,
                providerLabel: provObj.label,
                sources,
                subtitles,
            };
        }
    }

    return null;
}

/**
 * Backward compatibility alias for resolveVylaPrimary
 */
export async function resolveVylaFallback(params) {
    return resolveVylaPrimary({
        ...params,
        isFallback: true,
    });
}
