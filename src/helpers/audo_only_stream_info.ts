import { AudioStreamInfo, AudioTrack } from "./audio";
import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";

export class AudioOnlyStreamInfo extends StreamInfo implements AudioStreamInfo {
    public readonly videoId: string;
    public readonly tag: number;
    public readonly url: URL;
    public readonly container: StreamContainer;
    public readonly size: FileSize;
    public readonly bitrate: Bitrate;
    public readonly audioCodec: string;
    public readonly qualityLabel: string;
    public readonly fragments: readonly Fragment[];
    public readonly codec: MediaType;
    public readonly audioTrack?: AudioTrack;

    constructor(
        videoId: string,
        tag: number,
        url: URL,
        container: StreamContainer,
        size: FileSize,
        bitrate: Bitrate,
        audioCodec: string,
        qualityLabel: string,
        fragments: Fragment[],
        codec: MediaType,
        audioTrack?: AudioTrack,
    ) {
        super(); // Inherits runtimeType and isThrottled getters
        this.videoId = videoId;
        this.tag = tag;
        this.url = url;
        this.container = container;
        this.size = size;
        this.bitrate = bitrate;
        this.audioCodec = audioCodec;
        this.qualityLabel = qualityLabel;
        this.fragments = Object.freeze([...fragments]); // Preserves immutability
        this.codec = codec;
        this.audioTrack = audioTrack;
    }

    // ============================================================================
    // Serialization (Replicating the Generated JsonSerializable Logic)
    // ============================================================================

    /**
     * Instantiates an AudioOnlyStreamInfo from a raw JSON dictionary mapping.
     * Directly replicates: _$AudioOnlyStreamInfoFromJson
     */
    public static fromJson(json: Record<string, any>): AudioOnlyStreamInfo {
        const rawFragments = Array.isArray(json['fragments']) ? json['fragments'] : [];
        const parsedFragments = rawFragments.map((e: any) => Fragment.fromJson(e));

        const parsedAudioTrack = json['audioTrack']
            ? AudioTrack.fromJson(json['audioTrack'])
            : undefined;

        return new AudioOnlyStreamInfo(
            json['videoId'],
            Number(json['tag']),
            new URL(json['url']),
            StreamContainer.fromJson(json['container']),
            FileSize.fromJson(json['size']),
            Bitrate.fromJson(json['bitrate']),
            String(json['audioCodec']),
            String(json['qualityLabel']),
            parsedFragments,
            MediaType.parse(json['codec']),
            parsedAudioTrack
        );
    }

    /**
     * Serializes the instance properties back down into a flat JSON-safe dictionary.
     * Directly replicates: _$AudioOnlyStreamInfoToJson
     */
    public toJson(): Record<string, any> {
        return {
            videoId: this.videoId, // Invokes nested class serialization
            tag: this.tag,
            url: this.url.toString(),
            container: this.container.toJson(),
            size: this.size.toJson(),
            bitrate: this.bitrate.toJson(),
            audioCodec: this.audioCodec,
            codec: this.codec.toString(), // Runs custom converter payload
            fragments: this.fragments.map(f => f.toJson()),
            qualityLabel: this.qualityLabel,
            audioTrack: this.audioTrack ? this.audioTrack.toJson() : undefined,
        };
    }

    // ============================================================================
    // Identity & Diagnostics
    // ============================================================================

    /** Custom string logging layout matcher. */
    public toString(): string {
        const trackName = this.audioTrack ? this.audioTrack.displayName : 'null';
        return `Audio-only (${this.tag} | ${this.container} | ${trackName})`;
    }
}