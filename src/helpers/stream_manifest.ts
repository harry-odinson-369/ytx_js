// ============================================================================
// StreamManifest Container Core
// ============================================================================
import { isAudioOnlyStream, isAudioStream, isHlsStream, isMuxedStream, isVideoOnlyStream, isVideoStream } from "../utils/utils";
import { AudioStreamInfo } from "./audio";
import { AudioOnlyStreamInfo } from "./audo_only_stream_info";
import { HlsStreamInfo } from "./hls_stream_info";
import { MuxedStreamInfo } from "./muxed_video_stream_info";
import { StreamInfo } from "./stream_info";
import { VideoStreamInfo } from "./video";
import { VideoOnlyStreamInfo } from "./video_only_stream_info";

/**
 * Manifest that contains deep grouping categorization layouts about 
 * available media streams extracted from a specific YouTube video context.
 */
export class StreamManifest {
    /** All available stream items wrapped within an immutable read-only view. */
    public readonly streams: ReadonlyArray<StreamInfo>;

    // Lazily populated properties replicating Dart's `late final` variables
    private _audio?: ReadonlyArray<AudioStreamInfo>;
    private _video?: ReadonlyArray<VideoStreamInfo>;
    private _muxed?: ReadonlyArray<MuxedStreamInfo>;
    private _audioOnly?: ReadonlyArray<AudioOnlyStreamInfo>;
    private _videoOnly?: ReadonlyArray<VideoOnlyStreamInfo>;
    private _hls?: ReadonlyArray<HlsStreamInfo>;

    constructor(streams: Iterable<StreamInfo>) {
        // Array.from creates a distinct array copy, and Object.freeze locks mutating actions
        this.streams = Object.freeze(Array.from(streams));
    }

    /**
     * Gets streams that contain audio (which includes muxed and audio-only streams).
     */
    public get audios(): ReadonlyArray<AudioStreamInfo> {
        if (!this._audio) {
            this._audio = Object.freeze(this.streams.filter(isAudioStream));
        }
        return this._audio ?? [];
    }

    /**
     * Gets streams that contain video (which includes muxed and video-only streams).
     */
    public get videos(): ReadonlyArray<VideoStreamInfo> {
        if (!this._video) {
            this._video = Object.freeze(this.streams.filter(isVideoStream));
        }
        return this._video ?? [];
    }

    /**
     * Gets muxed streams (contain both audio and video natively multiplexed).
     */
    public get muxed(): ReadonlyArray<MuxedStreamInfo> {
        if (!this._muxed) {
            this._muxed = Object.freeze(this.streams.filter(isMuxedStream));
        }
        return this._muxed ?? [];
    }

    /**
     * Gets audio-only streams (no video tracks).
     */
    public get audioOnly(): ReadonlyArray<AudioOnlyStreamInfo> {
        if (!this._audioOnly) {
            this._audioOnly = Object.freeze(this.streams.filter(isAudioOnlyStream));
        }
        return this._audioOnly ?? [];
    }

    /**
     * Gets video-only streams (no audio tracks).
     */
    public get videoOnly(): ReadonlyArray<VideoOnlyStreamInfo> {
        if (!this._videoOnly) {
            this._videoOnly = Object.freeze(this.streams.filter(isVideoOnlyStream));
        }
        return this._videoOnly ?? [];
    }

    /**
     * Gets HTTP Live Streaming (HLS) adaptive protocol manifest feeds.
     */
    public get hls(): ReadonlyArray<HlsStreamInfo> {
        if (!this._hls) {
            this._hls = Object.freeze(this.streams.filter(isHlsStream));
        }
        return this._hls ?? [];
    }

    /** Custom string representation summarizing stream metrics */
    public toString(): string {
        // Maps down to standard structural data string join summaries or descriptions
        return `StreamManifest(streamsCount: ${this.streams.length}, muxed: ${this.muxed.length}, audioOnly: ${this.audioOnly.length}, videoOnly: ${this.videoOnly.length})`;
    }
}