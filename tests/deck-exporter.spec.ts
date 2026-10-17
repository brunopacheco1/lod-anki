import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import JSZip from "jszip";
import initSqlJs from "sql.js";
import { beforeAll, describe, expect, it } from "vitest";
import { Deck, Word } from "../src/model/word";
import { AudioConverter } from "../src/services/audio-converter";
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

/** Pretends ffmpeg is missing, so recordings are bundled as downloaded. */
class NoAudioConverter extends AudioConverter {
    public override isAvailable(): boolean {
        return false;
    }
}

/** Pretends to be ffmpeg by copying the recording to the mp3 name. */
class FakeAudioConverter extends AudioConverter {
    public override isAvailable(): boolean {
        return true;
    }

    public override async toMp3(input: string, output: string): Promise<boolean> {
        fs.copyFileSync(input, output);
        return true;
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
    const exporter = new DeckExporter(new LodContentExporter(new LocalAudioProvider(), new NoAudioConverter()));
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
        fs.writeFileSync(path.join(dataDirectory, "audios", "_lod_example_d557f295b3eb28cf449ae8670b63e618.ogg"), "fake example audio");
    });

    it("exports LOD words, custom cards and their audio", async () => {
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export(deck, output, dataDirectory);

        const { notes, media } = await readPackage(path.join(output, "test_english.apkg"));
        expect(notes).toHaveLength(4);
        expect(Object.values(media).sort()).toEqual(["_lod_example_d557f295b3eb28cf449ae8670b63e618.ogg", "kand1.m4a"]);

        const kand = notes.find((note) => note.flds.includes(">Kand<"))!;
        expect(kand.tags.split(" ").sort()).toEqual(["A1", "LOD::Register::Colloquial", "LOD::Topic::Family", "LOD::Word_type::Noun"]);
        expect(kand.flds).toContain("[sound:kand1.m4a]");
        expect(kand.flds).toContain("https://lod.lu/artikel/KAND1");
        expect(kand.flds).toContain("new Audio('https://lod.lu/uploads/examples/OGG/a3/a3961445e7315f7a9c657fb1397e3237.ogg').play()");
        // Bundled when downloaded, streamed from lod.lu otherwise.
        expect(kand.flds).toContain("new Audio('_lod_example_d557f295b3eb28cf449ae8670b63e618.ogg').play()");

        const mat = notes.find((note) => note.flds.includes(">mat<"))!;
        expect(mat.tags.split(" ").sort()).toEqual(["B1", "LOD::Word_type::Adverb", "LOD::Word_type::Preposition"]);
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

    it("adds audio once when several word types of a word share it", async () => {
        const sharedData = path.join(workDirectory, "shared-audio-lod");
        fs.cpSync(dataDirectory, sharedData, { recursive: true });
        const kandFile = path.join(sharedData, "words", `${wordId("Kand")}.json`);
        const kand: Word = JSON.parse(fs.readFileSync(kandFile).toString());
        kand.types.push({ ...kand.types[0], type: "adjective" });
        fs.writeFileSync(kandFile, JSON.stringify(kand));

        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export({ ...deck, flashcards: ["Kand"] }, output, sharedData);

        const { notes, media } = await readPackage(path.join(output, "test_english.apkg"));
        expect(notes).toHaveLength(1);
        expect(Object.values(media).sort()).toEqual(["_lod_example_d557f295b3eb28cf449ae8670b63e618.ogg", "kand1.m4a"]);
    });

    it("exports every word in the deck's categories when it lists no flashcards", async () => {
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export({ name: "A1", fileName: "a1", languages: ["EN"], categories: ["A1"] }, output, dataDirectory);

        const { notes } = await readPackage(path.join(output, "a1_english.apkg"));
        expect(notes.map((note) => note.flds.match(/>([^<]+)<\/a>/)![1]).sort()).toEqual(["Kand", "Moien"]);
    });

    it("keeps only the word types in the deck's categories", async () => {
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export({ name: "B1", fileName: "b1", languages: ["EN"], categories: ["B1"], flashcards: ["mat", "Kand"] }, output, dataDirectory);

        const { notes } = await readPackage(path.join(output, "b1_english.apkg"));
        expect(notes).toHaveLength(1);
        expect(notes[0].tags.split(" ").sort()).toEqual(["B1", "LOD::Word_type::Adverb"]);
        expect(notes[0].flds).not.toContain("MAT1");
    });

    it("exports every word with online audio that streams from the mirror", async () => {
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await exporter.export({ name: "All", fileName: "all", languages: ["EN"], allWords: true, audio: "online" }, output, dataDirectory);

        const { notes, media } = await readPackage(path.join(output, "all_english.apkg"));
        expect(notes).toHaveLength(fs.readdirSync(path.join(dataDirectory, "words")).length);
        expect(Object.values(media)).toEqual([]);

        const kand = notes.find((note) => note.flds.includes(">Kand<"))!;
        expect(kand.flds).toContain("<audio controls autoplay src=\"https://brunopacheco1.github.io/lod-anki/audio/kand1.mp3\"></audio>");
        expect(kand.flds).not.toContain("[sound:");
    });
    it("bundles mp3 made from the downloaded recordings when ffmpeg is installed", async () => {
        const mp3Data = fs.mkdtempSync(path.join(workDirectory, "mp3-"));
        fs.cpSync(dataDirectory, mp3Data, { recursive: true });
        const output = fs.mkdtempSync(path.join(workDirectory, "out-"));
        await new DeckExporter(new LodContentExporter(new LocalAudioProvider(), new FakeAudioConverter())).export(deck, output, mp3Data);

        const { notes, media } = await readPackage(path.join(output, "test_english.apkg"));
        expect(Object.values(media).sort()).toEqual(["_lod_example_d557f295b3eb28cf449ae8670b63e618.mp3", "kand1.mp3"]);
        const kand = notes.find((note) => note.flds.includes(">Kand<"))!;
        expect(kand.flds).toContain("[sound:kand1.mp3]");
        expect(kand.flds).toContain("new Audio('_lod_example_d557f295b3eb28cf449ae8670b63e618.mp3').play()");
        // The originals are replaced, so the audio cache keeps only the small files.
        expect(fs.readdirSync(path.join(mp3Data, "audios")).sort()).toEqual(["_lod_example_d557f295b3eb28cf449ae8670b63e618.mp3", "kand1.mp3"]);
    });
});
