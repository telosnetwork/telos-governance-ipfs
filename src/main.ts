import {APIClient} from "@greymass/eosio";
import {PinnerConfig} from "./types/config.js";
import {readFileSync} from "fs";

import {getAmendCids} from "./sources/amend.js"
import axios, {AxiosInstance} from "axios";


export default class Pinner {
    private config: PinnerConfig
    private apiClient: APIClient
    private ipfsClient: AxiosInstance;

    constructor() {
        this.config = this.readConfig()
        this.apiClient = new APIClient({url: this.config.apiEndpoint, fetch})
        this.ipfsClient = axios.create({
            baseURL: this.config.ipfsEndpoint
        })
    }

    private readConfig(): PinnerConfig {
        const configJson = readFileSync("../config.json", "utf-8")
        return JSON.parse(configJson) as PinnerConfig
    }

    async fetchAndPin() {
        const cids: Set<string> = await this.fetchCIDs()
        await this.pinCIDs(cids)
    }

    private async pinCIDs(cids: Set<string>) {
        for (const cid of cids) {
            const pinResult = await this.ipfsClient.post(`/api/v0/pin/add?arg=${cid}`)
            console.log(`Pin result for ${cid}: ${JSON.stringify(pinResult.data)}`)
        }
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
