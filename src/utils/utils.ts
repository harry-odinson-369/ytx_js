import BaseHttpClient from "../clients/base";
import { AudioStreamInfo } from "../helpers/audio";
import { AudioOnlyStreamInfo } from "../helpers/audo_only_stream_info";
import { HlsStreamInfo } from "../helpers/hls_stream_info";
import { MuxedStreamInfo } from "../helpers/muxed_video_stream_info";
import { StreamInfo } from "../helpers/stream_info";
import { VideoStreamInfo } from "../helpers/video";
import { VideoOnlyStreamInfo } from "../helpers/video_only_stream_info";
import PageAPI from "../videos/page";

export const resolve_cookies = (cookies: string[]) => {
    const cookiesexp = /(?:^|,)(\w.+?)=(.*?);/g;
    let temp: string[] = [];
    for (const cook of cookies) {
        const cookiesmatchs = [...cook.matchAll(cookiesexp)];
        temp = [...temp, ...cookiesmatchs.map(e => (`${e[1]}=${e[2]}`))];
    }
    const finalcookiesstr = temp.join("; ");
    return finalcookiesstr;
}

export const exist = <T>(arr: T[], check: (e: T) => boolean): boolean => {
    for (const e of arr) {
        if (check(e)) return true;
    }
    return false;
}

export async function retry<T>(client?: BaseHttpClient, func?: () => Promise<T>, p0?: () => Promise<PageAPI>): Promise<T> {
    let retrycount = 5;
    let lastexception;
    while (true) {
        try {
            if (func) return await func();
        } catch (e) {
            if (client && client.closed) {
                throw 'YoutubeHttpClient connection closed manually!';
            }
            console.error(e);
            lastexception = e;
            retrycount -= 1;
            if (retrycount <= 0) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    throw lastexception;
}

export function extractjson(source: string, separator: string = ''): Record<any, any> | undefined {
    // Find index offset based on the separator
    const index = source.indexOf(separator) + separator.length;

    // If separator was provided but isn't found, indexOf returns -1, making index = length of separator
    if (index > source.length || (separator.length > 0 && source.indexOf(separator) === -1)) {
        return undefined;
    }

    // Slice down the string starting past our separator boundary
    const str = source.substring(index);

    const startIdx = str.indexOf('{');
    let endIdx = str.lastIndexOf('}');

    // If there are no brackets at all, it's not valid JSON
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        return undefined;
    }

    while (true) {
        try {
            const jsonSubstring = str.substring(startIdx, endIdx + 1);

            // JSON.parse throws a SyntaxError if formatting is broken (equivalent to Dart's FormatException)
            return JSON.parse(jsonSubstring) as Record<any, any>;
        } catch (error) {
            if (error instanceof SyntaxError) {
                // Re-evaluate the string to find the *previous* occurrences of the closing bracket '}'
                // Dart: str.lastIndexOf(str.substring(0, endIdx))
                endIdx = str.substring(0, endIdx).lastIndexOf('}');

                // If we hit the beginning or no more matching closing curly braces exist, extraction failed
                if (endIdx <= 0 || endIdx <= startIdx) {
                    return undefined;
                }
            } else {
                // Re-throw unexpected runtime execution errors
                throw error;
            }
        }
    }
}

export const stripNoneDigit = (input: string) => input.replace(/\D/g, "");

export function extractgenericdata<T>(scripts: string[], match: string[], builder: (root: Record<string, any>) => T): T {
    let initialdata: Record<any, any> | undefined = undefined;
    for (const m of match) {
        const script = scripts.find(e => e.includes(m));
        if (script) {
            initialdata = extractjson(script, m);
            if (initialdata) {
                return builder(initialdata);
            }
        }
    }
    console.error("Cannot extract generic data!");
    throw 'cannot extract generic data!';
}

export function getjson<T>(value?: Record<string, any>, jsonpath?: string): T | undefined {
    if (!value) return undefined;
    if (!jsonpath) return value as T;
    const parts = jsonpath.split('/');
    for (const part of parts) {
        if (value) {
            if (Object.getOwnPropertyNames(value)) {
                value = value![part];
            } else if (Array.isArray(value)) {
                let index = parseInt(part);
                if (isNaN(index)) {
                    return undefined;
                }
                if (index >= value.length) {
                    return undefined;
                }
                value = value[index];
            } else {
                return undefined;
            }
        }
    }
    return value as T;
}

export function wrapformatexception<T>(name: string, value: string, body: () => T): T {
    try {
        return body();
    } catch (error: any) {
        throw new Error(`Invalid ${name} "${value}": ${error.message || error}`);
    }
}

export async function asyncgeneratortoarray<T>(generator: AsyncGenerator<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of generator) {
        items.push(item);
    }
    return items;
}

// ============================================================================
// Specialized Type Guards (Replicating Dart's .whereType<T> Lookups)
// ============================================================================

export function isAudioStream(s: StreamInfo): s is AudioStreamInfo {
    return 'audioCodec' in s;
}

export function isVideoStream(s: StreamInfo): s is VideoStreamInfo {
    return 'videoCodec' in s;
}

export function isMuxedStream(s: StreamInfo): s is MuxedStreamInfo {
    return s instanceof MuxedStreamInfo;
}

export function isAudioOnlyStream(s: StreamInfo): s is AudioOnlyStreamInfo {
    return s instanceof AudioOnlyStreamInfo;
}

export function isVideoOnlyStream(s: StreamInfo): s is VideoOnlyStreamInfo {
    return s instanceof VideoOnlyStreamInfo;
}

export function isHlsStream(s: StreamInfo): s is HlsStreamInfo {
    return 'audioItag' in s || s.url.pathname.includes('hls');
}