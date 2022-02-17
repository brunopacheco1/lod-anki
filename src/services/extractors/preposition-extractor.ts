import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface PrepositionExtractor extends BaseLodWordExtractor {
}

@injectable()
export class PrepositionExtractorImpl extends BaseLodWordExtractorImpl implements PrepositionExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "preposition";
    }

    public lodWordType(): string {
        return "PREP";
    }
}
