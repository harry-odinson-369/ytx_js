import { AudioStreamInfo, AudioTrack } from "./audio";
import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { HlsStreamInfo } from "./hls_stream_info";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";
import { StreamInfo } from "./stream_info";

export class HlsAudioStreamInfo extends StreamInfo implements AudioStreamInfo, HlsStreamInfo {
    public videoId: string;
    public tag: number;
    public url: URL;
    public container: StreamContainer;
    public size: FileSize;
    public bitrate: Bitrate;
    public fragments: readonly Fragment[];
    public codec: MediaType;
    public qualityLabel: string;
    audioCodec: string;
    audioTrack?: AudioTrack | undefined;

    public get runtimeType(): string {
        return this.constructor.name;
    }

    constructor(
        videoId: string,
        tag: number,
        url: URL,
        container: StreamContainer,
        size: FileSize,
        bitrate: Bitrate,
        audioCodec: string,
        qualityLabel: string,
        codec: MediaType,
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
        this.qualityLabel = qualityLabel;
        this.audioCodec = audioCodec;
    }

    public fromJson(json: Record<any, any>): HlsAudioStreamInfo {
        return new HlsAudioStreamInfo(
            json['videoId'],
            json['tag'],
            new URL(json['url']),
            StreamContainer.fromJson(json['container']),
            FileSize.fromJson(json['size']),
            Bitrate.fromJson(json['bitrate']),
            json['audioCodec'],
            json['qualityLabel'],
            MediaType.parse(json['codec']),
        );
    }

    public toJson(): Record<string, any> {
        return {
            videoId: this.videoId,
            tag: this.tag,
            url: this.url,
            container: this.container,
            size: this.size,
            bitrate: this.bitrate,
            audioCodec: this.audioCodec,
            qualityLabel: this.qualityLabel,
            codec: this.codec,
        };
    }
}