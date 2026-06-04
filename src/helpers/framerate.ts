export interface FramerateChanges {
    framesPerSecond?: number;
}

/**
 * Encapsulates video framerate metrics with comparison utilities.
 * Ported from a Dart Freezed data layout model.
 */
export class Framerate {
    /** Framerate as frames per second. */
    public readonly framesPerSecond: number;

    constructor(framesPerSecond: number) {
        this.framesPerSecond = framesPerSecond;
    }

    // ============================================================================
    // Dart runtimeType Equivalent
    // ============================================================================

    /** Concrete class name string identifier wrapper. */
    public get runtimeType(): string {
        return this.constructor.name;
    }

    // ============================================================================
    // Factory Initializers & Serialization
    // ============================================================================

    /**
     * Instantiates a Framerate instance out of a serialized JSON object map.
     */
    public static fromJson(json: Record<string, any>): Framerate {
        const fps = typeof json['framesPerSecond'] === 'number' ? json['framesPerSecond'] : 0;
        return new Framerate(fps);
    }

    /**
     * Serializes the Framerate instance back to a plain JSON-safe object dictionary.
     */
    public toJson(): Record<string, any> {
        return {
            framesPerSecond: this.framesPerSecond,
        };
    }

    /** Returns formatted display text (e.g., "60fps" or "23.976fps") */
    public toString(): string {
        return `${this.framesPerSecond}fps`;
    }

    // ============================================================================
    // Freezed Emulation & Comparison Utilities
    // ============================================================================

    /**
     * Structural comparative sorting logic matching Dart's Comparable interface.
     */
    public compareTo(other: Framerate): number {
        if (this.framesPerSecond < other.framesPerSecond) return -1;
        if (this.framesPerSecond > other.framesPerSecond) return 1;
        return 0;
    }

    /**
     * Value-based structural identity matcher.
     * Replicates Freezed's custom `operator ==` generation block.
     */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return (
            other instanceof Framerate &&
            this.runtimeType === other.runtimeType &&
            this.framesPerSecond === other.framesPerSecond
        );
    }

    /** Generates a deterministic lookup identifier signature token. */
    public get hashCode(): string {
        return `${this.runtimeType}:${this.framesPerSecond}`;
    }

    /**
     * Returns a modified duplicate clone block.
     * Simulates Dart Freezed's `copyWith` utility.
     */
    public copyWith(changes: FramerateChanges): Framerate {
        return new Framerate(
            changes.framesPerSecond !== undefined ? changes.framesPerSecond : this.framesPerSecond
        );
    }

    /** Replicates Dart operator: `>` */
    public greaterThan(other: Framerate): boolean {
        return this.framesPerSecond > other.framesPerSecond;
    }

    /** Replicates Dart operator: `<` */
    public lessThan(other: Framerate): boolean {
        return this.framesPerSecond < other.framesPerSecond;
    }
}