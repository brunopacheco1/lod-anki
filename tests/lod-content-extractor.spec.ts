/// <reference types="mocha" />
import "reflect-metadata";
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Word } from "../src/model/word";
import { mapEntry } from "../src/services/extractors/lod-entry-mapper";
import { streamElements, XmlNode } from "../src/services/extractors/xml-tree";
import { LodContentExtractorImpl } from "../src/services/extractors/lod-content-extractor";
import { FileWriterImpl } from "../src/services/file-writer";
import { WordIdGeneratorImpl } from "../src/services/word-id-generator";

const FIXTURE = path.join(__dirname, "fixtures", "lod-sample.xml");
const idGenerator = new WordIdGeneratorImpl();

async function readEntries(): Promise<Map<string, XmlNode>> {
    const entries = new Map<string, XmlNode>();
    await streamElements(FIXTURE, "entry", (entry) => entries.set(entry.attributes["id"], entry));
    return entries;
}

function map(entries: Map<string, XmlNode>, id: string): Word[] {
    return mapEntry(entries.get(id)!, (word) => idGenerator.generate(word));
}

describe("LOD entry mapping", () => {
    let entries: Map<string, XmlNode>;

    before(async () => {
        entries = await readEntries();
    });

    it("streams every entry", () => {
        expect([...entries.keys()]).to.deep.equal(["KAND1", "LAFEN1", "MAT1", "MAT2", "MOIEN1", "ACH1"]);
    });

    it("maps a noun with gender, plural, translations and examples", () => {
        const [word] = map(entries, "KAND1");
        expect(word.id).to.equal(idGenerator.generate("Kand"));
        expect(word.word).to.equal("Kand");

        const [type] = word.types;
        expect(type.type).to.equal("noun");
        expect(type.lodKey).to.equal("KAND1");
        expect(type.details).to.deep.equal({ nounGender: "N", nounCategory: undefined, plural: "Kanner", audio: "kand1.m4a" });

        const [meaning] = type.meanings;
        expect(meaning.translations).to.deep.include({ language: "ALL", translation: "Kind", complement: "unmittelbarer Nachkomme" });
        expect(meaning.translations).to.deep.include({ language: "PO", translation: "filho, filha", complement: "descendente" });
        expect(meaning.translations).to.deep.include({ language: "NL", translation: "kind", complement: undefined });
        expect(meaning.examples).to.deep.equal([
            { usage: "ALLG", example: "eis Noperen hu véier Kanner, zwee Jongen" },
            { usage: "EGS", example: "hien huet kee Kand a kee Kënn! (hie brauch keng Verantwortung)" },
        ]);
    });

    it("maps a verb with auxiliary, past participle, polylexical units and synonyms", () => {
        const [type] = map(entries, "LAFEN1")[0].types;
        expect(type.type).to.equal("verb");
        expect(type.details.auxiliaryVerb).to.equal("sinn");
        expect(type.details.pastParticiples).to.deep.equal(["gelaf"]);
        expect(type.meanings).to.have.length(2);
        expect(type.meanings[0].examples![0].example).to.equal("d'Waasser leeft ëmmer de Bierg of");
        expect(type.meanings[1].polyLex).to.equal("lafen an");
        expect(type.meanings[1].synonyms).to.deep.equal(["fléissen"]);
        expect(type.meanings[1].translations).to.deep.equal([{ language: "EN", translation: "to flow into, to merge with", complement: undefined }]);
    });

    it("keeps the grammatical case of prepositions", () => {
        const [type] = map(entries, "MAT1")[0].types;
        expect(type.type).to.equal("preposition");
        expect(type.meanings[0].case).to.equal("mam Dativ");
    });

    it("finds plurals declared inside a meaning", () => {
        expect(map(entries, "MOIEN1")[0].types[0].details.plural).to.equal("Moienter");
    });

    it("skips word types that cannot be exported", () => {
        expect(map(entries, "ACH1")).to.deep.equal([]);
    });
});

describe("LOD content extractor", () => {
    it("writes one JSON file per word and merges homographs", async () => {
        const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-"));
        const extractor = new LodContentExtractorImpl(new FileWriterImpl(), idGenerator);
        await extractor.extract(FIXTURE, outputDirectory);

        const wordsFolder = path.join(outputDirectory, "lod", "words");
        expect(fs.readdirSync(wordsFolder)).to.have.length(4);

        const mat: Word = JSON.parse(fs.readFileSync(path.join(wordsFolder, `${idGenerator.generate("mat")}.json`)).toString());
        expect(mat.types.map((type) => type.type)).to.deep.equal(["preposition", "adverb"]);
    });
});
