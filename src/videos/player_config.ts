import { getjson } from "../utils/utils";
import { PlayerResponse } from "./player_response";

export default class PlayerConfig {
    constructor(public root: Record<any, any>) { }

    get sourceurl(): string {
        return `https://youtube.com${getjson<string>(this.root, 'assets/js')}`;
    }

    get playerresponse(): PlayerResponse {
        return PlayerResponse.parse(getjson<string>(this.root, 'args/playerResponse') ?? '{}');
    }
}