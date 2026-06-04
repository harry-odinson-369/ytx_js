import { getjson, stripNoneDigit } from "../utils/utils";
import { MusicData } from "./video_info";

export default class InitialData {
    constructor(public root: Record<string, any>) { }

    get likescount(): number | undefined { return this._getLikes() }
    get dislikescount(): number | undefined { return this._getDisLikes() }

    _getLikes() {
        if (this.root['contents']) {
            const contents = getjson<any[]>(this.root, 'contents/twoColumnWatchNextResults/results/results/contents');
            const primaryInfo = contents?.find((e) => e['videoPrimaryInfoRenderer']) as (Record<any, any> | undefined);
            const topLevelButtons = getjson<any[]>(primaryInfo, 'videoPrimaryInfoRenderer/videoActions/menuRenderer/topLevelButtons');
            if (!topLevelButtons) return undefined;
            const likes = getjson<string>(topLevelButtons[0], 'segmentedLikeDislikeButtonViewModel/likeButtonViewModel/likeButtonViewModel/toggleButtonViewModel/toggleButtonViewModel/defaultButtonViewModel/buttonViewModel/accessibilityText') ?? getjson<string>((topLevelButtons.find((e) => e['toggleButtonRenderer'] != null)), 'toggleButtonRenderer/defaultText/accessibility/accessibilityData/label');
            return parseInt(stripNoneDigit((likes ?? "0")));
        }
        return undefined;
    }

    _getDisLikes() {
        if (this.root['contents']) {
            const contents = getjson<any[]>(this.root, 'contents/twoColumnWatchNextResults/results/results/contents');
            const primaryInfo = contents?.find((e) => e['videoPrimaryInfoRenderer']) as Record<any, any> | undefined;
            const topLevelButtons = getjson<any[]>(primaryInfo, 'videoPrimaryInfoRenderer/videoActions/menuRenderer/topLevelButtons');
            const likes = getjson<string>(topLevelButtons?.filter((e) => e['toggleButtonRenderer'])[1], 'toggleButtonRenderer/defaultText/accessibility/accessibilityData/label');
            return parseInt(stripNoneDigit((likes ?? "0")));
        }
        return undefined;
    }

    getmusicdata(): MusicData[] | undefined {
        const panels = getjson<any[]>(this.root, 'engagementPanels');
        const section = panels?.find(e => e['engagementPanelSectionListRenderer'] && e["engagementPanelSectionListRenderer"]["panelIdentifier"] === "engagement-panel-structured-description") as Record<any, any> | undefined;
        const items = getjson<any[]>(section, 'engagementPanelSectionListRenderer/content/structuredDescriptionContentRenderer/items');
        const cardarr = items?.find((e) => e['horizontalCardListRenderer']) as Record<any, any> | undefined;
        const cards = getjson<any[]>(cardarr, 'horizontalCardListRenderer/cards');
        const videoattrviewmodel = cards?.map(e => getjson<Record<any, any>>(e, 'videoAttributeViewModel'));
        return videoattrviewmodel?.map(e => ({
            song: e?.title,
            artist: e?.subtitle,
            album: getjson<string>(e, 'secondarySubtitle/content'),
            image: getjson<string>(e, 'image/sources/0/url'),
        }));
    }

    getrelatedvideoscontent(): Record<string, any>[] | undefined {
        const results = this.root.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results as Record<string, any>[] | undefined;
        if (!results) return undefined;

        for (const item of results) {
            const contents = item.itemSectionRenderer?.contents as Record<string, any>[] | undefined;
            if (contents) return contents;
        }

        return results;
    }
}