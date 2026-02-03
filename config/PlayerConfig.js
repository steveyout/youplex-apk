/**
 * Multi-Provider Player Configuration
 */

export const PLAYER_CONFIG = {
    providers: {
        vidsrc_ru: {
            name: "Server 1",
            baseUrl: "https://vidsrc-embed.ru/embed",
            type: "vidsrc-style"
        },
        vidsrc_xyz: {
            name: "Server 2",
            baseUrl: "https://vidsrc.xyz/embed",
            type: "vidsrc-style"
        },
        vidsrc_to: {
            name: "Server 3 (VIP)",
            baseUrl: "https://vidsrc.to/embed",
            type: "vidsrc-style"
        },
        superembed: {
            name: "Server 4",
            baseUrl: "https://multiembed.mov/directstream.php?video_id=",
            type: "tmdb-param" // Needs &tmdb=1 for movies
        },
        two_embed: {
            name: "Server 5",
            baseUrl: "https://www.2embed.cc/embed",
            type: "vidsrc-style"
        },
        embed_su: {
            name: "Server 6",
            baseUrl: "https://embed.su/embed",
            type: "vidsrc-style"
        }
    },

    defaultProvider: "vidsrc_ru",

    // Expanded whitelist for all new providers and their CDNs
    whitelist: [
        'vidsrc-embed.ru', 'vidsrc.xyz', 'vidsrc.to', 'vidsrc.me',
        '2embed.cc', '2embed.to', 'vidplay.site', 'filemoon.sx',
        'vizcloud.online', 'rabbitstream.net', 'fsharetv.co',
        'multiembed.mov', 'superembed.online', 'embed.su',
        'anyembed.to', 'admin-panel.site', 'player.vidsrc.xyz'
    ],

    blacklist: [
        'googleads', 'doubleclick', 'popads', 'betting', 'casino',
        'exoclick', 'adsterra', 'onclickalgo'
    ],

    hiddenElements: [
        /*
        '.jw-controls', '.vjs-control-bar', '.vjs-big-play-button',
        '.player-controls', '.logo', '.brand-logo', '.vjs-poster',
        '#skip_button', '.ad-overlay', '.message-overlay'

         */
    ],

    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};