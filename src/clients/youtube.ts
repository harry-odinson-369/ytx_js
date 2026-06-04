import BaseHttpClient, { HttpValidateStatus } from "./base";
import fs from "fs";
import fspromise from "fs/promises";
import path from "path";
import { retry } from "../utils/utils";
import { AxiosResponse } from "axios";

export default class YoutubeHttpClient extends BaseHttpClient {
    constructor() {
        super(undefined, undefined, YoutubeHttpClient.defaultheaders);
    }

    isCookieLoaded: boolean = false;

    static get defaultheaders(): Record<string, string> {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.18 Safari/537.36',
            'Cookie': 'CONSENT=YES+cb; PREF=hl=en&tz=UTC; SOCS=CAI; GPS=1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        };
    }

    static sendaction(client: BaseHttpClient, action: "next" | "browse" | "search", data?: Record<string, any>, headers?: Record<string, any>): Promise<Record<any, any>> {
        const url = `https://www.youtube.com/youtubei/v1/${action}?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;
        const body = {
            context: {
                client: {
                    browserName: 'Chrome',
                    browserVersion: '105.0.0.0',
                    clientFormFactor: 'UNKNOWN_FORM_FACTOR',
                    clientName: "WEB",
                    clientVersion: "2.20220921.00.00",
                },
            },
            ...(data ?? {}),
        };
        return retry(client, async () => {
            const extra = {
                "Referer": "https://www.youtube.com/",
                "Origin": "www.youtube.com",
                "Content-Type": "application/json; charset=UTF-8",
                ...(headers ?? {})
            };
            const resp = await client.post(url, body, extra);
            if (client.closed) throw new Error(`The request could not be completed because the http-client was closed.`);
            return resp.data;
        });
    }

    private async loadcookies(): Promise<void> {
        if (this.isCookieLoaded) return;
        if (fs.existsSync(this.cookiesfile())) {
            const result = await fspromise.readFile(this.cookiesfile(), 'utf-8');
            await super.setcookies(result, 'www.youtube.com');
        }
        this.isCookieLoaded = true;
    }

    get cwd(): string { return path.join(process.cwd(), '.cookies'); }
    cookiesfile(host?: string): string { return path.join(this.cwd, (host ?? 'www.youtube.com')); }

    override async setcookies(cookies: string[] | string, host?: string): Promise<string> {
        const result = await super.setcookies(cookies, host);
        if (!fs.existsSync(this.cwd)) fs.mkdirSync(this.cwd, { recursive: true });
        await fspromise.writeFile(this.cookiesfile(host), result);
        return result;
    }

    override async head(url: string, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        await this.loadcookies();
        return super.head(url, headers, validate);
    }

    override async get(url: string, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        await this.loadcookies();
        return super.get(url, headers, validate);
    }

    override async post(url: string, data?: any, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        await this.loadcookies();
        return super.post(url, data, headers, validate);
    }

}