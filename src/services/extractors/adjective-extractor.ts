import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface AdjectiveExtractor extends BaseLodWordExtractor {
}

@injectable()
export class AdjectiveExtractorImpl extends BaseLodWordExtractorImpl implements AdjectiveExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "adjective";
    }

    public lodWordType(): string {
        return "ADJ";
    }
}
