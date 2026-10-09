import * as FormData_2 from 'form-data';

export declare function buildProviders(): ProviderBuilder;

declare type Caption = {
    type: CaptionType;
    id: string;
    opensubtitles?: boolean;
    url: string;
    hasCorsRestrictions: boolean;
    language: string;
    flagUrl?: string;
    display?: string;
    media?: string;
    isHearingImpaired?: boolean;
    source?: string;
    encoding?: string;
};

declare type CaptionType = keyof typeof captionTypes;

declare const captionTypes: {
    srt: string;
    vtt: string;
};

declare type CommonMedia = {
    title: string;
    releaseYear: number;
    imdbId?: string;
    tmdbId: string;
};

/**
 * Creates a proxied M3U8 URL using the configured M3U8 proxy
 * @param url - The original M3U8 URL to proxy
 * @param features - Feature map to determine if local proxy (extension/native) is available
 * @param headers - Headers to include with the request
 * @returns The proxied M3U8 URL or original URL if local proxy is available
 */
export declare function createM3U8ProxyUrl(url: string, features?: FeatureMap, headers?: Record<string, string>): string;

export declare type DefaultedFetcherOptions = {
    baseUrl?: string;
    body?: Record<string, any> | string | FormData_2;
    headers: Record<string, string>;
    query: Record<string, string>;
    readHeaders: string[];
    method: 'HEAD' | 'GET' | 'POST';
    credentials?: 'include' | 'same-origin' | 'omit';
};

declare type DiscoverEmbedsEvent = {
    sourceId: string;
    embeds: Array<{
        id: string;
        embedScraperId: string;
    }>;
};

declare type Embed = EmbedOptions & {
    type: 'embed';
    disabled: boolean;
    mediaTypes: undefined;
};

declare type EmbedInput = {
    url: string;
};

export declare type EmbedOptions = {
    id: string;
    name: string;
    rank: number;
    disabled?: boolean;
    flags: Flags[];
    scrape: (input: EmbedScrapeContext) => Promise<EmbedOutput>;
};

export declare type EmbedOutput = {
    stream: Stream[];
};

export declare interface EmbedRunnerOptions {
    events?: IndividualScraperEvents;
    url: string;
    id: string;
    disableOpensubtitles?: boolean;
}

export declare type EmbedScrapeContext = EmbedInput & ScrapeContext;

declare type FeatureMap = {
    requires: Flags[];
    disallowed: Flags[];
};

export declare type Fetcher = {
    <T = any>(url: string, ops: DefaultedFetcherOptions): Promise<FetcherResponse<T>>;
};

export declare type FetcherOptions = {
    baseUrl?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    method?: 'HEAD' | 'GET' | 'POST';
    readHeaders?: string[];
    body?: Record<string, any> | string | FormData_2 | URLSearchParams;
    credentials?: 'include' | 'same-origin' | 'omit';
};

export declare type FetcherResponse<T = any> = {
    statusCode: number;
    headers: Headers;
    finalUrl: string;
    body: T;
};

declare type FetchHeaders = {
    get(key: string): string | null;
    set(key: string, value: string): void;
};

declare type FetchLike = (url: string, ops?: FetchOps | undefined) => Promise<FetchReply>;

/**
 * This file is a very relaxed definition of the fetch api
 * Only containing what we need for it to function.
 */
declare type FetchOps = {
    headers: Record<string, string>;
    method: string;
    body: any;
    credentials?: 'include' | 'same-origin' | 'omit';
    signal?: any;
};

declare type FetchReply = {
    text(): Promise<string>;
    json(): Promise<any>;
    arrayBuffer(): Promise<ArrayBuffer>;
    extraHeaders?: FetchHeaders;
    extraUrl?: string;
    headers: FetchHeaders;
    url: string;
    status: number;
};

export declare type FileBasedStream = StreamCommon & {
    type: 'file';
    qualities: Partial<Record<Qualities, StreamFile>>;
};

export declare type Flags = (typeof flags)[keyof typeof flags];

export declare const flags: {
    readonly CORS_ALLOWED: "cors-allowed";
    readonly IP_LOCKED: "ip-locked";
    readonly CF_BLOCKED: "cf-blocked";
    readonly PROXY_BLOCKED: "proxy-blocked";
    readonly MKV_REQUIRED: "mkv-required";
};

export declare type FullScraperEvents = {
    update?: (evt: UpdateEvent) => void;
    init?: (evt: InitEvent) => void;
    discoverEmbeds?: (evt: DiscoverEmbedsEvent) => void;
    start?: (id: string) => void;
};

export declare function getBuiltinEmbeds(): Embed[];

export declare function getBuiltinExternalSources(): Sourcerer[];

export declare function getBuiltinSources(): Sourcerer[];

/**
 * Get the currently configured M3U8 proxy URL
 * @returns The configured M3U8 proxy URL
 */
export declare function getM3U8ProxyUrl(): string;

export declare type HlsBasedStream = StreamCommon & {
    type: 'hls';
    playlist: string;
    proxyDepth?: 0 | 1 | 2;
};

declare type IndividualScraperEvents = {
    update?: (evt: UpdateEvent) => void;
};

declare type InitEvent = {
    sourceIds: string[];
};

export declare function labelToLanguageCode(label: string): string | null;

export declare function makeProviders(ops: ProviderMakerOptions): ProviderControls;

export declare function makeSimpleProxyFetcher(proxyUrl: string, f: FetchLike): Fetcher;

export declare function makeStandardFetcher(f: FetchLike): Fetcher;

declare type MediaScraperTypes = 'show' | 'movie';

export declare type MediaTypes = 'show' | 'movie';

export declare type MetaOutput = {
    type: 'embed' | 'source';
    id: string;
    rank: number;
    name: string;
    flags?: string[];
    mediaTypes?: Array<MediaTypes>;
};

export declare type MovieMedia = CommonMedia & {
    type: 'movie';
};

export declare type MovieScrapeContext = ScrapeContext & {
    media: MovieMedia;
};

export declare class NotFoundError extends Error {
    constructor(reason?: string);
}

export declare type ProviderBuilder = {
    setTarget(target: Targets): ProviderBuilder;
    setFetcher(fetcher: Fetcher): ProviderBuilder;
    setProxiedFetcher(fetcher: Fetcher): ProviderBuilder;
    addSource(scraper: Sourcerer): ProviderBuilder;
    addSource(name: string): ProviderBuilder;
    addEmbed(scraper: Embed): ProviderBuilder;
    addEmbed(name: string): ProviderBuilder;
    addBuiltinProviders(): ProviderBuilder;
    enableConsistentIpForRequests(): ProviderBuilder;
    build(): ProviderControls;
};

export declare interface ProviderControls {
    runAll(runnerOps: RunnerOptions): Promise<RunOutput | null>;
    runSourceScraper(runnerOps: SourceRunnerOptions): Promise<SourcererOutput>;
    runEmbedScraper(runnerOps: EmbedRunnerOptions): Promise<EmbedOutput>;
    getMetadata(id: string): MetaOutput | null;
    listSources(): MetaOutput[];
    listEmbeds(): MetaOutput[];
}

export declare interface ProviderMakerOptions {
    fetcher: Fetcher;
    proxiedFetcher?: Fetcher;
    target: Targets;
    consistentIpForRequests?: boolean;
    externalSources?: 'all' | string[];
    proxyStreams?: boolean;
}

export declare type Qualities = 'unknown' | '360' | '480' | '720' | '1080' | '4k';

export declare interface RunnerOptions {
    sourceOrder?: string[];
    embedOrder?: string[];
    events?: FullScraperEvents;
    media: ScrapeMedia;
    disableOpensubtitles?: boolean;
}

export declare type RunOutput = {
    sourceId: string;
    embedId?: string;
    stream: Stream;
};

export declare type ScrapeContext = {
    proxiedFetcher: UseableFetcher;
    fetcher: UseableFetcher;
    progress(val: number): void;
    features: FeatureMap;
};

export declare type ScrapeMedia = ShowMedia | MovieMedia;

/**
 * Set a custom M3U8 proxy URL to use for all M3U8 proxy requests
 * @param proxyUrl - The base URL of the M3U8 proxy
 */
export declare function setM3U8ProxyUrl(proxyUrl: string): void;

export declare type ShowMedia = CommonMedia & {
    type: 'show';
    episode: {
        number: number;
        tmdbId: string;
    };
    season: {
        number: number;
        tmdbId: string;
        title: string;
        episodeCount?: number;
    };
};

export declare type ShowScrapeContext = ScrapeContext & {
    media: ShowMedia;
};

declare type Sourcerer = SourcererOptions & {
    type: 'source';
    disabled: boolean;
    externalSource: boolean;
    mediaTypes: MediaScraperTypes[];
};

declare type SourcererEmbed = {
    embedId: string;
    url: string;
};

export declare type SourcererOptions = {
    id: string;
    name: string;
    rank: number;
    disabled?: boolean;
    externalSource?: boolean;
    flags: Flags[];
    scrapeMovie?: (input: MovieScrapeContext) => Promise<SourcererOutput>;
    scrapeShow?: (input: ShowScrapeContext) => Promise<SourcererOutput>;
};

export declare type SourcererOutput = {
    embeds: SourcererEmbed[];
    stream?: Stream[];
};

export declare interface SourceRunnerOptions {
    events?: IndividualScraperEvents;
    media: ScrapeMedia;
    id: string;
    disableOpensubtitles?: boolean;
}

export declare type Stream = FileBasedStream | HlsBasedStream;

declare type StreamCommon = {
    id: string;
    flags: Flags[];
    captions: Caption[];
    thumbnailTrack?: ThumbnailTrack;
    headers?: Record<string, string>;
    preferredHeaders?: Record<string, string>;
    skipValidation?: boolean;
};

export declare type StreamFile = {
    type: 'mp4';
    url: string;
};

export declare type Targets = (typeof targets)[keyof typeof targets];

export declare const targets: {
    readonly BROWSER: "browser";
    readonly BROWSER_EXTENSION: "browser-extension";
    readonly NATIVE: "native";
    readonly ANY: "any";
};

declare type ThumbnailTrack = {
    type: 'vtt';
    url: string;
};

declare type UpdateEvent = {
    id: string;
    percentage: number;
    status: UpdateEventStatus;
    error?: unknown;
    reason?: string;
};

declare type UpdateEventStatus = 'success' | 'failure' | 'notfound' | 'pending';

/**
 * Updates an existing M3U8 proxy URL to use the currently configured proxy
 * @param url - The M3U8 proxy URL to update
 * @returns The updated M3U8 proxy URL
 */
export declare function updateM3U8ProxyUrl(url: string): string;

declare type UseableFetcher = {
    <T = any>(url: string, ops?: FetcherOptions): Promise<T>;
    full: <T = any>(url: string, ops?: FetcherOptions) => Promise<FetcherResponse<T>>;
};

export { }


declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, config: TurnstileConfig) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
            getResponse: (widgetId: string) => string;
        };
    }
}

