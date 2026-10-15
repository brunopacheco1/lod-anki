import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import { cachedDataDirectory, hasWords, unpackLodData } from "../src/services/lod-data";

const WORD = "0123456789abcdef0123456789abcdef.json";

async function lodZip(files: { [name: string]: string }): Promise<Buffer> {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
    }
    return zip.generateAsync({ type: "nodebuffer" });
}

describe("LOD data", () => {
    const environment = { ...process.env };

    afterEach(() => {
        process.env = { ...environment };
    });

    it("replaces the words and keeps downloaded audio", async () => {
        const dataDirectory = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-")), "lod");
        fs.mkdirSync(path.join(dataDirectory, "words"), { recursive: true });
        fs.writeFileSync(path.join(dataDirectory, "words", "old.json"), "{}");
        fs.mkdirSync(path.join(dataDirectory, "audios"));
        fs.writeFileSync(path.join(dataDirectory, "audios", "kand1.m4a"), "audio");

        const words = await unpackLodData(await lodZip({
            [`lod/words/${WORD}`]: "{\"word\":\"Kand\"}",
            "lod/words/../../evil.json": "{}",
            "README.md": "ignored",
        }), dataDirectory);

        expect(words).toBe(1);
        expect(hasWords(dataDirectory)).toBe(true);
        expect(fs.readdirSync(path.join(dataDirectory, "words"))).toEqual([WORD]);
        expect(fs.existsSync(path.join(dataDirectory, "audios", "kand1.m4a"))).toBe(true);
    });

    it("keeps the current words when the zip has none", async () => {
        const dataDirectory = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-")), "lod");
        fs.mkdirSync(path.join(dataDirectory, "words"), { recursive: true });
        fs.writeFileSync(path.join(dataDirectory, "words", WORD), "{}");

        await expect(unpackLodData(await lodZip({ "other.txt": "" }), dataDirectory)).rejects.toThrow();
        expect(fs.readdirSync(path.join(dataDirectory, "words"))).toEqual([WORD]);
    });

    it("stores downloaded data in the user cache", () => {
        process.env["LOD_ANKI_CACHE"] = "/tmp/lod-anki-cache";
        expect(cachedDataDirectory()).toBe(path.resolve("/tmp/lod-anki-cache", "lod"));
        delete process.env["LOD_ANKI_CACHE"];
        process.env["XDG_CACHE_HOME"] = "/tmp/xdg";
        expect(cachedDataDirectory()).toBe(path.join("/tmp/xdg", "lod-anki", "lod"));
    });
});
