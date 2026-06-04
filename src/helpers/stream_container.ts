export interface StreamContainerChanges {
    name?: string;
}

/**
 * Stream container.
 */
export class StreamContainer {
    /** * Container name. Can be used as a file extension.
     * Marked readonly to preserve strict immutability.
     */
    public readonly name: string;

    /**
     * Prevents arbitrary external instantiations outside of the static definitions.
     */
    private constructor(name: string) {
        this.name = name;
    }

    // ============================================================================
    // Static Constant Containers
    // ============================================================================

    /** MPEG-4 Part 14 (.mp4). */
    public static readonly mp4 = new StreamContainer('mp4');

    /** Web Media (.webm). */
    public static readonly webM = new StreamContainer('webm');

    /** 3rd Generation Partnership Project (.3gpp). */
    public static readonly tgpp = new StreamContainer('3gpp');

    /** M3U8 (.m3u8). */
    public static readonly m3u8 = new StreamContainer('m3u8');

    public static readonly unknown = new StreamContainer('unknown');

    /**
   * Create a copy of StreamContainer with given fields replaced.
   */
    public copyWith(changes: StreamContainerChanges): StreamContainer {
        return new StreamContainer(
            changes.name !== undefined ? changes.name : this.name
        );
    }

    // ============================================================================
    // Factory Parsing Methods
    // ============================================================================

    /**
     * Parse a container from its string name.
    */
    public static parse(name?: string): StreamContainer {
        switch (name?.toLowerCase()) {
            case 'mp4': return StreamContainer.mp4;
            case 'webm': return StreamContainer.webM;
            case '3gpp': return StreamContainer.tgpp;
            case 'm3u8': return StreamContainer.m3u8;
            case undefined: return StreamContainer.unknown;
            default:
                throw new Error(`ArgumentError: Invalid stream container name "${name}". Valid values: mp4, webm, 3gpp, m3u8`);
        }
    }

    /**
     * Instantiates a container out of a standard JSON record dictionary.
     * Replicates `factory StreamContainer.fromJson(Map<String, dynamic> json)`
     */
    public static fromJson(json: Record<string, any>): StreamContainer {
        if (typeof json['name'] !== 'string') {
            throw new Error(`ArgumentError: Expected a string parameter under key 'name'. Received: ${typeof json['name']}`);
        }
        return StreamContainer.parse(json['name']);
    }

    /**
     * Converts the container state instance into an explicitly stringifiable JSON object structure.
     */
    public toJson(): Record<string, string> {
        return {
            name: this.name
        };
    }

    /** Custom string representation override mapping to the target extension string. */
    public toString(): string {
        return this.name;
    }

    /**
   * Evaluates value-based structural equality instead of memory reference pointer.
   */
    public equals(other: unknown): boolean {
        if (this === other) return true;
        return other instanceof StreamContainer && this.name === other.name;
    }

    /**
   * Generates a structural deterministic primitive hash code string.
   */
    public get hashCode(): string {
        // A primitive hash string is the safest, most performant way to represent unique 
        // structural instances inside hash tables or custom Sets in JavaScript.
        return `StreamContainer:${this.name}`;
    }
}