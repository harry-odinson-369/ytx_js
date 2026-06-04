// Simulated external error type based on Dart's source_span / exception layers
export class StringScannerException extends Error {
    constructor(
        message: string,
        public readonly position: number,
        public readonly length: number,
        public readonly source: string,
        public readonly sourceUrl: string | null
    ) {
        super(`Invalid input at position ${position}: ${message}`);
        this.name = 'StringScannerException';
    }
}

/**
 * A class that scans through a string sequentially using regular expressions or character lookups.
 * Ported from package:string_scanner/string_scanner.dart.
 */
export class StringScanner {
    /** The URL source location representation of the string being scanned. Used for error reporting. */
    public readonly sourceUrl: string | null;

    /** The raw string data sequence currently being scanned. */
    public readonly string: string;

    private _position = 0;
    private _lastMatch: RegExpExecArray | null = null;
    private _lastMatchPosition: number | null = null;

    constructor(string: string, options?: { sourceUrl?: string; position?: number }) {
        this.string = string;
        this.sourceUrl = options?.sourceUrl ?? null;
        if (options?.position !== undefined) {
            this.position = options.position;
        }
    }

    /** Gets the current index position pointer of the scanner. */
    public get position(): number {
        return this._position;
    }

    /** Sets the current pointer offset position manually. Unsets internal match buffers. */
    public set position(newPosition: number) {
        if (newPosition < 0 || newPosition > this.string.length) {
            throw new RangeError(`ArgumentError: Invalid bounds position value: ${newPosition}`);
        }
        this._position = newPosition;
        this._lastMatch = null;
    }

    /** Returns execution details from the last successful match pattern block. */
    public get lastMatch(): RegExpExecArray | null {
        if (this._position !== this._lastMatchPosition) {
            this._lastMatch = null;
        }
        return this._lastMatch;
    }

    /** The remaining unparsed segment trailing past the current position state. */
    public get rest(): string {
        return this.string.substring(this._position);
    }

    /** Returns true if the string has been completely consumed. */
    public get isDone(): boolean {
        return this._position === this.string.length;
    }

    /**
     * Consumes a single character and returns its basic code unit value.
     * Throws an exception error if the index bounds run out.
     */
    public readChar(): number {
        if (this.isDone) this._fail('more input');
        return this.string.charCodeAt(this._position++);
    }

    /**
     * Look ahead at a character code unit offset from the current location without consuming it.
     */
    public peekChar(offset = 0): number | null {
        const index = this._position + offset;
        if (index < 0 || index >= this.string.length) return null;
        return this.string.charCodeAt(index);
    }

    /**
     * Evaluates if the upcoming character matches the targeted numerical char-code sequence.
     * If yes, advances the pointer index position safely. Handles surrogate planes.
     */
    public scanChar(character: number): boolean {
        if (character > 0xffff) {
            // Handles JavaScript Surrogate Planes (32-bit Unicode Code Points)
            const targetStr = String.fromCodePoint(character);
            if (this.string.startsWith(targetStr, this._position)) {
                this._position += targetStr.length;
                return true;
            }
            return false;
        } else {
            if (this.isDone) return false;
            if (this.string.charCodeAt(this._position) !== character) return false;
            this._position++;
            return true;
        }
    }

    /**
     * Asserts that the upcoming character matches the code target. Advances if true, throws if false.
     */
    public expectChar(character: number, name?: string): void {
        if (this.scanChar(character)) return;

        if (!name) {
            if (character === 92) name = '"\\\\"';
            else if (character === 34) name = '"\\""';
            else name = `"${String.fromCodePoint(character)}"`;
        }

        this._fail(name);
    }

    /** Consumes a single Unicode code unit character block, evaluating surrogate structures. */
    public readCodePoint(): number {
        if (this.isDone) this._fail('more input');
        const codePoint = this.string.codePointAt(this._position);
        if (codePoint === undefined) this._fail('more input');

        // Increment position tracker by length of code point representation character length (1 or 2)
        this._position += codePoint > 0xffff ? 2 : 1;
        return codePoint;
    }

    /** Looks ahead at the immediate next full code point target without advancing index location. */
    public peekCodePoint(): number | null {
        if (this.isDone) return null;
        return this.string.codePointAt(this._position) ?? null;
    }

    /**
     * Evaluates if a given RegExp layout matches exactly at the current position.
     * If true, updates lastMatch data state metrics and rolls position forward.
     */
    public scan(pattern: RegExp): boolean {
        const success = this.matches(pattern);
        if (success && this._lastMatch) {
            this._position += this._lastMatch[0].length;
            this._lastMatchPosition = this._position;
        }
        return success;
    }

    /**
     * Evaluates a scanner lookahead execution match block.
     * Throws detailed errors if validation fails.
     */
    public expect(pattern: RegExp, name?: string): void {
        if (this.scan(pattern)) return;

        if (!name) {
            name = `/${pattern.source}/`;
        }
        this._fail(name);
    }

    /** Throws error payloads if structural scanning finishes before string sequence stream completely exhausts. */
    public expectDone(): void {
        if (this.isDone) return;
        this._fail('no more input');
    }

    /**
     * Verifies if pattern constraints match from the current active offset boundary index location.
     * Does NOT alter cursor execution positions.
     */
    public matches(pattern: RegExp): boolean {
        // Slice string sequence or apply matching logic to emulate Dart's matchAsPrefix.
        // Using sticky 'y' flags or anchor handling optimization pipelines is recommended.
        const substring = this.string.slice(this._position);
        const match = pattern.exec(substring);

        if (match && match.index === 0) {
            this._lastMatch = match;
            this._lastMatchPosition = this._position;
            return true;
        }

        this._lastMatch = null;
        return false;
    }

    /** Exposes structural slicing interfaces out of internal buffer values. */
    public substring(start: number, end?: number): string {
        const finalEnd = end ?? this._position;
        return this.string.substring(start, finalEnd);
    }

    /**
     * Generates a structural runtime exception pointing cleanly at the error offset trace layout.
     */
    public error(
        message: string,
        options?: { match?: RegExpExecArray | null; position?: number; length?: number }
    ): never {
        let position = options?.position;
        let length = options?.length;
        let match = options?.match;

        if (match === undefined && position === undefined && length === undefined) {
            match = this.lastMatch;
        }

        position = position ?? (match ? this._position - match[0].length : this._position);
        length = length ?? (match ? match[0].length : 0);

        throw new StringScannerException(message, position, length, this.string, this.sourceUrl);
    }

    private _fail(name: string): never {
        this.error(`expected ${name}.`, { position: this._position, length: 0 });
    }
}

// ============================================================================
// Core HTTP RegExp Lookups (RFC-2616 Specifications)
// ============================================================================

/** An HTTP token definition constraint layout. */
export const token = /^[^\(\)<>@,;:"\\\/\[\]\?=\{\} \t\x00-\x1F\x7F]+/;

/** Linear whitespace fragment configuration pattern. */
const LWS_RAW = /(?:\r\n)?[ \t]+/.source;

/** A quoted string complying with RFC-2616 section 2.2 metrics. */
export const quotedString = /^"(?:[^"\x00-\x1F\x7F\\]|\\.)*"/;

/** A single backslash-escaped character sequence pair. */
export const quotedPair = /\\(.)/g;

/** A lookup expression validation block capturing invalid HTTP token contents. */
export const nonToken = /[\(\)<>@,;:"\\\/\[\]\?=\{\} \t\x00-\x1F\x7F]/;

/** A regular expression capturing sequential linear whitespace cascades. */
export const whitespace = new RegExp(`^(?:${LWS_RAW})*`);

// ============================================================================
// Parsing Utilities & Loop Operations
// ============================================================================

/**
 * Parses a comma-separated list of elements matching the standard `1#element` 
 * definition block layout established in the HTTP networking specification.
 */
export function parseList<T>(scanner: StringScanner, parseElement: () => T): T[] {
    const result: T[] = [];

    // Consume initial empty comma buffers safely
    while (scanner.scan(/^,/)) {
        scanner.scan(whitespace);
    }

    // Extract the necessary first valid target element block sequence
    result.push(parseElement());
    scanner.scan(whitespace);

    // Cycle through sequential remaining list items dynamically
    while (scanner.scan(/^,/)) {
        scanner.scan(whitespace);

        // Empty structural elements are permitted, but excluded from processed outputs
        if (scanner.matches(/^,/) || scanner.isDone) {
            continue;
        }

        result.push(parseElement());
        scanner.scan(whitespace);
    }

    return result;
}

/**
 * Parses a double-quoted string expression block context via scanner checks,
 * unescapes inner sequence content arrays, and trims the wrapping string literal bounding boxes.
 */
export function expectQuotedString(
    scanner: StringScanner,
    options?: { name?: string }
): string {
    const name = options?.name ?? 'quoted string';

    scanner.expect(quotedString, name);
    const matchedText = scanner.lastMatch![0];

    const innerContent = matchedText.substring(1, matchedText.length - 1);
    return innerContent.replace(quotedPair, (_, capturedChar) => capturedChar);
}