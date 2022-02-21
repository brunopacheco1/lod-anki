import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { FileWriter } from "@services/file-writer";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { CONSTANTS } from "@model/constants";
import { execSync } from "child_process";

export interface LodAudioCrawler {
    fetch(lodWordList: string[], outputDirectory: string): Promise<void>;
}

@injectable()
export class LodAudioCrawlerImpl implements LodAudioCrawler {


    constructor(
        @inject(TYPES.FileWriter) private readonly fileWriter: FileWriter
    ) { }

    public async fetch(lodWordList: string[], outputDirectory: string): Promise<void> {
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);

        for (const word of lodWordList) {
            try {
                const lodKey = word.trim();
                if (this.audioExists(lodKey, lodAudiosFolder)) {
                    console.warn(`${lodKey} fetched before.`);
                    continue;
                }

                await this.persistMp3(lodKey, lodAudiosFolder);
                this.persistM4a(lodKey, lodAudiosFolder);

                console.log(`${lodKey} was fetched.`);
            } catch (exception) {
                console.error(exception);
            }
        }
    }

    private audioExists(lodKey: string, lodAudiosFolder: string): boolean {
        return fs.existsSync(path.join(lodAudiosFolder, `${lodKey.toLowerCase()}.m4a`));
    }

    private async persistMp3(lodKey: string, outputDirectory: string): Promise<void> {
        const waitPromise: Promise<void> = new Promise((resolve, reject) => {
            https.get(`https://www.lod.lu/audio/${lodKey.toLowerCase()}.mp3`, (response) => {
                response.setEncoding("base64");
                let body = "";
                response.on("error", reject);
                response.on("data", (data) => { body += data });
                response.on("end", () => {
                    this.fileWriter.write(outputDirectory, `${lodKey.toLowerCase()}.mp3`, body);
                    resolve();
                });
            });
        });
        return waitPromise;
    }

    private persistM4a(lodKey: string, outputDirectory: string): void {
        const mp3File = path.join(outputDirectory, `${lodKey.toLowerCase()}.mp3`);
        const m4aFile = path.join(outputDirectory, `${lodKey.toLowerCase()}.m4a`);
        execSync(`ffmpeg -i "${mp3File}" -map a:0 -c:a aac "${m4aFile}"`);
    }
}
