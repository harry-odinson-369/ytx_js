import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { Framerate } from "./framerate";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";
import { VideoQuality, VideoResolution, VideoStreamInfo } from "./video";

/**
 * Reverse-lookup dictionary mapping string labels back to the VideoQuality enum.
 * Replicates Dart's generated _$VideoQualityEnumMap inversion mechanics.
 */
const VIDEO_QUALITY_STRING_MAP: Record<string, VideoQuality> = {
    'unknown': VideoQuality.Unknown,
    'low144': VideoQuality.Low144,
    'low240': VideoQuality.Low240,
    'medium360': VideoQuality.Medium360,
    'medium480': VideoQuality.Medium480,
    'high720': VideoQuality.High720,
    'high1080': VideoQuality.High1080,
    'high1440': VideoQuality.High1440,
    'high2160': VideoQuality.High2160,
    'high2880': VideoQuality.High2880,
    'high3072': VideoQuality.High3072,
    'high4320': VideoQuality.High4320,
};

/**
 * Forward lookup mapping the VideoQuality enum values to their clean string equivalents.
 */
const VIDEO_QUALITY_ENUM_MAP: Record<VideoQuality, string> = {
    [VideoQuality.Unknown]: 'unknown',
    [VideoQuality.Low144]: 'low144',
    [VideoQuality.Low240]: 'low240',
    [VideoQuality.Medium360]: 'medium360',
    [VideoQuality.Medium480]: 'medium480',
    [VideoQuality.High720]: 'high720',
    [VideoQuality.High1080]: 'high1080',
    [VideoQuality.High1440]: 'high1440',
    [VideoQuality.High2160]: 'high2160',
    [VideoQuality.High2880]: 'high2880',
    [VideoQuality.High3072]: 'high3072',
    [VideoQuality.High4320]: 'high4320',
};

/**
 * YouTube media stream that only contains video.
 */
export class VideoOnlyStreamInfo extends StreamInfo implements VideoStreamInfo {
    public readonly videoId: string;
    public readonly tag: number;
    public readonly url: URL;
    public readonly container: StreamContainer;
    public readonly size: FileSize;
    public readonly bitrate: Bitrate;
    public readonly videoCodec: string;
    public readonly qualityLabel: string;
    public readonly videoQuality: VideoQuality;
    public readonly videoResolution: VideoResolution;
    public readonly framerate: Framerate;
    public readonly fragments: readonly Fragment[];
    public readonly codec: MediaType;

    constructor(
        videoId: string,
        tag: number,
        url: URL,
        container: StreamContainer,
        size: FileSize,
        bitrate: Bitrate,
        videoCodec: string,
        qualityLabel: string,
        videoQuality: VideoQuality,
        videoResolution: VideoResolution,
        framerate: Framerate,
        fragments: Fragment[],
        codec: MediaType
    ) {
        super(); // Inherits the automated runtimeType property and isThrottled business logic
        this.videoId = videoId;
        this.tag = tag;
        this.url = url;
        this.container = container;
        this.size = size;
        this.bitrate = bitrate;
        this.videoCodec = videoCodec;
        this.qualityLabel = qualityLabel;
        this.videoQuality = videoQuality;
        this.videoResolution = videoResolution;
        this.framerate = framerate;
        this.fragments = Object.freeze([...fragments]); // Preserves immutability
        this.codec = codec;
    }

    // ============================================================================
    // Interface Property Overrides & Getters
    // ============================================================================

    /** * Video quality label, as seen on YouTube.
     * @deprecated Use qualityLabel instead.
     */
    public get videoQualityLabel(): string {
        return this.qualityLabel;
    }

    // ============================================================================
    // Serialization (Replicating the Generated JsonSerializable Logic)
    // ============================================================================

    /**
     * Instantiates a VideoOnlyStreamInfo from a raw JSON map sequence.
     * Directly replicates: _$VideoOnlyStreamInfoFromJson
     */
    public static fromJson(json: Record<string, any>): VideoOnlyStreamInfo {
        const rawFragments = Array.isArray(json['fragments']) ? json['fragments'] : [];
        const parsedFragments = rawFragments.map((e: any) => Fragment.fromJson(e));

        // Decodes the string back into our TypeScript numeric Enum key
        const decodedEnumString = String(json['videoQuality']);
        const resolvedQuality = VIDEO_QUALITY_STRING_MAP[decodedEnumString] ?? VideoQuality.Unknown;

        return new VideoOnlyStreamInfo(
            json['videoId'],
            Number(json['tag']),
            new URL(json['url']),
            StreamContainer.fromJson(json['container']),
            FileSize.fromJson(json['size']),
            Bitrate.fromJson(json['bitrate']),
            String(json['videoCodec']),
            String(json['qualityLabel']),
            resolvedQuality,
            VideoResolution.fromJson(json['videoResolution']),
            Framerate.fromJson(json['framerate']),
            parsedFragments,
            MediaType.parse(json['codec'])
        );
    }

    /**
     * Serializes the concrete instance properties down into a flat JSON-safe object dictionary.
     * Directly replicates: _$VideoOnlyStreamInfoToJson
     */
    public toJson(): Record<string, any> {
        const stringQuality = VIDEO_QUALITY_ENUM_MAP[this.videoQuality] ?? 'unknown';

        return {
            videoId: this.videoId,
            tag: this.tag,
            url: this.url.toString(),
            container: this.container.toJson(),
            size: this.size.toJson(),
            bitrate: this.bitrate.toJson(),
            videoCodec: this.videoCodec,
            qualityLabel: this.qualityLabel,
            videoQuality: stringQuality, // Converts numeric Enum into the required generator-safe string key
            videoResolution: this.videoResolution.toJson(),
            framerate: this.framerate.toJson(),
            fragments: this.fragments.map(f => f.toJson()),
            codec: this.codec.toString(),
        };
    }

    // ============================================================================
    // Identity & Diagnostics
    // ============================================================================

    /** Custom string logging layout matching the original package layout specification. */
    public toString(): string {
        return `Video-only (${this.tag} | ${this.videoResolution}p${this.framerate.framesPerSecond} | ${this.container})`;
    }
}