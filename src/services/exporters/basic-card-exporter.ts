import { injectable } from "inversify";

export interface BasicCardExporter {
    export(apkg: any, basicCardContent: string): void;
}

@injectable()
export class BasicCardExporterImpl implements BasicCardExporter {

    public export(apkg: any, basicCardContent: string): void {
        const [front, back] = basicCardContent.slice(6).split(";");
        apkg.addCard(`<div style="text-align: left">${front}</div>`, `<div style="text-align: left">${back}</div>`);
    }
}
