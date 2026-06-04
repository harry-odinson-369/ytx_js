import parse, { HTMLElement } from "node-html-parser";
import BaseHttpClient from "../clients/base";
import { extractgenericdata, extractjson, resolve_cookies, retry, stripNoneDigit } from "../utils/utils";
import { PlayerResponse } from "./player_response";
import PlayerConfig from "./player_config";
import InitialData from "./initial_data";
import { writeFile } from "fs";

export default class PageAPI {

    private constructor(
        html: string,
        id: string,
        client: BaseHttpClient,
        cookies: string,
    ) {
        this.videoId = id;
        this.client = client;
        this.cookiesstring = cookies;
        this.root = parse(html);
        this.initialdata = this.getinitialdata();
    }

    root: HTMLElement;
    videoId: string;
    cookiesstring: string;
    client: BaseHttpClient;

    initialdata: InitialData;

    get isok() {
        return this.root.querySelector('#player') !== null;
    }

    get isvideoavailable() {
        return this.root.querySelector('meta[property="og:url"]') != null;
    }

    get videolikescount(): number {
        const initiallikescount = this.initialdata.likescount;
        if (initiallikescount) {
            return initiallikescount;
        }
        const likesexp = /"label"\s*:\s*"([\d,\.]+) likes"/;
        const matchs = this.root.outerHTML.match(likesexp);
        if (matchs && matchs[1]) {
            return parseInt(stripNoneDigit(matchs[1]));
        }
        const likebtnrenderer = this.root.querySelector('.like-button-renderer-like-button')?.text;
        if (likebtnrenderer) {
            return parseInt(stripNoneDigit(likebtnrenderer));
        }
        return 0;
    }

    get videodislikescount(): number {
        const initialdislikescount = this.initialdata.dislikescount;
        if (initialdislikescount) {
            return initialdislikescount;
        }
        const dislikesexp = /"label"\s*:\s*"([\d,\.]+) dislikes"/;
        const matchs = this.root.outerHTML.match(dislikesexp);
        if (matchs && matchs[1]) {
            return parseInt(stripNoneDigit(matchs[1]));
        }
        const dislikesbtnrenderer = this.root.querySelector(".like-button-renderer-dislike-button")?.text;
        if (dislikesbtnrenderer) {
            return parseInt(stripNoneDigit(dislikesbtnrenderer));
        }
        return 0;
    }

    get sourceurl() {
        const url = this.root
            .querySelectorAll('script')
            .map((e) => (e.attributes['src'] || ""))
            .find((e) => (e.includes('player_ias') || e.includes('player_es6')) && e.endsWith('.js'));
        if (!url) return undefined;
        return `https://youtube.com${url}`;
    }

    get playerresponse() {
        const scripts = this.root.querySelectorAll('script').map(e => e.text);
        return extractgenericdata(scripts, ['var ytInitialPlayerResponse = '], (root) => new PlayerResponse(root));
    }

    get playerconfig() {
        const regex = /ytplayer\.config\s*=\s*(\{.*\})/;
        const match = this.root.getElementsByTagName("html")[0].text.match(regex);
        if (match && match[1]) {
            const json = extractjson(match[1], '');
            if (json) return new PlayerConfig(json);
        }
    }

    getytcfg(): Record<string, any> {
        const regex = /ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/;
        const matchs = this.root.outerHTML.match(regex);
        if (matchs && matchs[1]) return JSON.parse(matchs[1]);
        return {};
    }

    getinitialdata(root?: HTMLElement) {
        const scripts = (root ?? this.root).querySelectorAll('script').map((e) => e.text);
        return extractgenericdata(scripts, ['var ytInitialData = ', 'window["ytInitialData"] ='], (root) => new InitialData(root));
    }

    static resolve_url = (videoId: string) => (`https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999&has_verified=1&hl=en`);

    static async request(client: BaseHttpClient, videoId: string): Promise<PageAPI> {
        return retry(client, async () => {
            const response = await client.get(PageAPI.resolve_url(videoId));
            writeFile('resp.json', JSON.stringify(response?.headers), () => {});
            if (!response) throw "Unexpected error occurred while fetching watch page!";
            if (response.status !== 200) throw 'Failed to fetch watch page!';
            const html = typeof response?.data === 'string' ? response?.data : JSON.stringify(response.data);
            const result = new PageAPI(html, videoId, client, resolve_cookies(response.headers["set-cookie"] ?? []));

            if (!result.isok) {
                throw 'Video watch page is broken.';
            }
            if (!result.isvideoavailable) {
                throw "Video unavailable!";
            }

            return result;
        });
    }
}