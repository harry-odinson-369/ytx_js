import { StreamInfo } from "./stream_info";

/**
 * YouTube media stream representing an HTTP Live Streaming (HLS) protocol stream.
 * Mixin constraint: Must be paired with implementations of StreamInfo.
 */
export interface HlsStreamInfo extends StreamInfo {
    /**
     * The tag of the audio stream related to this stream.
     */
    readonly audioItag?: number;
}