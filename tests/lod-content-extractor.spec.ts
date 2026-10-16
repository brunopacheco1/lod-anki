import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Word } from "../src/model/word";
import { mapEntry } from "../src/services/extractors/lod-entry-mapper";
import { streamElements, XmlNode } from "../src/services/extractors/xml-tree";
import { extractLodContent } from "../src/services/extractors/lod-content-extractor";
import { wordId } from "../src/services/word-id-generator";

const FIXTURE = path.join(__dirname, "fixtures", "lod-sample.xml");

async function readEntries(): Promise<Map<string, XmlNode>> {
    const entries = new Map<string, XmlNode>();
    await streamElements(FIXTURE, "entry", (entry) => entries.set(entry.attributes["id"], entry));
    return entries;
}

function map(entries: Map<string, XmlNode>, id: string): Word[] {
    return mapEntry(entries.get(id)!, wordId);
}

describe("LOD entry mapping", () => {
    let entries: Map<string, XmlNode>;

    beforeAll(async () => {
        entries = await readEntries();
    });

    it("streams every entry", () => {
        expect([...entries.keys()]).toEqual(["KAND1", "LAFEN1", "MAT1", "MAT2", "MOIEN1", "ACH1"]);
    });

    it("maps a noun with gender, plural, translations and examples", () => {
        const [word] = map(entries, "KAND1");
        expect(word.id).toBe(wordId("Kand"));
        expect(word.word).toBe("Kand");

        const [type] = word.types;
        expect(type.type).toBe("noun");
        expect(type.lodKey).toBe("KAND1");
        expect(type.details).toEqual({ nounGender: "N", nounCategory: undefined, plural: "Kanner", audio: "kand1.m4a" });

        const [meaning] = type.meanings;
        expect(meaning.translations).toContainEqual({ language: "ALL", translation: "Kind", complement: "unmittelbarer Nachkomme" });
        expect(meaning.translations).toContainEqual({ language: "PO", translation: "filho, filha", complement: "descendente" });
        expect(meaning.translations).toContainEqual({ language: "NL", translation: "kind", complement: undefined });
        expect(meaning.examples).toEqual([
            { usage: "ALLG", example: "eis Noperen hu véier Kanner, zwee Jongen", id: "a3961445e7315f7a9c657fb1397e3237" },
            { usage: "EGS", example: "hien huet kee Kand a kee Kënn! (hie brauch keng Verantwortung)", id: "d557f295b3eb28cf449ae8670b63e618" },
        ]);
    });

    it("maps a verb with auxiliary, past participle, polylexical units and synonyms", () => {
        const [type] = map(entries, "LAFEN1")[0].types;
        expect(type.type).toBe("verb");
        expect(type.details.auxiliaryVerb).toBe("sinn");
        expect(type.details.pastParticiples).toEqual(["gelaf"]);
        expect(type.meanings).toHaveLength(2);
        expect(type.meanings[0].examples![0].example).toBe("d'Waasser leeft ëmmer de Bierg of");
        expect(type.meanings[1].polyLex).toBe("lafen an");
        expect(type.meanings[1].synonyms).toEqual(["fléissen"]);
        expect(type.meanings[1].translations).toEqual([{ language: "EN", translation: "to flow into, to merge with", complement: undefined }]);
    });

    it("keeps the grammatical case of prepositions", () => {
        const [type] = map(entries, "MAT1")[0].types;
        expect(type.type).toBe("preposition");
        expect(type.meanings[0].case).toBe("mam Dativ");
    });

    it("finds plurals declared inside a meaning", () => {
        expect(map(entries, "MOIEN1")[0].types[0].details.plural).toBe("Moienter");
    });

    it("keeps the categories of an entry on each of its word types", () => {
        expect(map(entries, "KAND1")[0].types[0].categories).toEqual(["A1", "FAMILL"]);
        expect(map(entries, "LAFEN1")[0].types[0].categories).toBeUndefined();
    });

    it("skips word types that cannot be exported", () => {
        expect(map(entries, "ACH1")).toEqual([]);
    });
});

describe("LOD content extractor", () => {
    it("writes one JSON file per word and merges homographs", async () => {
        const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-"));
        await extractLodContent(FIXTURE, outputDirectory);

        const wordsFolder = path.join(outputDirectory, "lod", "words");
        expect(fs.readdirSync(wordsFolder)).toHaveLength(4);

        const mat: Word = JSON.parse(fs.readFileSync(path.join(wordsFolder, `${wordId("mat")}.json`)).toString());
        expect(mat.types.map((type) => type.type)).toEqual(["preposition", "adverb"]);
    });
});
