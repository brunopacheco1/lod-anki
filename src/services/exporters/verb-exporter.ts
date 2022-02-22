import { inject, injectable } from "inversify";
import { Word, WordType } from "@model/word";
import { TYPES } from "@services/types";
import { LabelProvider } from "@services/label-provider";
import { BaseLodWordExporter } from "./base-lod-word-exporter";

export interface VerbExporter extends BaseLodWordExporter {
}

@injectable()
export class VerbExporterImpl implements VerbExporter {

    constructor(
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) {
    }

    public rerieveWordTypeHeader(language: string, word: Word, type: WordType): string {
        let content = `<b><a href="https://www.lod.lu/?${type.lodKey}">${word.word}</a> ${this.labelProvider.get(type.type.toUpperCase(), language)}`;
        content += ` (${this.labelProvider.get("AUXILIARY_VERB", language)} <span style="color: #b00c12;">${type.details.auxiliaryVerb?.toLowerCase()}</span>, ${this.labelProvider.get("PAST_PARTICIPLE", language)} <span style="color: #b00c12;">${type.details.pastParticiples?.join(" / ")}</span>)`;
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get(type.details.variationType!, language)} ${type.details.variationOf}`;
        }
        if (!!type.details.audio) {
            content += ` [sound:${type.details.audio}]</b>`;
        }
        return content;
    }
}
