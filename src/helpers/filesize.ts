export interface FileSizeChanges {
    totalBytes?: number;
}

/**
 * Encapsulates file size metrics with conversion utilities.
 * Ported from a Dart Freezed data layout structure.
 */
export class FileSize {
    /** Total bytes. Marked readonly to guarantee class immutability. */
    public readonly totalBytes: number;

    constructor(totalBytes: number) {
        this.totalBytes = totalBytes;
    }

    // ============================================================================
    // Static Constants & Factory Initializers
    // ============================================================================

    /** Standard empty fallback static metric instance */
    public static readonly unknown = new FileSize(0);

    /**
     * Instantiates a FileSize data instance out of a raw serialized JSON object mapping
     */
    public static fromJson(json: Record<string, any>): FileSize {
        const bytes = typeof json['totalBytes'] === 'number' ? json['totalBytes'] : 0;
        return new FileSize(bytes);
    }

    // ============================================================================
    // Derived Property Conversion Getters
    // ============================================================================

    /** Total kilobytes. */
    public get totalKiloBytes(): number {
        return this.totalBytes / 1024;
    }

    /** Total megabytes. */
    public get totalMegaBytes(): number {
        return this.totalKiloBytes / 1024;
    }

    /** Total gigabytes. */
    public get totalGigaBytes(): number {
        return this.totalMegaBytes / 1024;
    }

    // ============================================================================
    // Value Comparisons & Mutations
    // ============================================================================

    /**
     * Compares two FileSize units against each other.
     * Enables sorting pools directly via Array.prototype.sort((a, b) => a.compareTo(b))
     */
    public compareTo(other: FileSize): number {
        if (this.totalBytes < other.totalBytes) return -1;
        if (this.totalBytes > other.totalBytes) return 1;
        return 0;
    }

    /**
     * Structural equality matching. Checks values rather than memory reference locations.
     */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return other instanceof FileSize && this.totalBytes === other.totalBytes;
    }

    /**
     * Generates a structural record identity token.
     */
    public get hashCode(): string {
        return `FileSize:${this.totalBytes}`;
    }

    /**
     * Returns a modified duplicate clone block.
     */
    public copyWith(changes: FileSizeChanges): FileSize {
        return new FileSize(
            changes.totalBytes !== undefined ? changes.totalBytes : this.totalBytes
        );
    }

    /** Serializes the metric back out to a primitive JSON-safe object dictionary maps. */
    public toJson(): Record<string, any> {
        return {
            totalBytes: this.totalBytes,
        };
    }

    // ============================================================================
    // Internal Private Calculation Mechanics & Serialization Overrides
    // ============================================================================

    private _getLargestSymbol(): string {
        if (Math.abs(this.totalGigaBytes) >= 1) return 'GB';
        if (Math.abs(this.totalMegaBytes) >= 1) return 'MB';
        if (Math.abs(this.totalKiloBytes) >= 1) return 'KB';
        return 'B';
    }

    private _getLargestValue(): number {
        if (Math.abs(this.totalGigaBytes) >= 1) return this.totalGigaBytes;
        if (Math.abs(this.totalMegaBytes) >= 1) return this.totalMegaBytes;
        if (Math.abs(this.totalKiloBytes) >= 1) return this.totalKiloBytes;
        return this.totalBytes;
    }

    /** Formats output directly into a clean, human-readable display label (e.g., "4.52 MB") */
    public toString(): string {
        return `${this._getLargestValue().toFixed(2)} ${this._getLargestSymbol()}`;
    }
}