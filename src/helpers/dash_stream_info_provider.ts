import { Fragment } from "./fragment";
import { MediaType } from "./media_type";
import { BaseStreamInfoProvider, StreamSource } from "./stream_info_provider";

export class DashStreamInfoProvider extends BaseStreamInfoProvider {
    public get source(): StreamSource {
        return StreamSource.Dash;
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
        return undefined;
    }
    public get qualityLabel(): string | undefined {
        return 'DASH';
    }
    public get videoWidth(): number | undefined {
        return this._videoWidth;
    }
    public get videoHeight(): number | undefined {
        return this.videoHeight;
    }
    public get fragments(): Fragment[] | undefined {
        return this._fragments;
    }

    _tag: number;
    _url: string;
    _codec: MediaType;
    _videoWidth?: number;
    _videoHeight?: number;
    _framerate?: number;
    _fragments?: Fragment[];

    constructor(
        _tag: number,
        _url: string,
        _codec: MediaType,
        _videoWidth?: number,
        _videoHeight?: number,
        _framerate?: number,
        _fragments?: Fragment[],
    ) {
        super();
        this._tag = _tag;
        this._url = _url;
        this._codec = _codec;
        this._videoWidth = _videoWidth;
        this._videoHeight = _videoHeight;
        this._framerate = _framerate;
        this._fragments = _fragments;
    }
}