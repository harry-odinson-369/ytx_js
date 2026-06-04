export interface BitrateChanges {
    bitsPerSecond?: number;
}

/**
 * Encapsulates media bitrate metrics with conversion utilities.
 */
export class Bitrate {
    /** Bits per second. Marked readonly to guarantee class immutability. */
    public readonly bitsPerSecond: number;

    constructor(bitsPerSecond: number) {
        this.bitsPerSecond = bitsPerSecond;
    }

    // ============================================================================
    // Static Constants & Factory Initializers
    // ============================================================================

    /** Standard empty fallback static metric instance */
    public static readonly unknown = new Bitrate(0);

    /**
     * Instantiates a Bitrate data instance out of a raw serialized JSON object mapping.
     */
    public static fromJson(json: Record<string, any>): Bitrate {
        const bps = typeof json['bitsPerSecond'] === 'number' ? json['bitsPerSecond'] : 0;
        return new Bitrate(bps);
    }

    // ============================================================================
    // Derived Property Conversion Getters
    // ============================================================================

    /** Kilobits per second. */
    public get kiloBitsPerSecond(): number {
        return this.bitsPerSecond / 1024;
    }

    /** Megabits per second. */
    public get megaBitsPerSecond(): number {
        return this.kiloBitsPerSecond / 1024;
    }

    /** Gigabits per second. */
    public get gigaBitsPerSecond(): number {
        return this.megaBitsPerSecond / 1024;
    }

    // ============================================================================
    // Value Comparisons & Mutations
    // ============================================================================

    /**
     * Compares two Bitrate units against each other.
     * Enables sorting pools directly via Array.prototype.sort((a, b) => a.compareTo(b))
     */
    public compareTo(other: Bitrate): number {
        if (this.bitsPerSecond < other.bitsPerSecond) return -1;
        if (this.bitsPerSecond > other.bitsPerSecond) return 1;
        return 0;
    }

    /**
     * Structural equality matching. Checks values rather than memory reference locations.
     */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return other instanceof Bitrate && this.bitsPerSecond === other.bitsPerSecond;
    }

    /**
     * Generates a structural record identity token.
     */
    public get hashCode(): string {
        return `Bitrate:${this.bitsPerSecond}`;
    }

    /**
     * Returns a modified duplicate clone block.
     */
    public copyWith(changes: BitrateChanges): Bitrate {
        return new Bitrate(
            changes.bitsPerSecond !== undefined ? changes.bitsPerSecond : this.bitsPerSecond
        );
    }

    /** Serializes the metric back out to a primitive JSON-safe object dictionary maps. */
    public toJson(): Record<string, any> {
        return {
            bitsPerSecond: this.bitsPerSecond,
        };
    }

    // ============================================================================
    // Internal Private Calculation Mechanics & Serialization Overrides
    // ============================================================================

    private _getLargestSymbol(): string {
        if (Math.abs(this.gigaBitsPerSecond) >= 1) return 'Gbit/s';
        if (Math.abs(this.megaBitsPerSecond) >= 1) return 'Mbit/s';
        if (Math.abs(this.kiloBitsPerSecond) >= 1) return 'Kbit/s';
        return 'Bit/s';
    }

    private _getLargestValue(): number {
        if (Math.abs(this.gigaBitsPerSecond) >= 1) return this.gigaBitsPerSecond;
        if (Math.abs(this.megaBitsPerSecond) >= 1) return this.megaBitsPerSecond;
        if (Math.abs(this.kiloBitsPerSecond) >= 1) return this.kiloBitsPerSecond;
        return this.bitsPerSecond;
    }

    /** Formats output directly into a clean display label (e.g., "5.12 Mbit/s") */
    public toString(): string {
        return `${this._getLargestValue().toFixed(2)} ${this._getLargestSymbol()}`;
    }
}