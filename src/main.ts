import {APIClient} from "@greymass/eosio";
import {PinnerConfig} from "./types/config.js";
import {readFileSync} from "fs";
import { CID } from 'multiformats/cid'
import {getAmendCids} from "./sources/amend.js"
import axios, {AxiosInstance} from "axios";


export default class Pinner {
    private config: PinnerConfig
    private apiClient: APIClient
    private ipfsClients: AxiosInstance[];

    constructor() {
        this.config = this.readConfig()
        this.apiClient = new APIClient({url: this.config.apiEndpoint, fetch})
        this.ipfsClients = this.config.ipfsEndpoints.map(endpoint => axios.create({ baseURL: endpoint }));
    }

    private readConfig(): PinnerConfig {
        const configJson = readFileSync("./config.json", "utf-8")
        return JSON.parse(configJson) as PinnerConfig
    }

    private async checkEndpoint(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.config.apiEndpoint}/v1/chain/get_info`);
            if (response.status === 200) {
                console.log("API Endpoint is valid");
                return true;
            } else {
                console.log("API Endpoint is invalid");
                return false;
            }
        } catch (error:any) {
            console.error(`Error with API Endpoint: ${error.message}`);
            return false;
        }
    }
    
    
    async fetchAndPin() {
        console.log("Starting fetchAndPin");
        if (await this.checkEndpoint()) {
            const cids: Set<string> = await this.fetchCIDs();
            console.log("Fetched CIDs:", cids);
            await this.pinCIDs(cids);
        } else {
            console.error("Cannot start fetchAndPin, the API endpoint is not valid.");
        }
    }

    private async pinCIDs(cids: Set<string>) {
        for (const cid of cids) {
            for (const [index, ipfsClient] of this.ipfsClients.entries()) { // get the index for logging
                console.log(`Pinning CID: ${cid} to IPFS endpoint: ${this.config.ipfsEndpoints[index]}`); // log the endpoint
                
                try {
                    await Promise.race([
                        ipfsClient.post(`/api/v0/pin/add?arg=${cid}`),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000))
                    ]);
                    console.log(`Successfully pinned CID: ${cid} to IPFS endpoint: ${this.config.ipfsEndpoints[index]}`); // log the successful pin
                } catch (error:any) {
                    console.log(`Error pinning CID ${cid} to IPFS endpoint: ${this.config.ipfsEndpoints[index]}: ${error.message}`); // log the endpoint with the error
                }
            }
        }
    }
    
    

    private async fetchCIDs(): Promise<Set<string>> {
        console.log("Fetching CIDs");
        const cids: Set<string> = new Set<string>()
        this.appendToCids(cids, await getAmendCids(this.apiClient))
        return cids;
    }

    private isValidCID(cid: string): boolean {
        try {
            CID.parse(cid);
            return true;
        } catch (err) {
            console.error(`Invalid CID: ${cid}`);
            return false;
        }
    }
    
    private appendToCids(cidCollection: Set<string>, cidsToAppend: Set<string>) {
        console.log("Appending CIDs");
        for (let value of cidsToAppend) {
            const cid = this.getCid(value);
            if (this.isValidCID(cid)) {
                cidCollection.add(cid);
            } else {
                console.log(`Invalid CID: ${cid}`);
            }
        }
    }
    

    private getCid(value: string): string {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const match = value.match(urlPattern);
        if (match) {
            const urlParts = match[0].split('/');
            return urlParts[urlParts.length - 1];
        } else {
            return value;
        }
    }

}

const pinner = new Pinner()
function startPinning() {
    pinner.fetchAndPin().finally(() => {
        setTimeout(startPinning, 15 * 60 * 1000);  // Restart the process every 15 minutes
    });
}

startPinning();
