import { inject, injectable } from "inversify";
import { Word, WordType } from "@model/word";
import { TYPES } from "@services/types";
import { LabelProvider } from "@services/label-provider";
import { BaseLodWordExporter } from "@services/exporters/lod-content-exporter";

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
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get(type.details.variationType!, language)} ${type.details.variationOf}`;
        }
        content += ` [sound:${type.lodKey.toLowerCase()}.mp3]</b>`;
        return content;
    }
}
