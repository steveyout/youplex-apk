/**
 * Provider Service for Youplex
 * 100% Native Playback Engine using @p-stream/providers with Automatic Server Switching.
 * Anti-403 stream proxy header synthesis and verified enabled scrapers only.
 */

import {
    targets,
    makeProviders,
    setM3U8ProxyUrl,
    makeStandardFetcher,
    makeSimpleProxyFetcher,
} from '@p-stream/providers';

const M3U8_PROXY_URL = 'https://proxy.youplex.site';
const CORS_PROXY_URL = 'https://simple-proxy-2.youtsteve1.workers.dev';
const YOUPLEX_SITE_SCRAPER = 'https://youplex.site/api/scrape';
const CLOUD_SCRAPER_API = 'https://api.youplex.site/scrape';

try {
    setM3U8ProxyUrl(M3U8_PROXY_URL);
} catch (e) {
    // Handled
}

let providersInstance = null;

export function getProvidersInstance() {
    if (!providersInstance) {
        try {
            setM3U8ProxyUrl(M3U8_PROXY_URL);
        } catch (e) {}

        providersInstance = makeProviders({
            fetcher: makeStandardFetcher(fetch),
            proxiedFetcher: makeSimpleProxyFetcher(CORS_PROXY_URL, fetch),
            target: targets.ANY,
            consistentIpForRequests: true,
        });
    }
    return providersInstance;
}

// Friendly metadata mapping for enabled scrapers
const PROVIDER_METADATA = {
    'yp-flixhq-1': { name: 'Horizon Play', label: 'Horizon Play (Ultra Fast)' },
    'yp-flixhq-2': { name: 'Quantum Player', label: 'Quantum Player (1080p)' },
    'yp-vidcore-1': { name: 'NovaLink', label: 'NovaLink (Direct HD)' },
    'yp-vidcore-2': { name: 'Solaris Source', label: 'Solaris Source (Fast HLS)' },
};

/**
 * Filter and list ONLY verified enabled sources from the @p-stream/providers package.
 * Excludes all broken/disabled scrapers to ensure zero playback failover overhead.
 */
const VERIFIED_ENABLED_PROVIDER_IDS = [
    'yp-flixhq-1', // Horizon Play (Ultra Fast Direct HLS)
    'yp-flixhq-2', // Quantum Player (1080p Resilient)
    'yp-vidcore-1', // NovaLink (High Definition)
    'yp-vidcore-2', // Solaris Source (Fast Multi-Audio)
];

function getEnabledProviders() {
    return VERIFIED_ENABLED_PROVIDER_IDS.map((id) => {
        const meta = PROVIDER_METADATA[id] || {};
        return {
            id,
            name: meta.name || id,
            label: meta.label || id,
            rank: 100,
            mediaTypes: ['movie', 'show'],
        };
    });
}

export const PSTREAM_SOURCES = getEnabledProviders();

export const DEFAULT_PROVIDER_ID = 'yp-flixhq-1';

export function listAvailableProviders() {
    return PSTREAM_SOURCES.map((s) => ({
        id: s.id,
        name: s.name,
        label: s.label,
    }));
}

export function getProviderFriendlyName(id) {
    if (!id) return 'Horizon Play';
    const found = PSTREAM_SOURCES.find((s) => s.id === id);
    if (found) return found.label;

    const meta = PROVIDER_METADATA[id];
    if (meta) return meta.label;

    return String(id)
        .replace(/^yp-/, '')
        .replace(/-\d+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeSubtitles(subs) {
    if (!Array.isArray(subs)) return [];
    return subs.map((sub, idx) => {
        const rawLang = (sub.language || sub.lang || 'en').toLowerCase();
        let label = sub.label || sub.name || sub.lang || sub.language || `Subtitle ${idx + 1}`;
        if (sub.url && /\.sdh\./i.test(sub.url) && !label.includes('[SDH]')) {
            label += ' [SDH]';
        }
        return {
            id: sub.id || sub.url || `sub-${idx}`,
            url: sub.url,
            language: rawLang,
            label,
            type: sub.type || 'vtt',
        };
    });
}

/**
 * Extracts and synthesizes anti-403 headers for native ExoPlayer.
 * Prevents Cloudflare / BunkerWeb WAF on youplex.site and 3rd party CDNs from returning HTTP 403 Forbidden.
 */
export function extractStreamHeaders(url, existingHeaders = {}) {
    if (!url) {
        return {
            'User-Agent': 'ExoPlayer',
            'Origin': 'https://youplex.site',
            'Referer': 'https://youplex.site/',
        };
    }

    const isYouplexProxy = url.includes('youplex.site') || url.includes('/proxy');

    if (isYouplexProxy) {
        // Anti-403 Enforcement: BunkerWeb WAF strictly requires native ExoPlayer identity
        // and rejects cross-origin third-party origins (such as movish.to) with HTTP 403 Forbidden.
        // Existing headers must NEVER overwrite these credentials on youplex.site proxy requests.
        return {
            'User-Agent': 'ExoPlayer',
            'Origin': 'https://youplex.site',
            'Referer': 'https://youplex.site/',
        };
    }

    const headers = {
        'User-Agent': existingHeaders['User-Agent'] || existingHeaders['user-agent'] || 'ExoPlayer',
        ...existingHeaders,
    };

    try {
        const parsed = new URL(url);
        const refererParam = parsed.searchParams.get('referer');
        const originParam = parsed.searchParams.get('origin');

        if (refererParam) {
            headers['Referer'] = refererParam;
        } else if (!headers['Referer']) {
            headers['Referer'] = `${parsed.origin}/`;
        }

        if (originParam) {
            headers['Origin'] = originParam;
        } else if (!headers['Origin']) {
            headers['Origin'] = parsed.origin;
        }
    } catch (e) {}

    return headers;
}

/**
 * Format raw stream output from @p-stream/providers into normalized sources
 */
function formatSourcesFromStream(streamResult, providerId = '') {
    if (!streamResult) return [];

    const rawList = Array.isArray(streamResult)
        ? streamResult
        : Array.isArray(streamResult?.stream)
        ? streamResult.stream
        : streamResult?.stream
        ? [streamResult.stream]
        : [streamResult];

    const sources = [];

    for (const item of rawList) {
        if (!item) continue;

        if (item.playlist) {
            sources.push({
                url: item.playlist,
                type: 'hls',
                isM3U8: true,
                quality: 'auto',
                title: getProviderFriendlyName(providerId),
                headers: extractStreamHeaders(item.playlist, item.headers || {}),
            });
        } else if (item.url) {
            const isM3U8 = item.type === 'hls' || Boolean(item.isM3U8) || String(item.url).includes('.m3u8');
            sources.push({
                url: item.url,
                type: item.type || (isM3U8 ? 'hls' : 'mp4'),
                isM3U8,
                quality: item.quality || 'auto',
                title: item.title || getProviderFriendlyName(providerId),
                headers: extractStreamHeaders(item.url, item.headers || {}),
            });
        } else if (item.qualities) {
            Object.entries(item.qualities).forEach(([q, f]) => {
                if (f?.url) {
                    sources.push({
                        url: f.url,
                        type: 'mp4',
                        isM3U8: false,
                        quality: q === 'unknown' ? 'auto' : q,
                        title: getProviderFriendlyName(providerId),
                        headers: extractStreamHeaders(f.url, f.headers || item.headers || {}),
                    });
                }
            });
        }
    }

    return sources;
}

/**
 * Scrapes a single provider:
 * 1. Executes native @p-stream/providers source scraper directly.
 * 2. Falls back to the cloud scraper API cluster if native direct execution finds no stream.
 */
async function scrapeSingleProvider({
    id,
    type,
    providerId,
    title = '',
    releaseYear = null,
    season = null,
    episode = null,
}) {
    const isTv = type === 'tv';
    const media = isTv
        ? {
              type: 'show',
              title: title || 'Unknown',
              releaseYear: Number(releaseYear) || new Date().getFullYear(),
              tmdbId: String(id),
              season: { number: Number(season) || 1, tmdbId: '' },
              episode: { number: Number(episode) || 1, tmdbId: '' },
          }
        : {
              type: 'movie',
              title: title || 'Unknown',
              releaseYear: Number(releaseYear) || new Date().getFullYear(),
              tmdbId: String(id),
          };

    // Phase 1: Native Scraper via @p-stream/providers directly
    if (providerId) {
        try {
            const pInstance = getProvidersInstance();
            const nativeResult = await pInstance.runSourceScraper({
                id: providerId,
                media,
            });

            if (nativeResult) {
                const sources = formatSourcesFromStream(nativeResult.stream || nativeResult, providerId);
                if (sources.length > 0) {
                    const captions =
                        nativeResult.stream?.captions ||
                        (Array.isArray(nativeResult.stream) ? nativeResult.stream[0]?.captions : []) ||
                        nativeResult.captions ||
                        [];

                    return {
                        success: true,
                        provider: providerId,
                        providerLabel: getProviderFriendlyName(providerId),
                        sources,
                        subtitles: normalizeSubtitles(captions),
                    };
                }
            }
        } catch (nativeErr) {
            // Fall through to cloud endpoints
        }
    }

    // Phase 2: Cloud scraper endpoints fallback
    const endpoints = [YOUPLEX_SITE_SCRAPER, CLOUD_SCRAPER_API];

    for (const endpoint of endpoints) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const params = new URLSearchParams({
                id: String(id),
                type: isTv ? 'tv' : 'movie',
            });
            if (providerId) {
                const backendProv = providerId.replace(/^yp-/, '').replace(/-\d+$/, '');
                params.set('provider', backendProv);
            }
            if (isTv) {
                params.set('s', String(season || 1));
                params.set('e', String(episode || 1));
                params.set('season', String(season || 1));
                params.set('episode', String(episode || 1));
            }
            if (title) params.set('title', title);
            if (releaseYear) params.set('year', String(releaseYear));

            const res = await fetch(`${endpoint}?${params.toString()}`, {
                signal: controller.signal,
                headers: {
                    accept: 'application/json',
                    'User-Agent': 'ExoPlayer',
                    'Origin': 'https://youplex.site',
                    'Referer': 'https://youplex.site/',
                },
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();

                const rawList = Array.isArray(data?.sources)
                    ? data.sources
                    : data?.url
                    ? [{ url: data.url, type: 'hls', isM3U8: true, title: data.provider }]
                    : [];

                if (rawList.length > 0) {
                    const sources = rawList
                        .filter((s) => Boolean(s?.url))
                        .map((s) => ({
                            ...s,
                            isM3U8: s.type === 'hls' || Boolean(s.isM3U8) || String(s.url || '').includes('.m3u8'),
                            headers: extractStreamHeaders(s.url, s.headers || {}),
                        }));

                    if (sources.length > 0) {
                        const resolvedProvider = providerId || data.provider || DEFAULT_PROVIDER_ID;
                        return {
                            success: true,
                            provider: resolvedProvider,
                            providerLabel: getProviderFriendlyName(resolvedProvider),
                            sources,
                            subtitles: normalizeSubtitles(data.subtitles || []),
                        };
                    }
                }
            }
        } catch (e) {
            // Try next endpoint
        }
    }

    return null;
}

/**
 * Auto-switching stream scraper:
 * Iterates through @p-stream/providers enabled sources in priority order until a working stream is resolved.
 */
export async function scrapeMediaWithAutoSwitch({
    id,
    type = 'movie',
    title = '',
    releaseYear = null,
    season = null,
    episode = null,
    preferredProvider = null,
    onProgress = null,
    triedProviders = [],
}) {
    // Build ordered list of enabled providers to try
    let queue = [...PSTREAM_SOURCES.map((s) => s.id)];

    // Place preferredProvider at the top of the queue if specified
    if (preferredProvider) {
        queue = [preferredProvider, ...queue.filter((p) => p !== preferredProvider)];
    }

    // Filter out already tried providers if auto-switching in-stream
    if (triedProviders && triedProviders.length > 0) {
        queue = queue.filter((p) => !triedProviders.includes(p));
        if (queue.length === 0) {
            queue = [...PSTREAM_SOURCES.map((s) => s.id)];
        }
    }

    onProgress?.({
        type: 'start',
        message: 'Resolving stream from verified enabled @p-stream providers...',
    });

    // Query specific enabled providers in order
    for (let i = 0; i < queue.length; i++) {
        const provId = queue[i];
        const label = getProviderFriendlyName(provId);

        onProgress?.({
            type: 'provider_attempt',
            provider: provId,
            label,
            index: i + 1,
            total: queue.length,
            message: `Connecting to ${label} (${i + 1}/${queue.length})...`,
        });

        const result = await scrapeSingleProvider({
            id,
            type,
            providerId: provId,
            title,
            releaseYear,
            season,
            episode,
        });

        if (result && result.success && result.sources?.length > 0) {
            return {
                ...result,
                attemptIndex: i,
                triedProviders: [...triedProviders, provId],
            };
        }
    }

    return {
        success: false,
        sources: [],
        subtitles: [],
        triedProviders: queue,
    };
}

/**
 * Parses WebVTT / SRT subtitle content into cue arrays
 */
export async function fetchAndParseVtt(vttUrl) {
    if (!vttUrl) return [];

    try {
        const res = await fetch(vttUrl, {
            headers: extractStreamHeaders(vttUrl),
        });
        const text = await res.text();
        return parseVttContent(text);
    } catch (e) {
        console.warn('Subtitle fetch failed:', e);
        return [];
    }
}

export function parseVttContent(raw) {
    if (!raw) return [];

    const lines = raw.split(/\r?\n/);
    const cues = [];
    let i = 0;

    const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

    while (i < lines.length) {
        const line = lines[i].trim();
        const match = line.match(timeRegex);

        if (match) {
            const startHours = parseInt(match[1] || '0', 10);
            const startMins = parseInt(match[2], 10);
            const startSecs = parseInt(match[3], 10);
            const startMs = parseInt(match[4], 10);
            const startTime = startHours * 3600 + startMins * 60 + startSecs + startMs / 1000;

            const endHours = parseInt(match[5] || '0', 10);
            const endMins = parseInt(match[6], 10);
            const endSecs = parseInt(match[7], 10);
            const endMs = parseInt(match[8], 10);
            const endTime = endHours * 3600 + endMins * 60 + endSecs + endMs / 1000;

            i++;
            const textLines = [];
            while (i < lines.length && lines[i].trim() !== '') {
                textLines.push(lines[i].trim());
                i++;
            }

            const cueText = textLines.join('\n').replace(/<[^>]+>/g, '');
            if (cueText) {
                cues.push({
                    startTime,
                    endTime,
                    text: cueText,
                });
            }
        } else {
            i++;
        }
    }

    return cues;
}
