import { AudioStreamInfo, AudioTrack } from "./audio";
import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { Framerate } from "./framerate";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";
import { VideoQuality, VideoResolution, VideoStreamInfo } from "./video";

/**
 * YouTube media stream that contains both audio and video natively interleaved together.
 */
export class MuxedStreamInfo extends StreamInfo implements AudioStreamInfo, VideoStreamInfo {
    public readonly videoId: string;
    public readonly tag: number;
    public readonly url: URL;
    public readonly container: StreamContainer;
    public readonly size: FileSize;
    public readonly bitrate: Bitrate;
    public readonly audioCodec: string;
    public readonly videoCodec: string;
    public readonly qualityLabel: string;
    public readonly videoQuality: VideoQuality;
    public readonly videoResolution: VideoResolution;
    public readonly framerate: Framerate;
    public readonly codec: MediaType;

    constructor(
        videoId: string,
        tag: number,
        url: URL,
        container: StreamContainer,
        size: FileSize,
        bitrate: Bitrate,
        audioCodec: string,
        videoCodec: string,
        qualityLabel: string,
        videoQuality: VideoQuality,
        videoResolution: VideoResolution,
        framerate: Framerate,
        codec: MediaType
    ) {
        super(); // Injects shared getters like `isThrottled` and `runtimeType`
        this.videoId = videoId;
        this.tag = tag;
        this.url = url;
        this.container = container;
        this.size = size;
        this.bitrate = bitrate;
        this.audioCodec = audioCodec;
        this.videoCodec = videoCodec;
        this.qualityLabel = qualityLabel;
        this.videoQuality = videoQuality;
        this.videoResolution = videoResolution;
        this.framerate = framerate;
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

    /** Muxed streams never have segmented manifest initialization fragments. */
    public get fragments(): readonly Fragment[] {
        return Object.freeze([]);
    }

    /** Muxed streams do not provide distinct tracking info about languages. */
    public get audioTrack(): AudioTrack | undefined {
        return undefined;
    }

    // ============================================================================
    // Serialization & Diagnostics
    // ============================================================================

    /**
     * Instantiates a MuxedStreamInfo instance out of a raw JSON mapping pool.
     */
    public static fromJson(json: Record<string, any>): MuxedStreamInfo {
        return new MuxedStreamInfo(
            json['videoId'],
            json['tag'],
            new URL(json['url']),
            StreamContainer.fromJson(json['container']),
            FileSize.fromJson(json['size']),
            Bitrate.fromJson(json['bitrate']),
            json['audioCodec'],
            json['videoCodec'],
            json['qualityLabel'],
            json['videoQuality'] as VideoQuality,
            VideoResolution.fromJson(json['videoResolution']),
            Framerate.fromJson(json['framerate']),
            MediaType.parse(json['codec'])
        );
    }

    /**
     * Serializes the concrete instance properties down into a flat string-keyed object dictionary.
     */
    public toJson(): Record<string, any> {
        return {
            videoId: this.videoId,
            tag: this.tag,
            url: this.url.toString(),
            container: this.container.toJson(),
            size: this.size.toJson(),
            bitrate: this.bitrate.toJson(),
            audioCodec: this.audioCodec,
            videoCodec: this.videoCodec,
            qualityLabel: this.qualityLabel,
            videoQuality: this.videoQuality,
            videoResolution: this.videoResolution.toJson(),
            framerate: this.framerate.toJson(),
            codec: this.codec.toString(), // Respects original custom JSON converters
        };
    }

    /** Custom output display formatter matching Dart string logging layout rules. */
    public toString(): string {
        return `Muxed (${this.tag} | ${this.videoResolution}p${this.framerate.framesPerSecond} | ${this.container})`;
    }
}