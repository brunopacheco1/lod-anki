import { injectable } from "inversify";
import { Word } from "../model/word";

export interface WordExtractor {
    extract(lodKeys: string[]): Promise<Word[]>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    public async extract(lodKeys: string[]): Promise<Word[]> {
        return [];
    }
}
