import { Bitrate } from "./bitrate";
import { FileSize } from "./filesize";
import { Fragment } from "./fragment";
import { MediaType } from "./media_type";
import { StreamContainer } from "./stream_container";

/**
 * Mixin StreamInfo
 */
export abstract class StreamInfo {

    public get runtimeType(): string {
        return this.constructor.name;
    }

    /** The video id of the video this stream belongs to. */
    public abstract readonly videoId: string;

    /** Stream tag. Uniquely identifies a stream inside a manifest. */
    public abstract readonly tag: number;

    /** Stream URL. */
    public abstract readonly url: URL; // Dart's Uri maps to JavaScript's global URL class

    /** Stream container. */
    public abstract readonly container: StreamContainer;

    /** Stream size. */
    public abstract readonly size: FileSize;

    /** Stream bitrate. */
    public abstract readonly bitrate: Bitrate;

    /** DASH/HLS streams contain multiple stream fragments. */
    public abstract readonly fragments: readonly Fragment[];

    /** Streams codec. */
    public abstract readonly codec: MediaType;

    /** Stream quality label. */
    public abstract readonly qualityLabel: string;

    /** Convert to a json-serialized type. */
    public abstract toJson(): Record<string, any>;

    public get isThrottled(): boolean {
        const rateBypass = this.url.searchParams.get('ratebypass');
        return rateBypass?.toLowerCase() !== 'yes';
    }
}