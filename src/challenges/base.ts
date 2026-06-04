/**
 * Types of signature deciphering challenges issued by YouTube's base player script.
 */
export enum JSChallengeType {
    N = 'n',
    Sig = 'sig',
}

/**
 * Data container representing a collection of structural challenge sequences.
 */
export class JSChallengeRequest {
    public readonly type: JSChallengeType;
    public readonly challenges: readonly string[];

    constructor(options: { type: JSChallengeType; challenges: string[] }) {
        this.type = options.type;
        this.challenges = Object.freeze([...options.challenges]); // Enforces array immutability
    }
}

/**
 * Base orchestration contract blueprint for handling sandboxed execution 
 * of extracted dynamic JavaScript player logic routines.
 */
export abstract class BaseJSChallengeSolver {
    /**
     * Solves JavaScript challenges in bulk.
     * * @param playerUrl The root script locator URL asset where the functions were extracted.
     * @param requests A dictionary mapping challenge types to arrays of challenge payload strings.
     * @returns A Promise resolving to a flat dictionary where each original challenge string maps to its deciphered string result (or null if parsing failed).
     */
    public abstract solveBulk(
        playerUrl: string,
        requests: Record<JSChallengeType, string[]>
    ): Promise<Record<string, string | undefined>>;

    /**
     * Solves a single JavaScript challenge of the specified type.
     * * @returns The deciphered text output token value string.
     */
    public abstract solve(
        playerUrl: string,
        type: JSChallengeType,
        challenge: string
    ): Promise<string>;

    /**
     * Safely releases any underlying worker execution environments, browsers, 
     * or VM context sandboxes to avoid memory leaks.
     */
    public dispose(): void {
        // Default implementation matches Dart's empty lifecycle hook
    }
}