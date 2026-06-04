import { Bitrate } from "./bitrate";
import { MediaType } from "./media_type";
import { BaseStreamInfoProvider, StreamSource } from "./stream_info_provider";

export class HlsStreamInfoProvider extends BaseStreamInfoProvider {
    public get source(): StreamSource {
        return StreamSource.Hls;
    }
    public get tag(): number {
        return this._tag;
    }
    public get url(): string {
        return this._url;
    }
    public get codec(): MediaType {
        return this._codec;
    }
    public get container(): string | undefined {
        return "m3u8";
    }
    public get qualityLabel(): string | undefined {
        return this._qualityLabel;
    }
    public get videoWidth(): number | undefined {
        return this._videoWidth;
    }
    public get videoHeight(): number | undefined {
        return this.videoHeight;
    }
    public get audioCodec(): string | undefined {
        return this._audioCodec;
    }
    public get videoCodec(): string | undefined {
        return this._videoCodec;
    }

    _codec: MediaType;

    constructor(
        public _tag: number,
        public _url: string,
        public _audioCodec?: string,
        public _videoCodec?: string,
        public _videoWidth?: number,
        public _videoHeight?: number,
        public _framerate?: number,
        public _qualityLabel?: string,
        public _contentLength?: number,
        public _bitrate?: Bitrate,
        public _audioOnly?: boolean,
        public _videoOnly?: boolean,
        public _audioTag?: number,
    ) {
        super();
        const codecs: string[] = [];
        if (this._audioCodec) codecs.push(this._audioCodec);
        if (this._videoCodec) codecs.push(this._videoCodec);
        this._codec = new MediaType('application', 'vnd.apple.mpegurl', {
            "codecs": codecs.join(","),
        });
    }
}