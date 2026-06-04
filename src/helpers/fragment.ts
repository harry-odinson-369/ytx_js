/**
 * Fragment used for DASH Manifests.
 */
export class Fragment {
    /** The fragment URI request path string. */
    public readonly path: string;

    constructor(path: string) {
        this.path = path;
    }

    /**
     * Instantiates a Fragment data block out of a raw JSON dictionary mapper.
     */
    public static fromJson(json: Record<string, any>): Fragment {
        if (typeof json['path'] !== 'string') {
            throw new Error(`Invalid JSON: Expected a string value for property field 'path'`);
        }
        return new Fragment(json['path']);
    }

    /**
     * Serializes the Fragment instance into a plain JavaScript data object mapping.
     */
    public toJson(): Record<string, any> {
        return {
            path: this.path,
        };
    }
}