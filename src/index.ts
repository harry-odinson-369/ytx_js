import BaseHttpClient from "./clients/base";
import YoutubeHttpClient from "./clients/youtube";
import { getvideoid } from "./utils/url";
import PageAPI from "./videos/page";
import { VideoInfo } from "./videos/video_info";

export default class YTXJS {
    constructor(public client: BaseHttpClient) { }

    private static _instance: YTXJS | undefined = undefined;
    public static get DEFAULT(): YTXJS {
        if (!this._instance) {
            const defclient = new YoutubeHttpClient();
            this._instance = new YTXJS(defclient);
        }
        return this._instance;
    }

    /**
     * 
     * @param input Its could be a YouTube video url or id.
     */
    async VIDEO_INFO(input: string): Promise<VideoInfo> {
        const page = await PageAPI.request(this.client, getvideoid(input));
        return VideoInfo.frompage(page);
    }
}