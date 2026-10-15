import { injectable } from "inversify";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";

const LOD_AUDIO_URL = "https://lod.lu/uploads/AAC";
const HTTP_OK = 200;

export interface AudioProvider {
    /**
     * Returns the local path of an LOD audio file, downloading it from lod.lu into
     * `audiosFolder` when it is not there yet, or undefined when it is not available.
     */
    get(fileName: string, audiosFolder: string): Promise<string | undefined>;
}

@injectable()
export class AudioProviderImpl implements AudioProvider {

    public async get(fileName: string, audiosFolder: string): Promise<string | undefined> {
        const audioFile = path.join(audiosFolder, fileName);
        if (fs.existsSync(audioFile)) {
            return audioFile;
        }
        try {
            const content = await this.download(`${LOD_AUDIO_URL}/${encodeURIComponent(fileName)}`);
            if (!content) {
                return undefined;
            }
            fs.mkdirSync(audiosFolder, { recursive: true });
            fs.writeFileSync(audioFile, content);
            return audioFile;
        } catch (error) {
            console.warn(`Could not download audio ${fileName}: ${error}`);
            return undefined;
        }
    }

    private download(url: string): Promise<Buffer | undefined> {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode !== HTTP_OK) {
                    response.resume();
                    resolve(undefined);
                    return;
                }
                const chunks: Buffer[] = [];
                response.on("data", (chunk) => chunks.push(chunk));
                response.on("end", () => resolve(Buffer.concat(chunks)));
                response.on("error", reject);
            }).on("error", reject);
        });
    }
}
