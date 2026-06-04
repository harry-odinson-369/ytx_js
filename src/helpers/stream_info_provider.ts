import { splitQueryString } from "../utils/url";
import { getjson } from "../utils/utils";
import { AudioTrack } from "./audio";
import { Fragment } from "./fragment";
import { MediaType } from "./media_type";

/**
 * Supported underlying streaming playback distribution pipeline protocols.
 */
export enum StreamSource {
    Muxed = 'muxed',
    Adaptive = 'adaptive',
    Dash = 'dash',
    Hls = 'hls',
}

/**
 * Underlying semantic specifications provider contract wrapper 
 * for raw parsed streaming structural payload segments.
 */
export abstract class BaseStreamInfoProvider {
    /**
     * Static lookup utility for parsing raw context payload string allocations.
     */
    public static readonly contentLenExp = /clen=(\d+)/;

    /** Structural streaming protocol type source pipeline. */
    public abstract get source(): StreamSource;

    /** Unique streaming format tag ID identifier. */
    public abstract get tag(): number;

    /** Base raw network access string resource address mapping indicator locator. */
    public abstract get url(): string;

    /** Media Type container block description descriptor structure. */
    public abstract get codec(): MediaType;

    /** Unique asset signature block identifier string token if cipher protection applies. */
    public get signature(): string | undefined {
        return undefined;
    }

    /** Targeted query parameter key tracking location requirements for authorization keys. */
    public get signatureParameter(): string | undefined {
        return undefined;
    }

    /** Concrete payload package size calculated in total bytes. */
    public get contentLength(): number | undefined {
        return undefined;
    }

    /** Continuous network bit rate throughput processing allocation requirement context. */
    public get bitrate(): number | undefined {
        return undefined;
    }

    /** Common file container string identifier format label (e.g., "mp4", "webm"). */
    public abstract get container(): string | undefined;

    /** Audio tracking compression standard codec label if tracks remain active. */
    public get audioCodec(): string | undefined {
        return undefined;
    }

    /** Video structural resolution transformation codec sequence identifier track labels. */
    public get videoCodec(): string | undefined {
        return undefined;
    }

    /** Categorized video rendering definition specification string tag context. */
    public abstract get qualityLabel(): string | undefined;

    /** Total horizontal pixel calculation array frame measurement index boundaries. */
    public get videoWidth(): number | undefined {
        return undefined;
    }

    /** Total vertical pixel calculation index coordinate resolution bounds. */
    public get videoHeight(): number | undefined {
        return undefined;
    }

    /** Continuous video sequence frames rendered per individual second metric context. */
    public get framerate(): number | undefined {
        return undefined;
    }

    /** Initialization stream segment chunk allocations map descriptors array pools. */
    public get fragments(): readonly Fragment[] | undefined {
        return undefined;
    }

    /** Specialized alternative audio track sequence target configuration parameters metadata. */
    public get audioTrack(): AudioTrack | undefined {
        return undefined;
    }

    /** Evaluation checking if video structures are completely stripped out. */
    public get audioOnly(): boolean {
        return false;
    }

    /** Evaluation checking if audio tracking tracks are omitted from data processing maps. */
    public get videoOnly(): boolean {
        return false;
    }

    /** Sub-allocated HLS audio streaming identifier configuration parameters target keys. */
    public get audioItag(): number | undefined {
        return undefined;
    }
}

export class StreamInfoProvider extends BaseStreamInfoProvider {
    private static readonly _contentLenExp = /[\?&]clen=(\d+)/;

    public readonly root: Record<any, any>;

    // ─── Private Internal Backing Fields ───
    private readonly _source: StreamSource;
    private readonly _tag: number;
    private readonly _url: string;
    private readonly _codec: MediaType;
    private readonly _container: string | undefined;
    private readonly _qualityLabel: string | undefined;

    private readonly _bitrate: number | undefined;
    private readonly _contentLength: number | undefined;
    private readonly _framerate: number | undefined;
    private readonly _signature: string | undefined;
    private readonly _signatureParameter: string | undefined;
    private readonly _videoCodec: string | undefined;
    private readonly _videoHeight: number | undefined;
    private readonly _videoWidth: number | undefined;
    private readonly _audioTrack: AudioTrack | undefined;
    private readonly _audioCodec: string | undefined;

    public readonly isAudioOnly: boolean;
    private readonly codecs: string | undefined;

    constructor(root: Record<any, any>, source: StreamSource) {
        super();
        this.root = root;
        this._source = source;

        // 1. Core mime and specifications configuration
        const mime = this.root.mimeType;
        this._codec = mime ? MediaType.parse(mime) : new MediaType('application', 'octet-stream');
        this.isAudioOnly = this._codec.type === 'audio';
        this._container = this._codec.subtype ?? undefined;
        this.codecs = this._codec.parameters['codecs']?.toLowerCase() ?? undefined;

        // 2. Extracted basic properties
        this._bitrate = this.root.bitrate ?? undefined;
        this._framerate = this.root.fps ?? undefined;
        this._videoHeight = this.root.height ?? undefined;
        this._videoWidth = this.root.width ?? undefined;
        this._qualityLabel = this.root.qualityLabel ?? undefined;
        this._tag = this.root.itag ?? 0;

        // 3. Decipher complex cipher components
        const cipherText = this.root.cipher;
        const sigCipherText = this.root.signatureCipher;

        const parsedCipher = splitQueryString(cipherText);
        const parsedSigCipher = splitQueryString(sigCipherText);

        this._signature = parsedSigCipher?.s;
        this._signatureParameter = parsedCipher?.sp ?? parsedSigCipher?.sp;
        this._url = this.root.url ?? parsedCipher?.url ?? parsedSigCipher?.url ?? '';

        // 4. Content tracking size constraints 
        const contentLenStr = this.root.contentLength;
        const fallbackClenMatch = StreamInfoProvider._contentLenExp.exec(this._url);
        const rawLen = contentLenStr || (fallbackClenMatch ? fallbackClenMatch[1] : '');
        const parsedLen = parseInt(rawLen, 10);
        this._contentLength = isNaN(parsedLen) ? undefined : parsedLen;

        // 5. Codec conversions
        const codecsList = this.codecs ? this.codecs.split(',') : undefined;
        const rawVideoCodec = codecsList?.[0]?.trim() ?? undefined;

        this._videoCodec = this.isAudioOnly ? undefined : (rawVideoCodec && rawVideoCodec.replace(/\s/g, '') ? rawVideoCodec : undefined);
        this._audioCodec = this.isAudioOnly ? this.codecs : this._getAudioCodec(codecsList)?.trim() ?? undefined;

        this._audioTrack = (() => {
            if ('audioTrack' in this.root) {
                const name = getjson<string>(this.root, 'audioTrack/displayName');
                const id = getjson<string>(this.root, 'audioTrack/id');
                const isDefault = getjson<boolean>(this.root, 'audioTrack/audioIsDefault');

                if (name !== undefined && name !== null && id !== undefined && id !== null && isDefault !== undefined && isDefault !== null) {
                    return new AudioTrack({ displayName: name, id, audioIsDefault: isDefault });
                }
            }
            return undefined;
        })();
    }

    // 🔥 ALL IMPLEMENTATIONS EXPOSED VIA ACCESSORS
    public override get source(): StreamSource { return this._source; }
    public override get tag(): number { return this._tag; }
    public override get url(): string { return this._url; }
    public override get codec(): MediaType { return this._codec; }
    public override get container(): string | undefined { return this._container; }
    public override get qualityLabel(): string | undefined { return this._qualityLabel; }

    public override get bitrate(): number | undefined { return this._bitrate; }
    public override get contentLength(): number | undefined { return this._contentLength; }
    public override get framerate(): number | undefined { return this._framerate; }
    public override get signature(): string | undefined { return this._signature; }
    public override get signatureParameter(): string | undefined { return this._signatureParameter; }
    public override get videoCodec(): string | undefined { return this._videoCodec; }
    public override get videoHeight(): number | undefined { return this._videoHeight; }
    public override get videoWidth(): number | undefined { return this._videoWidth; }
    public override get audioTrack(): AudioTrack | undefined { return this._audioTrack; }
    public override get audioCodec(): string | undefined { return this._audioCodec; }

    // ─── Stateful Evaluator Flags ───
    public override get audioOnly(): boolean { return this.isAudioOnly; }
    public override get videoOnly(): boolean { return !this.isAudioOnly && this.audioCodec === undefined; }

    private _getAudioCodec(codecs: string[] | undefined): string | undefined {
        if (!codecs || codecs.length <= 1) return undefined;
        return codecs[codecs.length - 1];
    }
}