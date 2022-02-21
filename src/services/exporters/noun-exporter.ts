import { inject, injectable } from "inversify";
import { Word, WordType } from "@model/word";
import { TYPES } from "@services/types";
import { LabelProvider } from "@services/label-provider";
import { BaseLodWordExporter } from "./base-lod-word-exporter";

export interface NounExporter extends BaseLodWordExporter {
}

@injectable()
export class NounExporterImpl implements NounExporter {

    constructor(
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) {
    }

    public rerieveWordTypeHeader(language: string, word: Word, type: WordType): string {
        let content = `<b><a href="https://www.lod.lu/?${type.lodKey}">${word.word}</a>`;
        let typeStr = this.labelProvider.get(type.type.toUpperCase(), language);
        if (type.details.nounCategory === "NOM-PROPRE") {
            typeStr = this.labelProvider.get("PROPER_NOUN", language);
        } else {
            typeStr = this.labelProvider.get(`${type.details.nounGender!.toUpperCase()}_${type.type.toUpperCase()}`, language);
        }
        if (type.details.nounGender === "INDEF") {
            typeStr += ` (${this.labelProvider.get("NO_SINGULAR", language)})`;
        } else if (!!type.details.plural) {
            typeStr += ` (${this.labelProvider.get("PLURAL", language)} <span style="color: #b00c12;">${type.details.plural}</span>)`;
        }
        content += ` ${typeStr}`;
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get(type.details.variationType!, language)} ${type.details.variationOf}`;
        }
        content += ` [sound:${type.lodKey.toLowerCase()}.m4a]</b>`;
        return content;
    }
}
