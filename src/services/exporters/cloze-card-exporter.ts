import { injectable } from "inversify";

export interface ClozeCardExporter {
    export(apkg: any, ClozeCardContent: string): void;
}

@injectable()
export class ClozeCardExporterImpl implements ClozeCardExporter {

    private readonly WORD_REGEX = /\{\{(.+)\}\}/;

    public export(apkg: any, clozeCardContent: string): void {
        const cardContent = clozeCardContent.slice(6);
        const front = cardContent.replace(this.WORD_REGEX, "<span style=\"color: blue\">[...]</span>");
        const back = cardContent.replace(this.WORD_REGEX, `<span style=\"color: blue\">${this.WORD_REGEX.exec(cardContent)![1]}</span>`);
        apkg.addCard(`<div style="text-align: left">${front}</div>`, `<div style="text-align: left">${back}</div>`);
    }
}
