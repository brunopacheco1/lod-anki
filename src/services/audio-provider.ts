import { injectable } from "inversify";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";

const LOD_AUDIO_URL = "https://lod.lu/uploads/AAC";
const HTTP_OK = 200;
const TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "lod-anki (https://github.com/brunopacheco1/lod-anki)";

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

    private download(url: string, redirects = MAX_REDIRECTS): Promise<Buffer | undefined> {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout: TIMEOUT_MS, headers: { "User-Agent": USER_AGENT } }, (response) => {
                const location = response.headers.location;
                if (location && response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && redirects > 0) {
                    response.resume();
                    resolve(this.download(new URL(location, url).toString(), redirects - 1));
                    return;
                }
                if (response.statusCode !== HTTP_OK) {
                    response.resume();
                    console.warn(`Audio not available at ${url} (HTTP ${response.statusCode})`);
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
