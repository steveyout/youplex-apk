/**
 * Multi-Provider Player Configuration
 */

export const PLAYER_CONFIG = {
    providers: {
        vidsrcme_ru_live: {
            name: "Live Server 1",
            baseUrl: "https://vidsrcme.ru/embed",
            type: "vidsrc-style"
        },
        vidsrcme_su_live: {
            name: "Live Server 2",
            baseUrl: "https://vidsrcme.su/embed",
            type: "vidsrc-style"
        },
        vidsrc_me_ru_live: {
            name: "Live Server 3",
            baseUrl: "https://vidsrc-me.ru/embed",
            type: "vidsrc-style"
        },
        vidsrc_me_su_live: {
            name: "Live Server 4",
            baseUrl: "https://vidsrc-me.su/embed",
            type: "vidsrc-style"
        },
        vidsrc_embed_ru_live: {
            name: "Live Server 5",
            baseUrl: "https://vidsrc-embed.ru/embed",
            type: "vidsrc-style"
        },
        vidsrc_embed_su_live: {
            name: "Live Server 6",
            baseUrl: "https://vidsrc-embed.su/embed",
            type: "vidsrc-style"
        },
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
            type: "tmdb-param"
        },
        two_embed: {
            name: "Server 5",
            baseUrl: "https://www.2embed.cc/embed",
            type: "vidsrc-style"
        },
        embed_su: {
            name: "Server 6",
            baseUrl: "https://embed.skin/embed",
            type: "vidsrc-style"
        }
    },

    defaultProvider: "vidsrc_ru",

    whitelist: [
        'vidsrcme.ru', 'vidsrcme.su', 'vidsrc-me.ru', 'vidsrc-me.su',
        'vidsrc-embed.ru', 'vidsrc-embed.su', 'vidsrc.xyz', 'vidsrc.to',
        'vidsrc.me', '2embed.cc', '2embed.to', 'vidplay.site', 'filemoon.sx',
        'vizcloud.online', 'rabbitstream.net', 'fsharetv.co',
        'multiembed.mov', 'superembed.online', 'embed.su',
        'anyembed.to', 'admin-panel.site', 'player.vidsrc.xyz'
    ],

    blacklist: [
        'googleads', 'doubleclick', 'popads', 'betting', 'casino',
        'exoclick', 'adsterra', 'onclickalgo'
    ],

    hiddenElements: [],

    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};