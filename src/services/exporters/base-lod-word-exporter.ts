import { inject, injectable } from "inversify";
import { Word, WordType } from "@model/word";
import { TYPES } from "@services/types";
import { LabelProvider } from "@services/label-provider";

export interface BaseLodWordExporter {
    rerieveWordTypeHeader(language: string, word: Word, type: WordType): string;
}

@injectable()
export class BaseLodWordExporterImpl implements BaseLodWordExporter {

    constructor(
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }

    public rerieveWordTypeHeader(language: string, word: Word, type: WordType): string {
        let content = `<b><a href="https://www.lod.lu/?${type.lodKey}">${word.word}</a> ${this.labelProvider.get(type.type.toUpperCase(), language)}`;
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get(type.details.variationType!, language)} ${type.details.variationOf}`;
        }
        if (!!type.details.audio) {
            content += ` [sound:${!!type.details.audio}]</b>`;
        }
        return content;
    }
}
