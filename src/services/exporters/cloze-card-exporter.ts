import { injectable } from "inversify";

export interface ClozeCardExporter {
    export(apkg: any, ClozeCardContent: string): void;
}

@injectable()
export class ClozeCardExporterImpl implements ClozeCardExporter {

    public export(apkg: any, clozeCardContent: string): void {
        console.log(clozeCardContent);
        //const [front, back] = ClozeCardContent.slice(5).split(";");
       // apkg.addCard(`<div style="text-align: left">${front}</div>`, `<div style="text-align: left">${back}</div>`);
    }
}
