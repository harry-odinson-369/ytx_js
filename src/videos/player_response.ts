import { BaseStreamInfoProvider, StreamInfoProvider, StreamSource } from "../helpers/stream_info_provider";
import { splitQueryString } from "../utils/url";
import { getjson } from "../utils/utils";

export function pipe<T, R>(value: T, f: (val: T) => R): R {
    return f(value);
}

export class PlayerResponse {
    constructor(public root: Record<string, any>) { }

    static parse = (raw: string) => new PlayerResponse(JSON.parse(raw));

    get previewvideoid(): string | undefined {
        const a = getjson<string>(this.root, 'playabilityStatus/errorScreen/playerLegacyDesktopYpcTrailerRenderer/trailerVideoId')
        const b = splitQueryString(getjson<string>(this.root, 'playabilityStatus/errorScreen/ypcTrailerRenderer/playerVars') ?? '')?.video_id;
        const c = getjson<string>(this.root, 'playabilityStatus/errorScreen/ypcTrailerRenderer/playerResponse')?.replace(/-/gi, '+')?.replace(/_/gi, '/');
        const final = (a ?? b ?? pipe(
            pipe(
                pipe(
                    c,
                    (va) => {
                        if (!va) return undefined;
                        return Buffer.from(va, 'base64');
                    }),
                (buff) => new TextDecoder('utf-8', { fatal: false }).decode(buff)),
            (val) => {
                const matchs = val.match(/video_id=(.{11})/g);
                if (matchs && matchs[1]) return matchs[1];
                return undefined;
            }));
        return final;
    }

    get playabilitystatus(): string { return getjson<string>(this.root, 'playabilityStatus/status') ?? "" }

    get isvideoavailable(): boolean { return this.playabilitystatus?.toLowerCase() !== "error" }

    get isvideoplayable(): boolean { return this.playabilitystatus?.toLowerCase() === "ok" }

    get islive(): boolean { return getjson<boolean>(this.root, 'videoDetails/isLive') ?? false }

    get videotitle(): string {
        return getjson<string>(this.root, 'videoDetails/title') ?? '';
    }

    get videoauthor(): string {
        return getjson<string>(this.root, 'videoDetails/author') ?? '';
    }

    get videouploaddate(): string {
        return getjson<string>(this.root, 'microformat/playerMicroformatRenderer/uploadDate') ?? '';
    }

    get videopublishdate(): string {
        return getjson<string>(this.root, 'microformat/playerMicroformatRenderer/publishDate') ?? '';
    }

    get videochannelid(): string {
        return getjson<string>(this.root, 'videoDetails/channelId') ?? '';
    }

    get videokeywords(): string[] {
        return getjson<string[]>(this.root, 'videoDetails/keywords') ?? [];
    }

    get videodescription(): string {
        return getjson<string>(this.root, 'videoDetails/shortDescription') ?? '';
    }

    get videoduration(): number {
        return parseInt(getjson(this.root, 'videoDetails/lengthSeconds') ?? "0");
    }

    get videoviewcount(): number {
        return parseInt(getjson(this.root, 'videoDetails/viewCount') ?? "0");
    }

    get hlsmanifesturl() {
        return getjson<string>(this.root, 'streamingData/dashManifestUrl');
    }

    get dashmanifesturl() {
        return getjson<string>(this.root, 'streamingData/dashManifestUrl');
    }

    get muxedstreams(): BaseStreamInfoProvider[] | undefined {
        const arr = getjson<BaseStreamInfoProvider[]>(this.root, 'streamingData/formats');
        return arr?.map(e => new StreamInfoProvider(e, StreamSource.Muxed));
    }

    get adaptivestreams(): BaseStreamInfoProvider[] | undefined {
        const arr = getjson<BaseStreamInfoProvider[]>(this.root, 'streamingData/adaptiveFormats');
        return arr?.map(e => new StreamInfoProvider(e, StreamSource.Adaptive));
    }

    get streams(): BaseStreamInfoProvider[] { return [...(this.muxedstreams ?? []), ...(this.adaptivestreams ?? [])] }

    get closedcaptiontracks(): any[] {
        return (this.root.captions?.playerCaptionsTracklistRenderer?.captionTracks) ?? [];
    }

    get videoabilityerrorreason(): string | undefined {
        return getjson(this.root, 'playabilityStatus/reason');
    }
}