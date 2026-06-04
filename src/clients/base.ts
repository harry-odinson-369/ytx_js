import axios, { AxiosInstance, AxiosResponse } from "axios";
import { exist, resolve_cookies } from "../utils/utils";

export type HttpValidateStatus = (status: number) => boolean;
export type OnCookieUpdate = (cookies: string, host?: string) => void;

export default class BaseHttpClient {
    constructor(client?: AxiosInstance, signal?: AbortController, headers?: Record<string, any>) {
        this.addheaders(headers);
        this._client = client || axios.create();
        this._signal = signal || new AbortController();
    }

    private _client: AxiosInstance;
    private _signal: AbortController;
    private _closed: boolean = false;
    cookies: string = "";
    mergeheaders: boolean = true;
    oncookiesupdate?: OnCookieUpdate;
    private _headers: Record<string, any> | undefined = undefined;

    get closed(): boolean { return this._closed; }
    get headers(): Record<string, any> | undefined {
        if (!this._headers && !this.cookies) return undefined;
        let record = (this._headers ?? {});
        if (this.cookies) record["Cookie"] = this.cookies;
        return record;
    }

    addheaders(extra?: Record<string, any>) {
        if (!extra) return;
        this._headers = { ...(this._headers ?? {}), ...extra };
        if (this._headers) {
            const cookies = this._headers["Cookie"] || this._headers["cookie"];
            if (cookies) {
                this.setcookies(cookies);
                delete this._headers["Cookie"];
                delete this._headers["cookie"];
            }
        }
    }

    async setcookies(cookies: string[] | string, host?: string): Promise<string> {
        let temp = Array.isArray(cookies) ? resolve_cookies(cookies) : cookies;
        if (this.cookies.trim() !== "") {
            let oldcookies = this.cookies.split("; ");
            let newcookies = temp.split("; ");
            for (const cook of newcookies) {
                const key = cook.split("=")[0];
                const isExist = exist(oldcookies, (e) => e.startsWith(key));
                if (isExist) {
                    oldcookies = oldcookies.filter(e => !e.startsWith(key));
                }
            }
            oldcookies = [...oldcookies, ...newcookies];
            this.cookies = oldcookies.join("; ");
        } else {
            this.cookies = temp;
        }
        if (this.oncookiesupdate) this.oncookiesupdate(this.cookies, host);
        return this.cookies;
    }

    private _getheaders = (headers?: Record<string, any> | null) => {
        if (headers === null) return undefined;
        if (!this.mergeheaders) return headers;
        return { ...this.headers, ...(headers ?? {}) };
    }

    async head(url: string, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        const validateStatus = validate ?? (() => true);
        return this._client.head(url, { headers: this._getheaders(headers), validateStatus });
    }

    async get(url: string, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        const validateStatus = validate ?? (() => true);
        const response = await this._client.get(url, { headers: this._getheaders(headers), validateStatus, signal: this._signal.signal });
        const cookies = response.headers["set-cookie"];
        if (cookies) await this.setcookies(cookies, new URL(url).host);
        return response;
    }

    async post(url: string, data?: any, headers?: Record<string, any> | null, validate?: HttpValidateStatus): Promise<AxiosResponse> {
        const validateStatus = validate ?? (() => true);
        const response = await this._client.post(url, data, { headers: this._getheaders(headers), validateStatus, signal: this._signal.signal });
        const cookies = response.headers["set-cookie"];
        if (cookies) await this.setcookies(cookies, new URL(url).host);
        return response;
    }

    close() {
        this._closed = true;
        this._signal.abort();
    }
}