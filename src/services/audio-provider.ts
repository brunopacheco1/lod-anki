import * as fs from "node:fs";
import * as path from "node:path";
import { download } from "./http";

const LOD_AUDIO_URL = "https://lod.lu/uploads/AAC";
const TIMEOUT_MS = 15000;

/** Provides LOD audio files, downloading them from lod.lu into a local folder on first use. */
export class AudioProvider {

    private readonly unavailable = new Set<string>();

    /**
     * Returns the local path of an LOD audio file, downloading it into `audiosFolder` when it is
     * not there yet, or undefined when it is not available. `url` defaults to the word pronunciations on lod.lu.
     */
    public async get(fileName: string, audiosFolder: string, url = `${LOD_AUDIO_URL}/${encodeURIComponent(fileName)}`): Promise<string | undefined> {
        const audioFile = path.join(audiosFolder, fileName);
        if (fs.existsSync(audioFile)) {
            return audioFile;
        }
        if (this.unavailable.has(fileName)) {
            return undefined;
        }
        try {
            const content = await download(url, TIMEOUT_MS);
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
}
