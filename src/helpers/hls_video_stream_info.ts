import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { Framerate } from "./framerate";
import { HlsStreamInfo } from "./hls_stream_info";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";
import { VideoQuality, VideoResolution, VideoStreamInfo } from "./video";

export class HlsVideoStreamInfo extends StreamInfo implements VideoStreamInfo, HlsStreamInfo {
    public videoId: string;
    public tag: number;
    public url: URL;
    public container: StreamContainer;
    public size: FileSize;
    public bitrate: Bitrate;
    public fragments: readonly Fragment[];
    public codec: MediaType;
    public qualityLabel: string;
    videoCodec: string;
    videoQuality: VideoQuality;
    videoResolution: VideoResolution;
    framerate: Framerate;
    audioItag?: number | undefined;

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
        codec: MediaType,
        audioItag?: number,
    ) {
        super();
        this.videoId = videoId;
        this.tag = tag;
        this.url = url;
        this.container = container;
        this.size = size;
        this.bitrate = bitrate;
        this.fragments = [];
        this.codec = codec;
        this.videoCodec = videoCodec;
        this.qualityLabel = qualityLabel;
        this.videoQuality = videoQuality;
        this.videoResolution = videoResolution;
        this.framerate = framerate;
        this.audioItag = audioItag;
    }

    /**
     * Hydrates a valid concrete runtime [HlsVideoStreamInfo] instance from a serialized object literal map.
     */
    public static fromJson(json: Record<string, any>): HlsVideoStreamInfo {
        return new HlsVideoStreamInfo(
            json.videoId,
            Number(json.tag),
            new URL(json.url),
            StreamContainer.fromJson(json.container),
            FileSize.fromJson(json.size),
            Bitrate.fromJson(json.bitrate),
            json.videoCodec,
            json.qualityLabel,
            json.videoQuality as VideoQuality,
            VideoResolution.fromJson(json.videoResolution),
            Framerate.fromJson(json.framerate),
            MediaType.parse(json.codec),
            json.audioItag !== undefined ? Number(json.audioItag) : undefined
        );
    }

    /**
     * Serializes class configurations out to a clean transferable object map structure.
     */
    public toJson(): Record<string, any> {
        return {
            videoId: this.videoId,
            tag: this.tag,
            url: this.url.toString(), // Converts standard URL instance wrapper down to safe string
            container: typeof this.container.toJson === "function" ? this.container.toJson() : this.container,
            size: typeof this.size.toJson === "function" ? this.size.toJson() : this.size,
            bitrate: typeof this.bitrate.toJson === "function" ? this.bitrate.toJson() : this.bitrate,
            qualityLabel: this.qualityLabel,
            videoCodec: this.videoCodec,
            videoQuality: this.videoQuality,
            videoResolution: typeof this.videoResolution.toJson === "function" ? this.videoResolution.toJson() : this.videoResolution,
            framerate: this.framerate.toJson(),
            codec: this.codec.toString(),
            audioItag: this.audioItag
        };
    }

}