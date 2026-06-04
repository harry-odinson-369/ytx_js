import BaseHttpClient from "../clients/base";
import PageAPI from "../videos/page";
import { PlayerResponse } from "../videos/player_response";
import YoutubeAPIClient from "../utils/clients";

export class VideoController {

    protected readonly httpClient: BaseHttpClient;

    private _visitorData?: string = undefined;

    constructor(httpClient: BaseHttpClient) {
        this.httpClient = httpClient;
    }

    /**
     * Dispatches an authenticated or anonymous POST request to YouTube's InnerTube API backend.
     */
    public async getPlayerResponse(
        videoId: string,
        client: YoutubeAPIClient,
        watchpage?: PageAPI,
    ): Promise<PlayerResponse> {
        const payload = client.payload;

        // Replicates Dart: assert(payload['context'] != null, ...)
        if (!payload || !payload['context']) {
            throw new Error('AssertionError: client must contain a context object framework descriptor.');
        }
        if (!payload['context']['client']) {
            throw new Error('AssertionError: client must contain a context.client definition configuration.');
        }

        const userAgent = payload['context']['client']['userAgent'] as string | undefined;
        const ytCfg = watchpage?.getytcfg();

        const body: Record<string, any> = {
            ...payload,
            videoId: videoId,
            ...(ytCfg && 'STS' in ytCfg
                ? {
                    playbackContext: {
                        contentPlaybackContext: {
                            html5Preference: 'HTML5_PREF_WANTS',
                            signatureTimestamp: String(ytCfg['STS']),
                        },
                    },
                }
                : {}),
        };

        if (body['context']['client']['clientName'] === 'IOS') {
            body['context']['client']['visitorData'] = await this._extractVisitorData(client);
        }

        // Dynamic headers assembly block matching the original HTTP handshake
        let headers: Record<string, string> = {
            ...(userAgent ? { 'User-Agent': userAgent } : {}),
            'X-Youtube-Client-Name': String(payload['context']['client']['clientName']),
            'X-Youtube-Client-Version': String(payload['context']['client']['clientVersion']),
            ...(ytCfg?.['INNERTUBE_CONTEXT']?.['client']?.['visitorData']
                ? { 'X-Goog-Visitor-Id': String(ytCfg['INNERTUBE_CONTEXT']['client']['visitorData']) }
                : {}),
            'Origin': 'https://www.youtube.com',
            'Sec-Fetch-Mode': 'navigate',
            'Content-Type': 'application/json',
            ...(watchpage?.cookiesstring ? { 'Cookie': watchpage.cookiesstring } : {}),
            ...(client.headers ?? {}),
        };

        const resp = await this.httpClient.post(client.apiurl, body, headers);

        return new PlayerResponse(resp.data);
    }

    /**
     * Safely scraps visitor data strings out of YouTube's service worker asset script.
     */
    private async _extractVisitorData(
        client: YoutubeAPIClient
    ): Promise<String> {
        if (this._visitorData) return this._visitorData;

        let response = await this.httpClient.get('https://www.youtube.com/sw.js_data', {
            headers: {
                'User-Agent': String(client.payload['context']['client']['userAgent']),
                'Content-Type': 'application/json',
            },
        });

        let result = response.data;

        if (typeof result !== "string") {
            result = JSON.stringify(result);
        }

        // Sanitizes anti-hijack/JSON vulnerability protection token arrays if present
        if (result.startsWith(")]}'")) {
            result = result.substring(4);
        }

        const data = JSON.parse(result) as any[];

        // Uses structural optional chaining (?.[]) to safely reach the required nested index string
        const value = data?.[0]?.[2]?.[0]?.[0]?.[13];
        if (typeof value !== 'string') {
            throw new Error('FormatError: Failed to trace a valid visitorData configuration index node.');
        }

        this._visitorData = value;
        return this._visitorData;
    }
}