import { AudioStreamInfo, AudioTrack } from "./audio";
import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { Framerate } from "./framerate";
import { HlsStreamInfo } from "./hls_stream_info";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";
import { VideoQuality, VideoResolution, VideoStreamInfo } from "./video";

export class HlsMuxedStreamInfo extends StreamInfo implements AudioStreamInfo, VideoStreamInfo, HlsStreamInfo {
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
    audioCodec: string;
    audioTrack?: AudioTrack | undefined;
    audioItag?: number | undefined;

    constructor(
        videoId: string,
        tag: number,
        url: URL,
        container: StreamContainer,
        size: FileSize,
        bitrate: Bitrate,
        videoCodec: string,
        audioCodec: string,
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
        this.audioCodec = audioCodec;
        this.qualityLabel = qualityLabel;
        this.videoQuality = videoQuality;
        this.videoResolution = videoResolution;
        this.framerate = framerate;
        this.audioItag = audioItag;
    }

    public toJson(): Record<string, any> {
        throw new Error("Method not implemented.");
    }
}