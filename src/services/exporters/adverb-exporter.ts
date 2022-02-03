import { inject, injectable } from "inversify";
import { Word, WordType } from "@model/word";
import { TYPES } from "@services/types";
import { LabelProvider } from "@services/label-provider";
import { BaseLodWordExporter } from "@services/exporters/lod-content-exporter";

export interface AdverbExporter extends BaseLodWordExporter {
}

@injectable()
export class AdverbExporterImpl implements AdverbExporter {

    constructor(
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }

    public rerieveWordTypeHeader(language: string, word: Word, type: WordType): string {
        let content = `<b><a href="https://www.lod.lu/?${type.lodKey}">${word.word}</a> ${this.labelProvider.get(type.type.toUpperCase(), language)}`;
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get("VARIANT_OF", language)} ${type.details.variationOf}`;
        }
        content += ` [sound:${type.lodKey.toLowerCase()}.mp3]</b>`;
        return content;
    }
}
