import { injectable } from "inversify";

export interface ClozeCardExporter {
    export(apkg: any, ClozeCardContent: string): void;
}

@injectable()
export class ClozeCardExporterImpl implements ClozeCardExporter {

    private readonly WORD_REGEX = /\{\{(.+?)\}\}/g;

    public export(apkg: any, clozeCardContent: string): void {
        const cardContent = clozeCardContent.slice(6);
        const front = cardContent.replace(this.WORD_REGEX, "<span style=\"color: blue\">[...]</span>");

        let back = cardContent;
        const replacements = cardContent.match(this.WORD_REGEX)!;
        for(const replacement of replacements) {
            const content = `<span style=\"color: blue\">${replacement.slice(2, -2)}</span>`;
            back = back.replace(replacement, content);
        }
        apkg.addCard(`<div style="text-align: left">${front}</div>`, `<div style="text-align: left">${back}</div>`);
    }
}
