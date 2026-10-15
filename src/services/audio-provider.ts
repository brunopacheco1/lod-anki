import { injectable } from "inversify";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";

const LOD_AUDIO_URL = "https://lod.lu/uploads/AAC";
const HTTP_OK = 200;
const TIMEOUT_MS = 15000;

export interface AudioProvider {
    /**
     * Returns the local path of an LOD audio file, downloading it from lod.lu into
     * `audiosFolder` when it is not there yet, or undefined when it is not available.
     */
    get(fileName: string, audiosFolder: string): Promise<string | undefined>;
}

@injectable()
export class AudioProviderImpl implements AudioProvider {

    private readonly unavailable = new Set<string>();

    public async get(fileName: string, audiosFolder: string): Promise<string | undefined> {
        const audioFile = path.join(audiosFolder, fileName);
        if (fs.existsSync(audioFile)) {
            return audioFile;
        }
        if (this.unavailable.has(fileName)) {
            return undefined;
        }
        try {
            const content = await this.download(`${LOD_AUDIO_URL}/${encodeURIComponent(fileName)}`);
            if (!content) {
                this.unavailable.add(fileName);
                return undefined;
            }
            fs.mkdirSync(audiosFolder, { recursive: true });
            fs.writeFileSync(audioFile, content);
            return audioFile;
        } catch (error) {
            console.warn(`Could not download audio ${fileName}: ${error}`);
            this.unavailable.add(fileName);
            return undefined;
        }
    }

    private download(url: string): Promise<Buffer | undefined> {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout: TIMEOUT_MS }, (response) => {
                if (response.statusCode !== HTTP_OK) {
                    response.resume();
                    resolve(undefined);
                    return;
                }
                const chunks: Buffer[] = [];
                response.on("data", (chunk) => chunks.push(chunk));
                response.on("end", () => resolve(Buffer.concat(chunks)));
                response.on("error", reject);
            });
            request.on("timeout", () => request.destroy(new Error(`timed out after ${TIMEOUT_MS} ms`)));
            request.on("error", reject);
        });
    }
}
