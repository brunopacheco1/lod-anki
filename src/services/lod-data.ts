import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import JSZip from "jszip";
import { CONSTANTS } from "../model/constants";
import { download } from "./http";

export const LOD_DATA_URL = "https://github.com/brunopacheco1/lod-anki/releases/download/lod-data/lod.zip";
const TIMEOUT_MS = 60000;
const WORD_ENTRY = /^lod\/words\/([0-9a-f]{32}\.json)$/;

/** Folder where lod-anki keeps the LOD data it downloads, shared by all runs. */
export function cachedDataDirectory(): string {
    const configured = process.env["LOD_ANKI_CACHE"];
    if (configured) {
        return path.resolve(configured, CONSTANTS.DATA_FOLDER);
    }
    let cacheRoot = process.env["XDG_CACHE_HOME"];
    if (!cacheRoot) {
        switch (process.platform) {
            case "win32": cacheRoot = process.env["LOCALAPPDATA"] || path.join(os.homedir(), "AppData", "Local"); break;
            case "darwin": cacheRoot = path.join(os.homedir(), "Library", "Caches"); break;
            default: cacheRoot = path.join(os.homedir(), ".cache"); break;
        }
    }
    return path.join(cacheRoot, "lod-anki", CONSTANTS.DATA_FOLDER);
}

export function hasWords(dataDirectory: string): boolean {
    return fs.existsSync(path.join(dataDirectory, CONSTANTS.WORDS_FOLDER));
}

/**
 * Downloads the extracted LOD words published on the lod-data GitHub release into
 * `<dataDirectory>/words`, replacing the words already there. Downloaded audio is kept.
 */
export async function downloadLodData(dataDirectory: string, url = LOD_DATA_URL): Promise<void> {
    console.log(`Downloading LOD data from ${url} ...`);
    const zipContent = await download(url, TIMEOUT_MS);
    if (!zipContent) {
        throw new Error(`Could not download the LOD data from ${url}`);
    }
    const words = await unpackLodData(zipContent, dataDirectory);
    console.log(`Saved ${words} words to ${path.join(dataDirectory, CONSTANTS.WORDS_FOLDER)}`);
}

/** Replaces `<dataDirectory>/words` with the words of an lod.zip and returns how many there were. */
export async function unpackLodData(zipContent: Buffer, dataDirectory: string): Promise<number> {
    const zip = await JSZip.loadAsync(zipContent);

    const wordsFolder = path.join(dataDirectory, CONSTANTS.WORDS_FOLDER);
    const newWordsFolder = `${wordsFolder}.download`;
    fs.rmSync(newWordsFolder, { recursive: true, force: true });
    fs.mkdirSync(newWordsFolder, { recursive: true });
    let words = 0;
    for (const entry of Object.values(zip.files)) {
        const match = WORD_ENTRY.exec(entry.name);
        if (!match) {
            continue;
        }
        fs.writeFileSync(path.join(newWordsFolder, match[1]), await entry.async("nodebuffer"));
        words++;
    }
    if (words === 0) {
        fs.rmSync(newWordsFolder, { recursive: true, force: true });
        throw new Error("No LOD words found in the downloaded data");
    }

    fs.rmSync(wordsFolder, { recursive: true, force: true });
    fs.renameSync(newWordsFolder, wordsFolder);
    return words;
}
