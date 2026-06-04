import BaseHttpClient from "../clients/base";

export async function getcontentlength(client: BaseHttpClient, url: string, headers?: Record<string, any>): Promise<number | undefined> {
    const resp = await client.head(url, headers);
    if (resp && resp.headers) {
        const contentlength = {...resp.headers}['content-length'];
        if (contentlength) return parseInt(contentlength.toString());
    }
    return undefined;
}