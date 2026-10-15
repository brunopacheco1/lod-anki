import { inject, injectable } from "inversify";
import { Word, WordType } from "../../model/word";
import { TYPES } from "../types";
import { LabelProvider } from "../label-provider";
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
        let content = `<b><a href="https://lod.lu/artikel/${type.lodKey}">${word.word}</a> ${this.labelProvider.get(type.type.toUpperCase(), language)}`;
        const forms: string[] = [];
        if (!!type.details.auxiliaryVerb) {
            forms.push(`${this.labelProvider.get("AUXILIARY_VERB", language)} <span style="color: #b00c12;">${type.details.auxiliaryVerb.toLowerCase()}</span>`);
        }
        if (!!type.details.pastParticiples && type.details.pastParticiples.length > 0) {
            forms.push(`${this.labelProvider.get("PAST_PARTICIPLE", language)} <span style="color: #b00c12;">${type.details.pastParticiples.join(" / ")}</span>`);
        }
        if (forms.length > 0) {
            content += ` (${forms.join(", ")})`;
        }
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get(type.details.variationType!, language)} ${type.details.variationOf}`;
        }
        if (!!type.details.audio) {
            content += ` [sound:${type.details.audio}]`;
        }
        content += "</b>";
        return content;
    }
}
