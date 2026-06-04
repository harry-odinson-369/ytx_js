const validQueryDomains = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'gaming.youtube.com',
]);

const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;

export const getidfromurl = (link: string) => {
    const parsed = new URL(link.trim());
    let id = parsed.searchParams.get('v');
    if (validPathDomains.test(link.trim()) && !id) {
        const paths = parsed.pathname.split('/');
        id = parsed.host === 'youtu.be' ? paths[1] : paths[2];
    } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
        throw Error('Not a YouTube domain');
    }
    if (!id) {
        throw Error(`No video id found: "${link}"`);
    }
    id = id.substring(0, 11);
    if (!validateid(id)) {
        throw TypeError(`Video id (${id}) does not match expected format (${idRegex.toString()})`);
    }
    return id;
};

const urlRegex = /^https?:\/\//;
export const getvideoid = (str: string) => {
    if (validateid(str)) {
        return str;
    } else if (urlRegex.test(str.trim())) {
        return getidfromurl(str);
    } else {
        throw Error(`No video id found: ${str}`);
    }
};

const idRegex = /^[a-zA-Z0-9-_]{11}$/;
export const validateid = (id: string) => idRegex.test(id.trim());

export const validateurl = (str: string) => {
    try {
        getidfromurl(str);
        return true;
    } catch (e) {
        return false;
    }
};

export interface SplitQueryStringOptions {
    /** * Provided to match the Dart API contract surface.
     * Note: JavaScript natively decodes URI components using UTF-8 implicitly.
     */
    encoding?: string;
}

/**
 * Splits a standard URL query string into a flat key-value record object.
 */
export function splitQueryString(query?: string): Record<string, string> | undefined {
    if (!query) return undefined;
    
    // Gracefully clear out leading '?' marks if the raw query parameter string retains them
    const cleanQuery = query.startsWith('?') ? query.substring(1) : query;

    if (!cleanQuery) {
        return {};
    }

    return cleanQuery.split('&').reduce<Record<string, string>>((map, element) => {
        const index = element.indexOf('=');

        if (index === -1) {
            if (element !== '') {
                const decodedKey = decodeURIComponent(element);
                map[decodedKey] = '';
            }
        } else if (index !== 0) {
            const key = element.substring(0, index);
            const value = element.substring(index + 1);

            const decodedKey = decodeURIComponent(key);
            const decodedValue = decodeURIComponent(value);

            map[decodedKey] = decodedValue;
        }

        return map;
    }, {});
}

/**
 * Utility function that returns a new URL with the updated query parameter set.
 * Replicates Dart's: `uri.setQueryParam(key, value)`
 * * @param originalUrl A standard URL instance or a full URL string path.
 * @param key The query parameter field name.
 * @param value The value to bind to the key.
 * @returns A fresh, mutated absolute URL instance wrapper.
 */
export function setQueryParam(originalUrl: URL | string, key: string, value: string): URL {
    // 1. Instantiate a new distinct URL object to prevent side-effect mutations on the original reference
    const urlCopy = new URL(originalUrl.toString());

    // 2. Set the parameter (automatically handles overwriting existing keys and URL-encoding values)
    urlCopy.searchParams.set(key, value);

    return urlCopy;
}