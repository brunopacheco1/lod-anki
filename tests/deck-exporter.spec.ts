import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import JSZip from "jszip";
import initSqlJs from "sql.js";
import { beforeAll, describe, expect, it } from "vitest";
import { Deck, Word } from "../src/model/word";
import { AudioProvider } from "../src/services/audio-provider";
import { DeckExporter } from "../src/services/exporters/deck-exporter";
import { LodContentExporter } from "../src/services/exporters/lod-content-exporter";
import { extractLodContent } from "../src/services/extractors/lod-content-extractor";
import { wordId } from "../src/services/word-id-generator";

const FIXTURE = path.join(__dirname, "fixtures", "lod-sample.xml");

/** Serves audio only from the local folder, so tests never reach lod.lu. */
class LocalAudioProvider extends AudioProvider {
    public override async get(fileName: string, audiosFolder: string): Promise<string | undefined> {
        const audioFile = path.join(audiosFolder, fileName);
        return fs.existsSync(audioFile) ? audioFile : undefined;
    }
}

interface Note {
    guid: string,
    tags: string,
    flds: string
}

async function readPackage(apkgFile: string): Promise<{ notes: Note[], media: { [index: string]: string } }> {
    const zip = await JSZip.loadAsync(fs.readFileSync(apkgFile));
    const SQL = await initSqlJs();
    const db = new SQL.Database(await zip.file("collection.anki2")!.async("uint8array"));
    const [result] = db.exec("SELECT guid, tags, flds FROM notes ORDER BY sfld");
    db.close();
    const notes = result.values.map(([guid, tags, flds]) => ({ guid: String(guid), tags: String(tags).trim(), flds: String(flds) }));
    return { notes, media: JSON.parse(await zip.file("media")!.async("string")) };
}

describe("Deck exporter", () => {
    let workDirectory: string;
    let dataDirectory: string;
    const exporter = new DeckExporter(new LodContentExporter(new LocalAudioProvider()));
    const deck: Deck = {
        name: "Test",
        fileName: "test",
        types: [],
        languages: ["EN"],
        flashcards: ["Kand", "mat", "Kand", "unknown", "basic:Moien;Hello", "cloze:Ech {{sinn}} midd."],
    };

    beforeAll(async () => {
        workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-"));
        await extractLodContent(FIXTURE, workDirectory);
        dataDirectory = path.join(workDirectory, "lod");
        fs.mkdirSync(path.join(dataDirectory, "audios"));
        fs.writeFileSync(path.join(dataDirectory, "audios", "kand1.m4a"), "fake audio");
    });

    it("exports LOD words, custom cards and their audio", async () => {
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export(deck, output, dataDirectory);

        const { notes, media } = await readPackage(path.join(output, "test_english.apkg"));
        expect(notes).toHaveLength(4);
        expect(Object.values(media)).toEqual(["kand1.m4a"]);

        const kand = notes.find((note) => note.flds.includes(">Kand<"))!;
        expect(kand.tags).toBe("noun");
        expect(kand.flds).toContain("[sound:kand1.m4a]");
        expect(kand.flds).toContain("https://lod.lu/artikel/KAND1");

        const mat = notes.find((note) => note.flds.includes(">mat<"))!;
        expect(mat.tags.split(" ").sort()).toEqual(["adverb", "preposition"]);
        expect(mat.flds).not.toContain("[sound:");

        const cloze = notes.find((note) => note.flds.includes("[...]"))!;
        expect(cloze.flds).toContain("<span style=\"color: blue\">sinn</span>");
    });

    it("keeps note ids when a deck is exported again with changed content", async () => {
        const first = fs.mkdtempSync(path.join(workDirectory, "out-"));
        const second = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export(deck, first, dataDirectory);

        const updatedData = path.join(workDirectory, "updated-lod");
        fs.cpSync(dataDirectory, updatedData, { recursive: true });
        const kandFile = path.join(updatedData, "words", `${wordId("Kand")}.json`);
        const kand: Word = JSON.parse(fs.readFileSync(kandFile).toString());
        kand.types[0].details.plural = "Kanner (updated)";
        fs.writeFileSync(kandFile, JSON.stringify(kand));
        await exporter.export(deck, second, updatedData);

        const before = (await readPackage(path.join(first, "test_english.apkg"))).notes;
        const after = (await readPackage(path.join(second, "test_english.apkg"))).notes;
        const kandBefore = before.find((note) => note.flds.includes(">Kand<"))!;
        const kandAfter = after.find((note) => note.flds.includes(">Kand<"))!;
        expect(kandAfter.flds).not.toBe(kandBefore.flds);
        expect(kandAfter.guid).toBe(kandBefore.guid);
        expect(after.find((note) => note.flds.includes("Hello"))!.guid).toBe(before.find((note) => note.flds.includes("Hello"))!.guid);
    });
});
