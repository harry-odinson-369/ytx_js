import BaseHttpClient from "../clients/base";
import YoutubeHttpClient from "../clients/youtube";
import { BasePagedArray } from "../utils/array";
import { getjson, retry, stripNoneDigit } from "../utils/utils";
import PageAPI from "./page";
import { ChannelId, Engagement, ThumbnailSet, VideoInfo } from "./video_info";

export class RelatedVideosAPI {
    constructor(public contents: Record<string, any>[], public client: BaseHttpClient) { }

    get relatedvideos(): VideoInfo[] { return [...this._relatedvideos()] }

    private * _relatedvideos(): Generator<VideoInfo, void, unknown> {
        for (const video of this.contents) {
            let result: VideoInfo | undefined;
            if (video.compactVideoRenderer) {
                result = this._parsecompactvideo(video.compactVideoRenderer);
            } else if (video.lockupViewModel) {
                result = this._parselockupview(video.lockupViewModel);
            }
            if (result) yield result;
        }
    }

    private _parselockupview(data: Record<string, any>): VideoInfo | undefined {
        const videoId = getjson<string>(data, 'rendererContext/commandContext/onTap/innertubeCommand/watchEndpoint/videoId');
        const title = getjson<string>(data, 'metadata/lockupMetadataViewModel/title/content');
        const channelid = getjson<string>(data, 'metadata/lockupMetadataViewModel/image/decoratedAvatarViewModel/rendererContext/commandContext/onTap/innertubeCommand/browseEndpoint/browseId');

        if (!videoId || !title || !channelid) return undefined;

        const duration = getjson<string>(data, 'contentImage/thumbnailViewModel/overlays/0/thumbnailOverlayBadgeViewModel/thumbnailBadges/0/thumbnailBadgeViewModel/text');
        const uploaddate = getjson<string>(data, 'metadata/lockupMetadataViewModel/metadata/contentMetadataViewModel/metadataRows/1/metadataParts/1/text/content');
        const viewstext = getjson<string>(data, 'metadata/lockupMetadataViewModel/metadata/contentMetadataViewModel/metadataRows/1/metadataParts/0/text/content');
        const author = getjson<string>(data, 'metadata/lockupMetadataViewModel/metadata/contentMetadataViewModel/metadataRows/0/metadataParts/0/text/content');

        const views = parseInt(stripNoneDigit(viewstext ?? "0"));

        return new VideoInfo(
            videoId,
            title,
            author ?? "",
            new ChannelId(channelid),
            uploaddate ?? "",
            uploaddate ?? "",
            '',
            parseInt(duration ?? '0'),
            new ThumbnailSet(videoId),
            [],
            new Engagement(views, 0, 0),
            false,
        );
    }

    private _parsecompactvideo(data: Record<string, any>): VideoInfo | undefined {
        const videoId = data.videoId;
        const title = data.title?.simpleText;
        const runs = data.longBylineText?.runs;
        const author = runs ? runs[0].text : undefined;
        const channelid = runs ? runs[0].navigationEndpoint?.browseEndpoint?.browseId : undefined;

        if (!videoId || !title || !author || !channelid) return undefined;

        const uploaddate = data.publishedTimeText?.simpleText;
        const duration = data.lengthText?.simpleText;
        const viewcounttext = data.viewCountText?.simpleText;

        const views = parseInt(stripNoneDigit(viewcounttext ?? "0"));

        return new VideoInfo(
            videoId,
            title,
            author,
            new ChannelId(channelid),
            uploaddate,
            uploaddate,
            '',
            parseInt(duration),
            new ThumbnailSet(videoId),
            [],
            new Engagement(views, 0, 0),
            false,
        );
    }

    get getcontinuationtoken(): string | undefined {
        for (const item of this.contents) {
            const token = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ?? item.continuationItemRenderer?.button?.buttonRenderer?.command?.continuationCommand?.token;
            if (token != null) return token;
        }
        return undefined;
    }

    async nextpage(): Promise<RelatedVideosAPI | undefined> {
        const continuation = this.getcontinuationtoken;
        if (!continuation) return undefined;
        
        const response = await YoutubeHttpClient.sendaction(this.client, "next", { continuation }, {});
        if (!response) return;
        const actions = (response['onResponseReceivedEndpoints'] ?? response['onResponseReceivedActions']) as any[] | undefined;
        if (!actions) return undefined;

        for (const action of actions) {
            const continuationitems = action.appendContinuationItemsAction?.continuationItems as any[] | undefined;
            if (continuationitems) {
                return new RelatedVideosAPI(continuationitems, this.client);
            }
        }

        return undefined;
    }

    static async request(client: BaseHttpClient, video: VideoInfo): Promise<RelatedVideosAPI | undefined> {
        const page = video.page ?? await retry(client, () => PageAPI.request(client, video.id));
        const contents = page?.initialdata.getrelatedvideoscontent();
        if (!contents) return undefined;
        return new RelatedVideosAPI(contents, client);
    }
}

export default class RelatedVideosArray extends BasePagedArray<VideoInfo> {
    constructor(base: Array<VideoInfo>, public api: RelatedVideosAPI) { super(base) }

    override async nextpage(): Promise<RelatedVideosArray | undefined> {
        const page = await this.api.nextpage();
        if (!page) return undefined;
        return new RelatedVideosArray(page.relatedvideos, page);
    }
}