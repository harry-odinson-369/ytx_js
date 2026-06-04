import BaseHttpClient from "../clients/base";
import { retry } from "../utils/utils";
import { Bitrate } from "./bitrate";
import { HlsStreamInfoProvider } from "./hls_stream_info_provider";
import { BaseStreamInfoProvider } from "./stream_info_provider";

export type VideoInfo = { url: string; params: Record<string, string> };
export type SegmentInfo = { url: string; duration: number };

export class HlsManifest {
    public readonly videos: readonly VideoInfo[];

    constructor(videos: VideoInfo[]) {
        this.videos = videos;
    }

    private _streams: BaseStreamInfoProvider[] = [];

    public static async request(httpClient: BaseHttpClient, url: string): Promise<HlsManifest | undefined> {
        return retry(httpClient, async () => {
            const resp = await httpClient.get(url);
            let str: string | undefined = undefined;
            if (resp.data) {
                if (typeof resp.data === "string") {
                    str = resp.data;
                } else {
                    str = JSON.stringify(resp.data);
                }
            }
            if (str) return HlsManifest.parse(str);
        });
    }

    /**
     * [hlsFile] is the content of the HLS file with lines separated by '\n'
     */
    public static parse(hlsFile: string): HlsManifest {
        const lines = hlsFile.trim().split('\n');
        if (lines[0] !== '#EXTM3U') {
            throw new Error('Assertion failed: Valid manifest must start with #EXTM3U');
        }

        let idx = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].startsWith('#EXT-X-INDEPENDENT-SEGMENTS')) {
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            throw new Error('Could not find #EXT-X-INDEPENDENT-SEGMENTS section');
        }

        const videos: VideoInfo[] = [];
        const expr = /([^,=\s]+)=("([^"]*)"|[^,]*)/g;

        for (let i = idx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const colonIndex = line.indexOf(':');
            const searchTarget = colonIndex !== -1 ? line.substring(colonIndex + 1) : line;

            const params: Record<string, string> = {};
            let match: RegExpExecArray | null;

            // Reset regex index state
            expr.lastIndex = 0;
            while ((match = expr.exec(searchTarget)) !== null) {
                params[match[1]] = match[2];
            }

            if (line.startsWith('#EXT-X-MEDIA:')) {
                const url = params['URI'];
                if (url) {
                    videos.push({ url: url.substring(1, url.length - 1), params });
                }
                continue;
            }

            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const url = lines[i + 1]?.trim();
                if (url) {
                    videos.push({ url, params });
                }
                i++;
                continue;
            }

            console.warn(`[YoutubeExplode.HLSManifest] Unknown HLS line: ${line}`);
        }

        return new HlsManifest(videos);
    }
    
    public get streams(): BaseStreamInfoProvider[] {
        if (this._streams.length <= 0) {
            this._streams = this._getstreams();
        }
        return this._streams;
    }

    private _getstreams(): BaseStreamInfoProvider[] {
        const localStreams: BaseStreamInfoProvider[] = [];

        for (const video of this.videos) {
            const type = video.params['TYPE'];
            if (type !== undefined && type !== 'AUDIO') {
                // TODO: type 'SUBTITLES' not supported.
                continue;
            }

            const videoParts = video.url.split('/');
            const itagIndex = videoParts.indexOf('itag');
            if (itagIndex === -1) continue;

            const itag = parseInt(videoParts[itagIndex + 1], 10);

            const parsedBandwidth = parseInt(video.params['BANDWIDTH'] ?? '', 10);
            let bandwidth = isNaN(parsedBandwidth) ? undefined : parsedBandwidth;

            const codecsRaw = video.params['CODECS']?.replace(/"/g, '');
            const codecs = codecsRaw ? codecsRaw.split(',') : undefined;
            const audioCodec = codecs?.[0];
            const videoCodec = codecs?.[codecs.length - 1];

            const resolution = video.params['RESOLUTION']?.split('x');
            const videoWidth = resolution ? parseInt(resolution[0], 10) : undefined;
            const videoHeight = resolution ? parseInt(resolution[1], 10) : undefined;
            const framerate = parseInt(video.params['FRAME-RATE'] ?? '', 10);

            const rawAudioAttr = video.params['AUDIO'];
            const audioItag = rawAudioAttr ? parseInt(this._trimQuotes(rawAudioAttr), 10) : undefined;

            let sgoap: string | undefined;
            let sgovp: string | undefined;
            const sgoapIndex = videoParts.indexOf('sgoap');
            const sgovpIndex = videoParts.indexOf('sgovp');

            if (sgoapIndex !== -1) {
                sgoap = decodeURIComponent(videoParts[sgoapIndex + 1]);
            }
            if (sgovpIndex !== -1) {
                sgovp = decodeURIComponent(videoParts[sgovpIndex + 1]);
            }

            let audioClen: number | undefined;
            let videoClen: number | undefined;

            if (sgoap !== undefined) {
                const clenMatch = /clen=(\d+)/.exec(sgoap);
                if (clenMatch) {
                    audioClen = parseInt(clenMatch[1], 10);
                }
                if (bandwidth === undefined && audioClen !== undefined) {
                    const durMatch = /dur=(\d+\.\d+)/.exec(sgoap);
                    if (durMatch) {
                        const dur = parseFloat(durMatch[1]);
                        bandwidth = Math.round(audioClen / dur) * 8;
                    }
                }
            }

            if (sgovp !== undefined) {
                const clenMatch = /clen=(\d+)/.exec(sgovp);
                if (clenMatch) {
                    videoClen = parseInt(clenMatch[1], 10);
                }
            }

            localStreams.push(
                new HlsStreamInfoProvider(
                    itag,
                    video.url,
                    audioCodec,
                    videoCodec,
                    videoWidth,
                    videoHeight,
                    framerate,
                    resolution ? `${videoWidth}x${videoHeight}` : undefined,
                    (audioClen ?? 0) + (videoClen ?? 0),
                    new Bitrate(bandwidth ?? 0),
                    !videoClen,
                    !audioClen,
                    audioItag,
                )
            );
        }
        return localStreams;
    }

    public static parseVideoSegments(hlsFile: string): readonly SegmentInfo[] {
        const lines = hlsFile.trim().split('\n');
        if (lines[0] !== '#EXTM3U') {
            throw new Error('Assertion failed: Valid manifest must start with #EXTM3U');
        }
        if (!lines[1]?.startsWith('#EXT-X-VERSION:')) {
            throw new Error('Assertion failed: Missing EXT-X-VERSION descriptor block');
        }

        const extXVersion = parseInt(lines[1].substring('#EXT-X-VERSION:'.length), 10);
        if (extXVersion !== 3 && extXVersion !== 6) {
            throw new Error(`Unsupported HLS version: ${extXVersion}`);
        }
        if (lines[2] !== '#EXT-X-PLAYLIST-TYPE:VOD') {
            throw new Error('Assertion failed: Target format validation expected VOD context signature');
        }

        const segments: SegmentInfo[] = [];
        for (let i = 3; i < lines.length; i++) {
            if (lines[i] === '#EXT-X-ENDLIST') {
                break;
            }
            if (lines[i].startsWith('#EXT-X-MAP') || lines[i].startsWith('#EXT-X-TARGETDURATION')) {
                continue;
            }

            const duration = parseFloat(lines[i].substring('#EXTINF:'.length, lines[i].length - 1));
            const url = lines[i + 1];
            if (url) {
                segments.push({ url, duration });
            }
            i++;
        }
        return segments;
    }

    private _trimQuotes(val: string): string {
        return val.substring(1, val.length - 1);
    }
}