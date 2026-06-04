export default class YoutubeAPIClient {
    constructor(public payload: Record<string, any>, public apiurl: string, public headers?: Record<string, any>) { }

    static fromjson(json: Record<any, any>): YoutubeAPIClient {
        return new YoutubeAPIClient(json.payload, json.apiurl, json.headers);
    }

    get tojson(): Record<string, any> {
        return {
            payload: this.payload,
            apiurl: this.apiurl,
            headers: this.headers,
        }
    }

    static iOS = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'IOS',
                'clientVersion': '20.10.4',
                'deviceMake': 'Apple',
                'deviceModel': 'iPhone16,2',
                'userAgent': 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
                'hl': 'en',
                "platform": "MOBILE",
                'osName': 'IOS',
                'osVersion': '18.1.0.22B83',
                'timeZone': 'UTC',
                'gl': 'US',
                'utcOffsetMinutes': 0
            }
        },
    }, 'https://www.youtube.com/youtubei/v1/player?key=AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc&prettyPrint=false');

    static Android = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'ANDROID',
                'clientVersion': '20.10.38',
                'androidSdkVersion': 30,
                'userAgent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
                'osName': 'Android',
                'osVersion': '11',
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

    static AndroidSdkless = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'ANDROID',
                'clientVersion': '20.10.38',
                'userAgent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
                'osName': 'Android',
                'osVersion': '11',
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

    static AndroidMusic = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'ANDROID_MUSIC',
                'clientVersion': '2.16.032',
                'androidSdkVersion': 31,
                'userAgent': 'com.google.android.youtube/19.29.1  (Linux; U; Android 11) gzip',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
            },
        },
    }, 'https://music.youtube.com/youtubei/v1/player?key=AIzaSyAOghZGza2MQSZkY_zfZ370N-PUdXEo8AI&prettyPrint=false');

    static AndroidVr = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'ANDROID_VR',
                'clientVersion': '1.56.21',
                'deviceModel': 'Quest 3',
                'osVersion': '12',
                'osName': 'Android',
                'androidSdkVersion': '32',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

    static Safari = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'WEB',
                'clientVersion': '2.20250312.04.00',
                'userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15,gzip(gfe)',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

    static TV = new YoutubeAPIClient({
        'context': {
            'client': {
                "deviceMake": "",
                "deviceModel": "",
                "userAgent": "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version,gzip(gfe)",
                'clientName': 'TVHTML5',
                "clientVersion": "7.20251105.10.00",
                'hl': 'en',
                'timeZone': 'UTC',
                'gl': 'US',
                'utcOffsetMinutes': 0,
                "originalUrl": "https://www.youtube.com/tv",
                "theme": "CLASSIC",
                "platform": "DESKTOP",
                "clientFormFactor": "UNKNOWN_FORM_FACTOR",
                "webpSupport": false,
                "configInfo": {},
                "tvAppInfo": { "appQuality": "TV_APP_QUALITY_FULL_ANIMATION" },
                "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            "user": { "lockedSafetyMode": false },
            "request": { "useSsl": true },
        },
        "contentCheckOk": true,
        "racyCheckOk": true,
    },
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
            'Sec-Fetch-Mode': 'navigate',
            'Content-Type': 'application/json',
            'Origin': 'https://www.youtube.com',
        });


    static MediaConnect = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'MEDIA_CONNECT_FRONTEND',
                'clientVersion': '0.1',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

    static MWEB = new YoutubeAPIClient({
        'context': {
            'client': {
                'clientName': 'MWEB',
                'clientVersion': '2.20240726.01.00',
                'hl': 'en',
                'timeZone': 'UTC',
                'utcOffsetMinutes': 0,
            },
        },
    }, 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
}