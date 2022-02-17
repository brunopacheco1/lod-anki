import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface ConjunctionExtractor extends BaseLodWordExtractor {
}

@injectable()
export class ConjunctionExtractorImpl extends BaseLodWordExtractorImpl implements ConjunctionExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "conjunction";
    }

    public lodWordType(): string {
        return "CONJ";
    }
}
