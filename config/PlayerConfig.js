/**
 * Multi-Provider Player Configuration
 */

export const PLAYER_CONFIG = {
    providers: {
        rivestream: {
            name: "Server 7 (Rive)",
            baseUrl: "https://rivestream.org/embed",
            type: "rivestream-style"
        },
        letsembed: {
            name: "Server 9 (Lets)",
            baseUrl: "https://letsembed.cc/embed",
            type: "letsembed-style"
        },
        multiembed: {
            name: "Server 8 (Multi)",
            baseUrl: "https://multiembed.mov/",
            type: "multiembed-style"
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
        auto_embed: {
            name: "Server 6",
            baseUrl: "hhttps://player.autoembed.cc/embed",
            type: "vidsrc-style"
        },
    },

    defaultProvider: "vidsrc_ru",

    whitelist: [
        'letsembed.cc', 'rivestream.org', 'multiembed.mov', 'vidsrc-embed.ru',
        'vidsrc.xyz', 'vidsrc.to', 'vidsrc.me', '2embed.cc', '2embed.to',
        'vidplay.site', 'filemoon.sx', 'vizcloud.online', 'rabbitstream.net',
        'fsharetv.co', 'superembed.online', 'embed.su', 'anyembed.to'
    ],

    blacklist: [
        'googleads', 'doubleclick', 'popads', 'betting', 'casino',
        'exoclick', 'adsterra', 'onclickalgo'
    ],

    hiddenElements: [],

    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};