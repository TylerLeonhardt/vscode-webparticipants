import { CancellationToken, Memento } from "vscode";
import { ITfIdfCalculator, TfIdfCalculator, TfIdfDocument } from "./tfidf";
import { Page, crawl } from "./webCrawler";

export interface IWebsiteIndex {
    search(query: string, token: CancellationToken): Promise<string[]>;
}

export class WebsiteIndex implements IWebsiteIndex {
    private _tfidf: ITfIdfCalculator = new TfIdfCalculator();
    private _docs = new Map<string, TfIdfDocument>();

    private _loadPromise: Promise<void>;
    
    constructor(private _url: string, private storage: Memento) {
        this._loadPromise = this._load();
    }

    async search(query: string, token: CancellationToken): Promise<string[]> {
        await this._loadPromise;
        const score = this._tfidf.calculateScores(query, token);
        return score.sort((a, b) => b.score - a.score).map(s => this._docs.get(s.key)!.textChunks[0]!);
    }

    private async _load() {
        let result = this._loadFromCache();
        if (!result) {
            result = await crawl(this._url);
            await this._saveToCache(result);
        }

        // Load TF-IDF
        const tfidfDocs = new Array<TfIdfDocument>;
        for (const page of result) {
            for (const section of page.sections) {
                const key = page.url + '#' + section.heading;
                const doc = {
                    key: page.url + '#' + section.heading,
                    textChunks: [section.content]
                };
                this._docs.set(key, doc);
                tfidfDocs.push(doc);
            }
        }
        this._tfidf.updateDocuments(tfidfDocs);
    }

    private _loadFromCache() {
        return this.storage.get<Page[]>(this._url);
    }

    private _saveToCache(result: Page[]) {
        return this.storage.update(this._url, result);
    }
}