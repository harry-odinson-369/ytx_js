export class BasePagedArray<T> extends Array<T> {
    constructor(base?: Array<T>) {
        super();
        if (base) this.push(...base);
    }

    async nextpage(): Promise<BasePagedArray<T> | undefined> {
        throw new Error("Unimplemented function!");
    }
}

export class LinkedHashSet<E> implements Iterable<E> {

    // We use a Map where the key is the calculated hash/identity string, 
    // and the value is the actual object. Maps naturally preserve insertion order in JS.
    private storage = new Map<string | number, E>();

    private equalsFn: (a: E, b: E) => boolean;
    private hashCodeFn: (value: E) => string | number;

    constructor(options?: {
        equals?: (a: E, b: E) => boolean;
        hashCode?: (value: E) => string | number;
    }) {
        // Default to standard JS strict equality if no custom functions are provided
        this.equalsFn = options?.equals ?? ((a, b) => a === b);

        // Default hashing falls back to string conversion or object reference
        this.hashCodeFn = options?.hashCode ?? ((value) => {
            if (typeof value === 'object' && value !== null) {
                // If it's a structural object without a hash helper, we JSON stringify it 
                return JSON.stringify(value);
            }
            return value as any;
        });
    }

    /** Adds an element to the set. Preserves insertion order. */
    public add(value: E): this {
        const hash = this.hashCodeFn(value);

        // In case of hash collisions, double check with the custom equals function
        if (this.storage.has(hash)) {
            const existingValue = this.storage.get(hash)!;
            if (this.equalsFn(existingValue, value)) {
                return this; // It's a duplicate, don't re-add
            }
        }

        this.storage.set(hash, value);
        return this;
    }

    public addAll(arr: E[]): void {
        for (const item of arr) {
            this.add(item);
        }
    }

    /** Checks if an element is in the set using the identity pipeline. */
    public has(value: E): boolean {
        const hash = this.hashCodeFn(value);
        if (!this.storage.has(hash)) return false;

        return this.equalsFn(this.storage.get(hash)!, value);
    }

    /** Removes an element from the set. */
    public delete(value: E): boolean {
        const hash = this.hashCodeFn(value);
        if (!this.storage.has(hash)) return false;

        if (this.equalsFn(this.storage.get(hash)!, value)) {
            return this.storage.delete(hash);
        }
        return false;
    }

    /** Clears all items. */
    public clear(): void {
        this.storage.clear();
    }

    /** Gets the current element count. */
    public get size(): number {
        return this.storage.size;
    }

    public *[Symbol.iterator](): Iterator<E> {
        for (const value of this.storage.values()) {
            yield value;
        }
    }

}