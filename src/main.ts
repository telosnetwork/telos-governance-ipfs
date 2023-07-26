import {APIClient} from "@greymass/eosio";
import {PinnerConfig} from "./types/config.js";
import {readFileSync} from "fs";

import {getAmendCids} from "./sources/amend.js"


export default class Pinner {
    private config: PinnerConfig
    private apiClient: APIClient

    constructor() {
        this.config = this.readConfig()
        this.apiClient = new APIClient({url: this.config.apiEndpoint, fetch})
    }

    private readConfig(): PinnerConfig {
        const configJson = readFileSync("../config.json", "utf-8")
        return JSON.parse(configJson) as PinnerConfig
    }

    async fetchAndPin() {
        const cids: Set<string> = await this.fetchCIDs()
        console.dir(cids)
    }

    private async fetchCIDs(): Promise<Set<string>> {
        const cids: Set<string> = new Set<string>()
        this.appendToCids(cids, await getAmendCids(this.apiClient))
        return cids;
    }

    private appendToCids(cidCollection: Set<string>, cidsToAppend: Set<string>) {
        for (let cid of cidsToAppend) {
            cidCollection.add(cid)
        }
    }

}

const pinner = new Pinner()
pinner.fetchAndPin()
