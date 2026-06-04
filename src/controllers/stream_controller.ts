import BaseHttpClient from "../clients/base";
import { DashManifest } from "../helpers/dash_manifest";
import { HlsManifest } from "../helpers/hls_manifest";
import { VideoController } from "./video_controller";

export class StreamController extends VideoController {
    constructor(httpclient: BaseHttpClient) { super(httpclient); };


    async getDashManifest(url: string): Promise<DashManifest | undefined> {
        return DashManifest.request(this.httpClient, url);
    }

    async getHlsManifest(url: string): Promise<HlsManifest | undefined> {
        return HlsManifest.request(this.httpClient, url);
    }

}