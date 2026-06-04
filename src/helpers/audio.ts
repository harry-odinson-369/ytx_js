import { StreamInfo } from "./stream_info";

/**
 * Custom type guard to determine if a StreamInfo object satisfies the AudioStreamInfo interface.
 * This directly replaces Dart's `is AudioStreamInfo` checking mechanism.
 */
export function isAudioStreamInfo(stream: StreamInfo): stream is AudioStreamInfo {
    // Checks if the field exists on the object, or dynamically checks the runtimeType
    return 'audioTrack' in stream && 'audioCodec' in stream;
}

export interface AudioStreamInfo extends StreamInfo {
    /** The codec configuration of the audio track stream. */
    readonly audioCodec: string;

    /** Audio track which describes the language of the audio. */
    readonly audioTrack?: AudioTrack;
}

export interface AudioTrackParams {
    displayName: string;
    id: string;
    audioIsDefault: boolean;
}

export interface AudioTrackChanges {
    displayName?: string;
    id?: string;
    audioIsDefault?: boolean;
}

/**
 * Audio track which describes the language of the audio.
 * Ported from a Dart Freezed data layout structure.
 */
export class AudioTrack {
    public readonly displayName: string;
    public readonly id: string;
    public readonly audioIsDefault: boolean;

    constructor(params: AudioTrackParams) {
        this.displayName = params.displayName;
        this.id = params.id;
        this.audioIsDefault = params.audioIsDefault;
    }

    // ============================================================================
    // Dart runtimeType Equivalent
    // ============================================================================

    /** Concrete class name string identifier wrapper. */
    public get runtimeType(): string {
        return this.constructor.name;
    }

    // ============================================================================
    // Factory Initializers & Serializers
    // ============================================================================

    /**
     * Instantiates an AudioTrack data block out of a raw JSON dictionary mapper.
     * Replicates: factory AudioTrack.fromJson(Map<String, Object?> json)
     */
    public static fromJson(json: Record<string, any>): AudioTrack {
        return new AudioTrack({
            displayName: typeof json['displayName'] === 'string' ? json['displayName'] : '',
            id: typeof json['id'] === 'string' ? json['id'] : '',
            audioIsDefault: typeof json['audioIsDefault'] === 'boolean' ? json['audioIsDefault'] : false,
        });
    }

    /**
     * Serializes the AudioTrack instance into a plain JavaScript data object mapping.
     * Replicates: Map<String, dynamic> toJson()
     */
    public toJson(): Record<string, any> {
        return {
            displayName: this.displayName,
            id: this.id,
            audioIsDefault: this.audioIsDefault,
        };
    }

    // ============================================================================
    // Freezed Emulation Utilities (Cloning & Identity Checkers)
    // ============================================================================

    /**
     * Returns a modified duplicate clone block.
     * Simulates Dart Freezed's `copyWith` implementation strategy.
     */
    public copyWith(changes: AudioTrackChanges): AudioTrack {
        return new AudioTrack({
            displayName: changes.displayName !== undefined ? changes.displayName : this.displayName,
            id: changes.id !== undefined ? changes.id : this.id,
            audioIsDefault: changes.audioIsDefault !== undefined ? changes.audioIsDefault : this.audioIsDefault,
        });
    }

    /**
     * Structural equality matching. Checks values rather than memory reference locations.
     * Replicates Freezed's `operator ==` override logic.
     */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return (
            other instanceof AudioTrack &&
            this.runtimeType === other.runtimeType &&
            this.displayName === other.displayName &&
            this.id === other.id &&
            this.audioIsDefault === other.audioIsDefault
        );
    }

    /**
     * Generates a structural deterministic primitive hash code string.
     */
    public get hashCode(): string {
        return `${this.runtimeType}:${this.displayName}:${this.id}:${this.audioIsDefault}`;
    }

    /**
     * Custom string representation tracking key property values.
     */
    public toString(): string {
        return `AudioTrack(displayName: ${this.displayName}, id: ${this.id}, audioIsDefault: ${this.audioIsDefault})`;
    }
}