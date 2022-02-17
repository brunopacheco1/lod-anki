import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface AdverbExtractor extends BaseLodWordExtractor {
}

@injectable()
export class AdverbExtractorImpl extends BaseLodWordExtractorImpl implements AdverbExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "adverb";
    }

    public lodWordType(): string {
        return "ADV";
    }
}
