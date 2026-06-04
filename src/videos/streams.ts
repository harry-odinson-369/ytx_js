import BaseHttpClient from "../clients/base";
import { BaseJSChallengeSolver, JSChallengeType } from "../challenges/base";
import { LinkedHashSet } from "../utils/array";
import YoutubeAPIClient from "../utils/clients";
import { asyncgeneratortoarray, retry } from "../utils/utils";
import PageAPI from "./page";
import { setQueryParam } from "../utils/url";
import { getcontentlength } from "../utils/http";
import { StreamController } from "../controllers/stream_controller";
import { StreamManifest } from "../helpers/stream_manifest";
import { StreamInfo } from "../helpers/stream_info";
import { isAudioStreamInfo } from "../helpers/audio";
import { BaseStreamInfoProvider, StreamSource } from "../helpers/stream_info_provider";
import { StreamContainer } from "../helpers/stream_container";
import { FileSize } from "../helpers/filesize";
import { Bitrate } from "../helpers/bitrate";
import { HlsAudioStreamInfo } from "../helpers/hls_audio_stream_info";
import { Framerate } from "../helpers/framerate";
import { VideoResolution, VideoQualityUtil } from "../helpers/video";
import { HlsVideoStreamInfo } from "../helpers/hls_video_stream_info";
import { HlsMuxedStreamInfo } from "../helpers/hls_muxed_stream_info";
import { MuxedStreamInfo } from "../helpers/muxed_video_stream_info";
import { VideoOnlyStreamInfo } from "../helpers/video_only_stream_info";
import { AudioOnlyStreamInfo } from "../helpers/audo_only_stream_info";

export default class StreamsAPI {
    private _controller: StreamController;
    private _jschallengsolver?: BaseJSChallengeSolver;
    constructor(
        public videoId: string,
        public client: BaseHttpClient,
        public page?: PageAPI,
        public jssolver?: BaseJSChallengeSolver,
    ) {
        this._controller = new StreamController(client);
        this._jschallengsolver = jssolver;
    }

    async request(params?: { ytclients?: YoutubeAPIClient[] }): Promise<StreamManifest | undefined> {
        let clients = params?.ytclients ?? [YoutubeAPIClient.AndroidSdkless];
        if (this.jssolver && !params?.ytclients) {
            clients.push(YoutubeAPIClient.Safari);
        }

        const uniquestreams = new LinkedHashSet<StreamInfo>({
            equals: (a, b) => {
                if (a.runtimeType !== b.runtimeType) return false;
                if (isAudioStreamInfo(a) && isAudioStreamInfo(b)) {
                    return a.tag === b.tag && (a.audioTrack?.equals(b)) === true;
                }
                return a.tag === b.tag;
            },
            hashCode: (e) => {
                if (isAudioStreamInfo(e)) {
                    const trackHash = e.audioTrack?.hashCode ?? 'null';
                    return `${e.runtimeType}:${e.tag}:${trackHash}`;
                }
                return `${e.runtimeType}:${e.tag}`;
            }
        });

        let lastexception: any = undefined;

        for (const client of clients) {
            try {
                await retry(this.client, async () => {
                    const streams = await asyncgeneratortoarray(this._getstreams(client));
                    if (!streams.length) {
                        throw `Video "${this.videoId}" does not contain any playable streams.`
                    }
                    const response = await this.client.head(streams[0].url.toString());
                    if (response.status == 403) {
                        throw `Video $videoId returned 403 (stream: ${streams[0].tag})`;
                    }
                    uniquestreams.addAll(streams);
                });
            } catch (e) {
                lastexception = e;
            }
        }

        if (uniquestreams.size <= 0 && !params?.ytclients) {
            return this.request({ ytclients: [YoutubeAPIClient.TV] });
        }

        if (uniquestreams.size <= 0) {
            throw lastexception;
        }

        return new StreamManifest(uniquestreams);
    }

    private async *_getstreams(client: YoutubeAPIClient): AsyncGenerator<StreamInfo, void, unknown> {
        const playerresponse = await this._controller.getPlayerResponse(this.videoId, client, this.page);
        if (playerresponse.videoabilityerrorreason?.includes("payment") === true) {
            throw "Video required purchase: " + playerresponse.playabilitystatus;
        }
        if (!playerresponse.isvideoplayable) {
            throw "Video unplayable: " + playerresponse.playabilitystatus;
        }
        yield* this._parsestreaminfo(playerresponse.streams);

        if (playerresponse.dashmanifesturl) {
            const dash = await this._controller.getDashManifest(playerresponse.dashmanifesturl);
            if (dash && dash.streams.length > 0) {
                yield* this._parsestreaminfo(dash.streams);
            }
        }
        if (playerresponse.hlsmanifesturl) {
            const hls = await this._controller.getHlsManifest(playerresponse.hlsmanifesturl);
            if (hls && hls.streams.length > 0) {
                yield* this._parsestreaminfo(hls.streams);
            }
        }
    }

    private async * _parsestreaminfo(streams: BaseStreamInfoProvider[]): AsyncGenerator<StreamInfo, void, unknown> {
        const nchallenges = new Set<string>();
        const sigchallenges = new Set<string>();

        const solver = this._jschallengsolver;

        if (solver) {
            for (const stream of streams) {
                try {
                    const url = new URL(stream.url);
                    if (url.searchParams.has("n")) {
                        nchallenges.add(url.searchParams.get("n")!);
                    }
                    if (stream.signatureParameter) {
                        if (stream.signature) sigchallenges.add(stream.signature);
                    }
                } catch { }
            }
        }

        let solvedchallenges: Record<string, string | undefined> = {};

        if (this.page && solver && (nchallenges.size > 0 || sigchallenges.size > 0)) {
            const requests: Record<JSChallengeType, string[]> = {
                [JSChallengeType.N]: [],
                [JSChallengeType.Sig]: []
            };
            if (nchallenges.size > 0) {
                requests[JSChallengeType.N] = Array.from(nchallenges);
            }
            if (sigchallenges.size > 0) {
                requests[JSChallengeType.Sig] = Array.from(sigchallenges);
            }

            try {
                if (this.page.sourceurl) {
                    const results = await solver.solveBulk(this.page.sourceurl, requests);
                    Object.assign(solvedchallenges, results);
                }
            } catch (e) {
                console.warn(`Could not bulk solve challenges: ${e}`);
            }
        }

        for (const stream of streams) {
            const itag = stream.tag;
            let url: URL;
            try {
                url = new URL(stream.url);
            } catch {
                continue;
            }

            if (solver && this.page) {

                if (url.searchParams.has("n")) {
                    const nparam = url.searchParams.get("n")!;
                    const decoded = solvedchallenges[nparam];
                    if (decoded) {
                        url = setQueryParam(url, 'n', decoded);
                    } else {
                        try {
                            if (this.page.sourceurl) {
                                const individualdecoded = await solver.solve(this.page.sourceurl, JSChallengeType.N, nparam);
                                url = setQueryParam(url, 'n', individualdecoded);
                            }
                        } catch { }
                    }
                }

                if (stream.signatureParameter && stream.signature) {
                    const sigparam = stream.signatureParameter;
                    const sig = stream.signature;
                    const decoded = solvedchallenges[sig];
                    if (decoded) {
                        url = setQueryParam(url, sigparam, decoded);
                    } else {
                        try {
                            if (this.page.sourceurl) {
                                const individualdecoded = await solver.solve(this.page.sourceurl, JSChallengeType.Sig, sig);
                                url = setQueryParam(url, sigparam, individualdecoded);
                            }
                        } catch { }
                    }
                }
            }

            let contentlength: number = (stream.contentLength ?? ((await getcontentlength(this.client, url.toString())) ?? 0));

            if (contentlength <= 0) continue;

            const container = StreamContainer.parse(stream.container);
            const filesize = new FileSize(contentlength);
            const bitrate = new Bitrate(stream.bitrate ?? 0);
            const audioCodec = stream.audioCodec;
            const videoCodec = stream.videoCodec;
            const framerate = new Framerate(stream.framerate ?? 24);
            const videoQuality = VideoQualityUtil.fromLabel(stream.qualityLabel);
            const videoWidth = stream.videoWidth;
            const videoHeight = stream.videoHeight;
            const videoResolution = videoWidth != null && videoHeight != null ? new VideoResolution(videoWidth, videoHeight) : VideoQualityUtil.toVideoResolution(videoQuality);

            if (stream.source === StreamSource.Hls) {
                if (stream.audioOnly) {
                    yield new HlsAudioStreamInfo(
                        this.videoId,
                        itag,
                        url,
                        container,
                        filesize,
                        bitrate,
                        '',
                        '',
                        stream.codec,
                    );
                    continue;
                }

                if (stream.videoOnly) {
                    yield new HlsVideoStreamInfo(
                        this.videoId,
                        itag,
                        url,
                        container,
                        filesize,
                        bitrate,
                        videoCodec ?? "",
                        VideoQualityUtil.getQualityString(videoQuality),
                        videoQuality,
                        videoResolution,
                        framerate,
                        stream.codec,
                        stream.audioItag,
                    );
                } else {
                    yield new HlsMuxedStreamInfo(
                        this.videoId,
                        itag,
                        url,
                        container,
                        filesize,
                        bitrate,
                        videoCodec ?? "",
                        audioCodec ?? "",
                        VideoQualityUtil.getLabel(videoQuality),
                        videoQuality,
                        videoResolution,
                        framerate,
                        stream.codec,
                        stream.audioItag,
                    );
                }
                continue;
            }

            if (videoCodec) {
                if (audioCodec && stream.source !== StreamSource.Adaptive) {
                    if (!stream.audioTrack) {
                        yield new MuxedStreamInfo(
                            this.videoId,
                            itag,
                            url,
                            container,
                            filesize,
                            bitrate,
                            audioCodec,
                            videoCodec,
                            VideoQualityUtil.getLabel(videoQuality),
                            videoQuality,
                            videoResolution,
                            framerate,
                            stream.codec,
                        );
                        continue;
                    }
                }
                yield new VideoOnlyStreamInfo(
                    this.videoId,
                    itag,
                    url,
                    container,
                    filesize,
                    bitrate,
                    videoCodec,
                    VideoQualityUtil.getLabel(videoQuality),
                    videoQuality,
                    videoResolution,
                    framerate,
                    [...(stream.fragments ?? [])],
                    stream.codec,
                );
                continue;
            } else if (audioCodec) {
                yield new AudioOnlyStreamInfo(
                    this.videoId,
                    itag,
                    url,
                    container,
                    filesize,
                    bitrate,
                    audioCodec,
                    VideoQualityUtil.getLabel(videoQuality),
                    [...(stream.fragments ?? [])],
                    stream.codec,
                );
            } else {
                throw "Could not extract stream codec!";
            }
        }
    }
}