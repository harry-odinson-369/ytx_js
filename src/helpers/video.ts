import { Framerate } from "./framerate";
import { StreamInfo } from "./stream_info";

/**
 * YouTube media stream that contains video.
 * Mixin constraint: Must be paired with implementations of StreamInfo.
 */
export interface VideoStreamInfo extends StreamInfo {
    /** Video codec. */
    readonly videoCodec: string;

    /** Video quality. */
    readonly videoQuality: VideoQuality;

    /** Video resolution. */
    readonly videoResolution: VideoResolution;

    /** Video framerate. */
    readonly framerate: Framerate;
}

/**
 * Video quality representations matching YouTube streaming standards.
 */
export enum VideoQuality {
    Unknown,
    Low144,
    Low240,
    Medium360,
    Medium480,
    High720,
    High1080,
    High1440,
    High2160,
    High2880,
    High3072,
    High4320
}

/**
 * Extension map simulating Dart's `QString` extension behavior.
 */
const QUALITY_STRING_MAP: Record<VideoQuality, string> = {
    [VideoQuality.Unknown]: 'Unknown',
    [VideoQuality.Low144]: '144p',
    [VideoQuality.Low240]: '240p',
    [VideoQuality.Medium360]: '360p',
    [VideoQuality.Medium480]: '480p',
    [VideoQuality.High720]: '720p',
    [VideoQuality.High1080]: '1080p',
    [VideoQuality.High1440]: '1440p',
    [VideoQuality.High2160]: '2160p',
    [VideoQuality.High2880]: '2880p',
    [VideoQuality.High3072]: '3072p',
    [VideoQuality.High4320]: '4320p',
};

/**
 * Helper utility to extract string representation data from a VideoQuality enum value.
 * Replicates Dart's: `myQuality.qualityString`
 */
export function getVideoQualityString(quality: VideoQuality): string {
    return QUALITY_STRING_MAP[quality] ?? 'Unknown';
}

export interface VideoResolutionParams {
    width: number;
    height: number;
}

/**
 * Width and height dimension constraints of a video.
 */
export class VideoResolution {
    /** Viewport width. */
    public readonly width: number;

    /** Viewport height. */
    public readonly height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    // ============================================================================
    // Factory Initializers & Serialization
    // ============================================================================

    /**
     * Instantiates a VideoResolution instance out of a serialized JSON object map.
     */
    public static fromJson(json: Record<string, any>): VideoResolution {
        const width = typeof json['width'] === 'number' ? json['width'] : 0;
        const height = typeof json['height'] === 'number' ? json['height'] : 0;
        return new VideoResolution(width, height);
    }

    /**
     * Serializes the VideoResolution back to a plain object dictionary.
     */
    public toJson(): Record<string, any> {
        return {
            width: this.width,
            height: this.height,
        };
    }

    /** Returns standard display formatting (e.g., "1920x1080") */
    public toString(): string {
        return `${this.width}x${this.height}`;
    }

    // ============================================================================
    // Sorting, Equality, & Emulated Operators
    // ============================================================================

    /**
     * Structural comparative sorting logic.
     * Maps to Dart's: int compareTo(VideoResolution other)
     */
    public compareTo(other: VideoResolution): number {
        if (this.width === other.width && this.height === other.height) {
            return 0;
        }

        if (this.width > other.width) {
            return 1;
        }

        if (this.width === other.width && this.height > other.height) {
            return 1;
        }

        return -1;
    }

    /**
     * Value-based structural identity matcher.
     * Maps to Dart's: operator ==(Object other)
     */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return (
            other instanceof VideoResolution &&
            this.width === other.width &&
            this.height === other.height
        );
    }

    /** Deterministic lookup identifier signature token. */
    public get hashCode(): string {
        return `VideoResolution:${this.width}:${this.height}`;
    }

    /** Replicates Dart operator: `>` */
    public greaterThan(other: VideoResolution): boolean {
        return this.compareTo(other) > 0;
    }

    /** Replicates Dart operator: `<` */
    public lessThan(other: VideoResolution): boolean {
        return this.compareTo(other) < 0;
    }

    /** Replicates Dart operator: `>=` */
    public greaterThanOrEqualTo(other: VideoResolution): boolean {
        return this.compareTo(other) >= 0;
    }

    /** Replicates Dart operator: `<=` */
    public lessThanOrEqualTo(other: VideoResolution): boolean {
        return this.compareTo(other) <= 0;
    }
}

// 1. Immutable structural layout mapping configurations
const resolutionMap = new Map<VideoQuality, VideoResolution>([
    [VideoQuality.Unknown, new VideoResolution(-1, -1)],
    [VideoQuality.Low144, new VideoResolution(256, 144)],
    [VideoQuality.Low240, new VideoResolution(426, 240)],
    [VideoQuality.Medium360, new VideoResolution(640, 360)],
    [VideoQuality.Medium480, new VideoResolution(854, 480)],
    [VideoQuality.High720, new VideoResolution(1280, 720)],
    [VideoQuality.High1080, new VideoResolution(1920, 1080)],
    [VideoQuality.High1440, new VideoResolution(2560, 1440)],
    [VideoQuality.High2160, new VideoResolution(3840, 2160)],
    [VideoQuality.High2880, new VideoResolution(5120, 2880)],
    [VideoQuality.High3072, new VideoResolution(4096, 3072)],
    [VideoQuality.High4320, new VideoResolution(7680, 4320)],
]);

/**
 * Namespace companion or utility class handling structural routines linked directly to the VideoQuality type contract.
 */
export class VideoQualityUtil {
    /**
     * Parses the raw context string label tracking asset configurations.
     * Replicates Dart's: `VideoQualityUtil.fromLabel(label)`
     */
    public static fromLabel(label: string | undefined | null): VideoQuality {
        if (!label) {
            return VideoQuality.Unknown;
        }
        const lowerLabel = label.toLowerCase();

        // Replicating original logic chains (Note: original 240 mapped to low144 in your code snippet)
        if (lowerLabel.startsWith('240') || lowerLabel === '426x240') {
            return VideoQuality.Low144;
        }
        if (lowerLabel.startsWith('360') || lowerLabel === '640x360') {
            return VideoQuality.Medium360;
        }
        if (lowerLabel.startsWith('480') || lowerLabel === '854x480') {
            return VideoQuality.Medium480;
        }
        if (lowerLabel.startsWith('720') || lowerLabel === '1280x720') {
            return VideoQuality.High720;
        }
        if (lowerLabel.startsWith('1080') || lowerLabel === '1920x1080') {
            return VideoQuality.High1080;
        }
        if (lowerLabel.startsWith('1440')) {
            return VideoQuality.High1440;
        }
        if (lowerLabel.startsWith('2160')) {
            return VideoQuality.High2160;
        }
        if (lowerLabel.startsWith('2880')) {
            return VideoQuality.High2880;
        }
        if (lowerLabel.startsWith('3072')) {
            return VideoQuality.High3072;
        }
        if (lowerLabel.startsWith('4320')) {
            return VideoQuality.High4320;
        }
        if (lowerLabel.startsWith('144') || lowerLabel === '256x144') {
            return VideoQuality.Low144;
        }
        return VideoQuality.Unknown;
    }

    /**
     * Evaluates the current enumeration value variant to match its explicit text suffix format.
     */
    public static getQualityString(quality: VideoQuality): string {
        switch (quality) {
            case VideoQuality.Unknown: return 'Unknown';
            case VideoQuality.Low144: return '144p';
            case VideoQuality.Low240: return '240p';
            case VideoQuality.Medium360: return '360p';
            case VideoQuality.Medium480: return '480p';
            case VideoQuality.High720: return '720p';
            case VideoQuality.High1080: return '1080p';
            case VideoQuality.High1440: return '1440p';
            case VideoQuality.High2160: return '2160p';
            case VideoQuality.High2880: return '2880p';
            case VideoQuality.High3072: return '3072p';
            case VideoQuality.High4320: return '4320p';
            default: return 'Unknown';
        }
    }

    /**
     * Replicates Dart's: `getLabel()` by pulling out non-numeric characters from the string enum value.
     */
    public static getLabel(quality: VideoQuality): string {
        const cleanDigits = quality.toString().replace(/\D/g, '');
        return `${cleanDigits}p`;
    }

    /**
     * Extracts label metadata with framerate appending conditions.
     */
    public static getLabelWithFramerate(quality: VideoQuality, framerate: number): string {
        // Framerate appears only if it's above 30
        if (framerate <= 30) {
            return VideoQualityUtil.getLabel(quality);
        }
        const framerateRounded = Math.ceil(framerate / 10) * 10;
        return `${VideoQualityUtil.getLabel(quality)}${framerateRounded}`;
    }

    /**
     * Returns a concrete [VideoResolution] mapped from its target enum quality context.
     * @throws Error instance if lookup parameters fail validation bounds.
     */
    public static toVideoResolution(quality: VideoQuality): VideoResolution {
        const resolution = resolutionMap.get(quality);
        if (resolution === undefined) {
            throw new Error(`Unrecognized video quality: ${quality}`);
        }
        return resolution;
    }
}