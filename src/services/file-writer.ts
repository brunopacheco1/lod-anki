import { injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";

export interface FileWriter {
    write(outputDirectory: string, fileName: string, contentBase64: string): void;
}

@injectable()
export class FileWriterImpl implements FileWriter {

    constructor() { }

    public write(outputDirectory: string, fileName: string, contentBase64: string): void {
        const outputDirectoryPath = path.join(outputDirectory, fileName);
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory);
        }
        fs.writeFileSync(outputDirectoryPath, Buffer.from(contentBase64, "base64"));
    }
}
