import { DOMParser, Document, Element } from '@xmldom/xmldom';
import { retry } from '../utils/utils';
import BaseHttpClient from '../clients/base';
import { Fragment } from './fragment';
import { BaseStreamInfoProvider } from './stream_info_provider';
import { MediaType } from './media_type';
import { DashStreamInfoProvider } from './dash_stream_info_provider';

/**
 * Parsed representation contract for YouTube DASH stream collection manifest trees.
 */
export class DashManifest {
    private static readonly _urlSignatureExp = /\/s\/(.*?)(?:\/|$)/;

    private readonly _root: Document;
    private _streams: BaseStreamInfoProvider[] = [];

    constructor(root: Document) {
        this._root = root;
    }

    /**
     * Parses raw XML source configurations down into a structured Document DOM node tree.
     */
    public static parse(raw: string): DashManifest {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'text/xml');
        return new DashManifest(doc);
    }

    public static async request(httpClient: BaseHttpClient, url: string): Promise<DashManifest | undefined> {
        return retry(httpClient, async () => {
            const resp = await httpClient.get(url);
            let str: string | undefined = undefined;
            if (resp.data) {
                if (typeof resp.data === "string") {
                    str = resp.data;
                } else {
                    str = JSON.stringify(resp.data);
                }
            }
            if (str) return DashManifest.parse(str);
        });
    }

    public get streams(): BaseStreamInfoProvider[] {
        if (this._streams.length <= 0) {
            this._streams = this.parseMDP(this._root);
        }
        return this._streams;
    }

    public static getSignatureFromUrl(url: string): string | undefined {
        const match = DashManifest._urlSignatureExp.exec(url);
        return match ? match[1] : undefined;
    }

    private _isDrmProtected(element: Element): boolean {
        return element.getElementsByTagName('ContentProtection').length > 0;
    }

    private extractSegmentTimeline(source: Element): _SegmentTimeline | undefined {
        const segmentTimeline = this._getElement(source, 'SegmentTimeline');
        if (segmentTimeline) {
            const sElements = Array.from(segmentTimeline.getElementsByTagName('S'));
            const segments = sElements.map((e) => {
                const dAttr = e.getAttribute('d') ?? '0';
                const rAttr = e.getAttribute('r') ?? '0';
                return new _S(parseInt(dAttr, 10) || 0, parseInt(rAttr, 10) || 0);
            });
            return new _SegmentTimeline(segments);
        }
        return undefined;
    }

    private extractMultiSegmentInfo(element: Element, msParentInfo: _MsInfo): _MsInfo {
        const msInfo = msParentInfo.copy();
        const segmentList = this._getElement(element, 'SegmentList');

        if (segmentList) {
            msInfo.segmentTimeline = this.extractSegmentTimeline(segmentList) ?? msParentInfo.segmentTimeline;

            const initElement = this._getElement(segmentList, 'Initialization');
            msInfo.initializationUrl = initElement?.getAttribute('sourceURL') ?? undefined;

            const segmentUrlsSE = Array.from(segmentList.getElementsByTagName('SegmentURL'));
            if (segmentUrlsSE.length > 0) {
                msInfo.segmentUrls = segmentUrlsSE.map((segment) => segment.getAttribute('media')!);
            }
        }
        return msInfo;
    }

    private parseMDP(root: Document): BaseStreamInfoProvider[] {
        const documentElement = root.documentElement;
        if (documentElement && documentElement.getAttribute('type') === 'dynamic') {
            return [];
        }

        const formats: BaseStreamInfoProvider[] = [];
        const periods = Array.from(root.getElementsByTagName('Period'));

        for (const period of periods) {
            const periodMsInfo = this.extractMultiSegmentInfo(period, new _MsInfo());
            const adaptationSets = Array.from(period.getElementsByTagName('AdaptationSet'));

            for (const adaptationSet of adaptationSets) {
                if (this._isDrmProtected(adaptationSet)) {
                    continue;
                }

                const adaptationSetMsInfo = this.extractMultiSegmentInfo(adaptationSet, periodMsInfo);
                const representations = Array.from(adaptationSet.getElementsByTagName('Representation'));

                for (const representation of representations) {
                    if (this._isDrmProtected(representation)) {
                        continue;
                    }

                    const representationAttrib: Record<string, string> = {};

                    if (adaptationSet.attributes) {
                        for (let i = 0; i < adaptationSet.attributes.length; i++) {
                            const attr = adaptationSet.attributes[i];
                            if (attr.localName) representationAttrib[attr.localName] = attr.value;
                        }
                    }
                    if (representation.attributes) {
                        for (let i = 0; i < representation.attributes.length; i++) {
                            const attr = representation.attributes[i];
                            if (attr.localName) representationAttrib[attr.localName] = attr.value;
                        }
                    }

                    if (!representationAttrib['mimeType']) continue;
                    const mimeType = MediaType.parse(representationAttrib['mimeType']);

                    if (mimeType.type === 'video' || mimeType.type === 'audio') {
                        const combinedElements = [
                            ...Array.from(representation.childNodes),
                            ...Array.from(adaptationSet.childNodes),
                            ...Array.from(period.childNodes),
                            ...Array.from(root.childNodes),
                        ].filter((node): node is Element => node.nodeType === 1);

                        let baseUrl: string | undefined = undefined;
                        const httpRegex = /^https?:\/\//;

                        for (const el of combinedElements) {
                            const baseUrlE = this._getElement(el, 'BaseURL')?.textContent?.trim();
                            if (baseUrlE && httpRegex.test(baseUrlE)) {
                                baseUrl = baseUrlE;
                                break;
                            }
                        }

                        if (!baseUrl || !baseUrl.startsWith('http')) {
                            throw new Error(
                                'This kind of DASH Stream is not yet implemented. Please open a new issue on this project GitHub.'
                            );
                        }

                        const representationMsInfo = this.extractMultiSegmentInfo(representation, adaptationSetMsInfo);

                        if (representationMsInfo.segmentUrls && representationMsInfo.segmentTimeline) {
                            const localFragments: Fragment[] = [];
                            let segmentIndex = 0;

                            for (const s of representationMsInfo.segmentTimeline.segments) {
                                for (let i = 0; i < (s.r + 1); i++) {
                                    const segmentUri = representationMsInfo.segmentUrls[segmentIndex];
                                    if (httpRegex.test(segmentUri)) {
                                        throw new Error(
                                            'This kind of DASH Stream is not yet implemented. Please open a new issue on this project GitHub.'
                                        );
                                    }
                                    localFragments.push(new Fragment(segmentUri));
                                    segmentIndex++;
                                }
                            }
                            representationMsInfo.fragments = localFragments;
                        }

                        const fragments: Fragment[] = [];
                        if (representationMsInfo.fragments && representationMsInfo.initializationUrl) {
                            fragments.push(new Fragment(representationMsInfo.initializationUrl));
                        }
                        if (representationMsInfo.fragments) {
                            fragments.push(...representationMsInfo.fragments);
                        }

                        const width = parseInt(representationAttrib['width'] ?? '', 10);
                        const height = parseInt(representationAttrib['height'] ?? '', 10);
                        const frameRate = parseInt(representationAttrib['frameRate'] ?? '', 10);

                        formats.push(
                            new DashStreamInfoProvider(
                                parseInt(representationAttrib['id']!, 10),
                                baseUrl,
                                mimeType,
                                isNaN(width) ? undefined : width,
                                isNaN(height) ? undefined : height,
                                isNaN(frameRate) ? undefined : frameRate,
                                fragments,
                            )
                        );
                    }
                }
            }
        }

        return formats;
    }

    // Mini-helper utility to safely isolate child elements from within xmldom nodelists
    private _getElement(element: Element | Document, tagName: string): Element | undefined {
        const elements = element.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0] : undefined;
    }
}

class _SegmentTimeline {
    constructor(public readonly segments: _S[]) { }
}

class _S {
    constructor(public readonly d: number, public readonly r: number) { }
}

class _MsInfo {
    public startNumber: number = 1;
    public initializationUrl?: string;
    public segmentTimeline?: _SegmentTimeline;
    public segmentUrls?: string[];
    public fragments?: Fragment[];

    public copy(): _MsInfo {
        const v = new _MsInfo();
        v.initializationUrl = this.initializationUrl;
        v.segmentTimeline = this.segmentTimeline;
        v.segmentUrls = this.segmentUrls;
        v.fragments = this.fragments;
        v.startNumber = this.startNumber;
        return v;
    }
}