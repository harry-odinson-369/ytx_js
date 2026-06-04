import { StreamManifest } from "../helpers/stream_manifest";
import YoutubeAPIClient from "../utils/clients";
import PageAPI from "./page";
import RelatedVideosArray, { RelatedVideosAPI } from "./related_videos";
import StreamsAPI from "./streams";

/** * Typedef MusicData = ({String? song, String? artist, String? album, Uri? image});
 * Replicated as a TypeScript type alias.
 */
export type MusicData = {
    song?: string;
    artist?: string;
    album?: string;
    image?: string; // Uri maps cleanly to string in JavaScript environments
};

/**
 * YouTube video metadata.
 * Ported from a Dart Freezed class structure.
 */
export class VideoInfo {
    // All fields are marked public and readonly to simulate Freezed immutability
    public readonly id: string;
    public readonly title: string;
    public readonly author: string;
    public readonly channelId: ChannelId;
    public readonly uploadDate: string;
    public readonly publishDate: string;
    public readonly description: string;
    public readonly duration: number; // Dart's Duration maps well to milliseconds/seconds as a number
    public readonly thumbnails: ThumbnailSet;
    public readonly keywords: readonly string[]; // readonly array enforces immutability like UnmodifiableListView
    public readonly engagement: Engagement;
    public readonly isLive: boolean;
    public readonly musicData: readonly MusicData[];

    /** Used internally. Hidden from casual external access via standard property notation. */
    page?: PageAPI;

    /**
     * Main Constructor mimicking the Freezed default and _internal constructor sequence.
     */
    constructor(
        id: string,
        title: string,
        author: string,
        channelId: ChannelId,
        uploadDate: string,
        publishDate: string,
        description: string,
        duration: number,
        thumbnails: ThumbnailSet,
        keywords: string[],
        engagement: Engagement,
        isLive: boolean,
        musicData: MusicData[] = [],
        page?: PageAPI,
    ) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.channelId = channelId;
        this.uploadDate = uploadDate;
        this.publishDate = publishDate;
        this.description = description;
        this.duration = duration;
        this.thumbnails = thumbnails;
        this.engagement = engagement;
        this.isLive = isLive;

        // Dart: UnmodifiableListView(keywords ?? const Iterable.empty())
        // TypeScript: We create a shallow copy and freeze it to make it completely unmodifiable
        this.keywords = Object.freeze(keywords ?? []);
        this.musicData = Object.freeze(musicData);

        this.page = page;
    }

    /** Video URL computed getter. */
    public get url(): string {
        return `https://www.youtube.com/watch?v=${this.id}`;
    }

    /** Returns true if the watch page is available for this video. */
    public get hasWatchPage(): boolean {
        return this.page !== null;
    }

    streams(ytclients?: YoutubeAPIClient[]): Promise<StreamManifest | undefined> {
        return new Promise<StreamManifest | undefined>(async resolve => {
            if (!this.page) {
                resolve(undefined);
                return;
            }
            const api = new StreamsAPI(this.id, this.page.client, this.page);
            const manifest = await api.request({ ytclients });
            resolve(manifest);
        });
    }

    get getrelatedvideos(): Promise<RelatedVideosArray | undefined> {
        return new Promise<RelatedVideosArray | undefined>(async resolve => {
            if (!this.page) {
                resolve(undefined);
                return undefined;
            }
            for (let i = 0; i < 3; i++) {
                const api = await RelatedVideosAPI.request(this.page.client, this);
                if (api) {
                    const videos = api.relatedvideos;
                    if (videos.length) {
                        const related = new RelatedVideosArray(videos, api);
                        resolve(related);
                        return;
                    }
                }
            }
            resolve(undefined);
        });
    }

    static frompage = (page: PageAPI): VideoInfo => new VideoInfo(
        page.videoId,
        page.playerresponse.videotitle,
        page.playerresponse.videoauthor,
        new ChannelId(page.playerresponse.videochannelid),
        page.playerresponse.videouploaddate,
        page.playerresponse.videopublishdate,
        page.playerresponse.videodescription,
        page.playerresponse.videoduration,
        new ThumbnailSet(page.videoId),
        page.playerresponse.videokeywords,
        new Engagement(page.playerresponse.videoviewcount, page.videolikescount, page.videodislikescount),
        page.playerresponse.islive,
        page.initialdata.getmusicdata(),
        page,
    );
}

/**
 * Encapsulates a valid YouTube channel ID.
 * Ported from a Dart Freezed class structure.
 */
export class ChannelId {
    /** ID as a string. Marked readonly to guarantee immutability. */
    public readonly value: string;

    /**
     * Main constructor.
     * Replicates Dart's default factory constructor behavior.
     * Throws an error if the channel ID or URL is invalid.
     */
    constructor(value: string) {
        const id = ChannelId.parseChannelId(value);
        if (id === null) {
            throw new Error(`ArgumentError: Invalid channel id value: "${value}"`);
        }
        this.value = id;
    }

    /**
     * Converts an object to a ChannelId.
     * If it is already a ChannelId, it returns the object directly.
     * Replicates Dart's `factory ChannelId.fromString(dynamic obj)`
     */
    public static fromString(obj: any): ChannelId {
        if (obj instanceof ChannelId) {
            return obj;
        }
        // Ensures we handle the object's string representation
        const stringValue = obj !== null && obj !== undefined ? obj.toString() : '';
        return new ChannelId(stringValue);
    }

    /**
     * Returns true if the given id is a valid channel id format.
     * Replicates Dart's `static bool validateChannelId(String id)`
     */
    public static validateChannelId(id?: string): boolean {
        // Mimics `.isNullOrWhiteSpace` extension check
        if (!id) {
            return false;
        }

        if (!id.startsWith('UC')) {
            return false;
        }

        if (id.length !== 24) {
            return false;
        }

        // Negative match check: returns false if any invalid characters exist
        const invalidCharsExp = /[^0-9a-zA-Z_\-]/;
        return !invalidCharsExp.test(id);
    }

    /**
     * Parses a channel id from a URL or raw string.
     * Returns null if a valid channel ID cannot be extracted.
     * Replicates Dart's `static String? parseChannelId(String url)`
     */
    public static parseChannelId(url: string): string | null {
        if (!url || url.length === 0) {
            return null;
        }

        if (ChannelId.validateChannelId(url)) {
            return url;
        }

        const regExp = /youtube\..+?\/channel\/(.*?)(?:\?|&|\/|$)/;
        const match = regExp.exec(url);
        const regMatch = match ? match[1] : null;

        if (regMatch && regMatch.trim().length > 0 && ChannelId.validateChannelId(regMatch)) {
            return regMatch;
        }

        return null;
    }

    /** Custom string representation logic matching Dart's overriding signature */
    public toString(): string {
        return this.value;
    }
}

/**
 * Set of thumbnails for a video.
 * Ported from a Dart Freezed class structure.
 */
export class ThumbnailSet {
    /** Video ID used to build image URLs. Marked readonly for immutability. */
    public readonly videoId: string;

    /**
     * Initializes an instance of [ThumbnailSet]
     * Replicates Dart's default factory constructor.
     */
    constructor(videoId: string) {
        this.videoId = videoId;
    }

    /** Low resolution thumbnail URL. */
    public get lowResUrl(): string {
        return `https://img.youtube.com/vi/${this.videoId}/default.jpg`;
    }

    /** Medium resolution thumbnail URL. */
    public get mediumResUrl(): string {
        return `https://img.youtube.com/vi/${this.videoId}/mqdefault.jpg`;
    }

    /** High resolution thumbnail URL. */
    public get highResUrl(): string {
        return `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
    }

    /** * Standard resolution thumbnail URL.
     * Not always available.
     */
    public get standardResUrl(): string {
        return `https://img.youtube.com/vi/${this.videoId}/sddefault.jpg`;
    }

    /** * Max resolution thumbnail URL.
     * Not always available.
     */
    public get maxResUrl(): string {
        return `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
    }
}

/**
 * User activity statistics.
 * Ported from a Dart Freezed class structure.
 */
export class Engagement {
    /** View count. */
    public readonly viewCount: number;

    /** Like count. Can be null if hidden or unavailable. */
    public readonly likeCount: number;

    /** Dislike count. Can be null if hidden or unavailable. */
    public readonly dislikeCount: number;

    /**
     * Initializes an instance of [Engagement]
     * Replicates Dart's default factory constructor.
     */
    constructor(viewCount: number, likeCount: number, dislikeCount: number) {
        this.viewCount = viewCount;
        this.likeCount = likeCount;
        this.dislikeCount = dislikeCount;
    }

    /**
     * Average user rating in stars (1 star to 5 stars).
     * Returns -1 if likeCount or dislikeCount is null.
     */
    public get avgRating(): number {
        if (this.likeCount === null || this.dislikeCount === null) {
            return -1;
        }

        if (this.likeCount + this.dislikeCount === 0) {
            return 0;
        }

        // Equivalent to the Dart: 1 + 4.0 * likeCount! / (likeCount! + dislikeCount!)
        return 1 + (4.0 * this.likeCount) / (this.likeCount + this.dislikeCount);
    }
}