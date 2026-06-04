import { expectQuotedString, StringScanner } from "../utils/scan";
import { wrapformatexception } from "../utils/utils";

const TOKEN_REGEXP = /^[^\s(),/:;<=>?@[\\\]"]+/;
const WHITESPACE_REGEXP = /^\s+/;
const NON_TOKEN_REGEXP = /[\s(),/:;<=>?@[\\\]"]/;
const ESCAPED_CHAR_REGEXP = /["\x00-\x1F\x7F]/g;

export interface MediaTypeChangePayload {
    type?: string;
    subtype?: string;
    mimeType?: string;
    parameters?: Record<string, string>;
    clearParameters?: boolean;
}

export class MediaType {
    /** The primary identifier of the MIME type (always lowercase). */
    public readonly type: string;

    /** The secondary identifier of the MIME type (always lowercase). */
    public readonly subtype: string;

    /** The parameters assigned to this media type (Case-Insensitive keys, immutable). */
    public readonly parameters: Readonly<Record<string, string>>;

    constructor(type: string, subtype: string, parameters: Record<string, string> = {}) {
        this.type = type.toLowerCase();
        this.subtype = subtype.toLowerCase();

        // Replicates CaseInsensitiveMap.from + UnmodifiableMapView
        const caseInsensitiveMap: Record<string, string> = {};
        for (const [key, val] of Object.entries(parameters)) {
            caseInsensitiveMap[key.toLowerCase()] = val;
        }
        this.parameters = Object.freeze(caseInsensitiveMap);
    }

    /** The media type's clean combined MIME identifier path string (e.g., text/html) */
    public get mimeType(): string {
        return `${this.type}/${this.subtype}`;
    }

    /**
     * Parses a raw network media type content header segment value.
     * Throws a formatted Error context block if parsing targets break layout regulations.
     */
    public static parse(mediaType: string): MediaType {
        return wrapformatexception('media type', mediaType, () => {
            const scanner = new StringScanner(mediaType);

            scanner.scan(WHITESPACE_REGEXP);
            scanner.expect(TOKEN_REGEXP, 'token primary type');
            const type = scanner.lastMatch![0];

            scanner.expect(new RegExp('/'));

            scanner.expect(TOKEN_REGEXP, 'token secondary subtype');
            const subtype = scanner.lastMatch![0];

            scanner.scan(WHITESPACE_REGEXP);

            const parameters: Record<string, string> = {};
            while (scanner.scan(new RegExp(';'))) {
                scanner.scan(WHITESPACE_REGEXP);
                scanner.expect(TOKEN_REGEXP, 'attribute parameter name token');
                const attribute = scanner.lastMatch![0];

                scanner.expect(new RegExp('='));

                let value = '';
                if (scanner.scan(TOKEN_REGEXP)) {
                    value = scanner.lastMatch![0];
                } else {
                    value = expectQuotedString(scanner);
                }

                scanner.scan(WHITESPACE_REGEXP);
                parameters[attribute] = value;
            }

            scanner.expectDone();
            return new MediaType(type, subtype, parameters);
        });
    }

    /**
     * Returns a deeply-frozen mutation duplicate copy instance with modified target overrides applied.
     */
    public change(options: MediaTypeChangePayload): MediaType {
        let type = options.type;
        let subtype = options.subtype;
        const mimeType = options.mimeType;
        let parameters = options.parameters;
        const clearParameters = options.clearParameters ?? false;

        if (mimeType !== undefined && mimeType !== null) {
            if (type !== undefined && type !== null) {
                throw new Error('ArgumentError: You may not pass both [type] and [mimeType].');
            }
            if (subtype !== undefined && subtype !== null) {
                throw new Error('ArgumentError: You may not pass both [subtype] and [mimeType].');
            }

            const segments = mimeType.split('/');
            if (segments.length !== 2) {
                throw new Error(`FormatException: Invalid mime type context sequence: "${mimeType}".`);
            }

            type = segments[0];
            subtype = segments[1];
        }

        type = type ?? this.type;
        subtype = subtype ?? this.subtype;
        parameters = parameters ?? {};

        if (!clearParameters) {
            // Re-map fields over safely using structural copies
            parameters = { ...this.parameters, ...parameters };
        }

        return new MediaType(type, subtype, parameters);
    }

    /**
     * Converts the structured state values back into a valid HTTP-spec compliant header value.
     */
    public toString(): string {
        let output = `${this.type}/${this.subtype}`;

        for (const [attribute, value] of Object.entries(this.parameters)) {
            output += `; ${attribute}=`;

            if (NON_TOKEN_REGEXP.test(value)) {
                // Escapes problematic characters backslash targets cleanly inside wrapper quotes
                const escapedValue = value.replace(ESCAPED_CHAR_REGEXP, (match) => `\\${match}`);
                output += `"${escapedValue}"`;
            } else {
                output += value;
            }
        }

        return output;
    }
}