import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadDeck } from "../src/services/deck-loader";

describe("deck loader", () => {
    let folder: string;

    beforeEach(() => {
        folder = fs.mkdtempSync(path.join(os.tmpdir(), "lod-anki-deck-"));
    });

    afterEach(() => {
        fs.rmSync(folder, { recursive: true, force: true });
    });

    function write(name: string, content: string): string {
        const file = path.join(folder, name);
        fs.writeFileSync(file, content);
        return file;
    }

    it("reads a word list with one word per line in English", () => {
        const file = write("Mäin Wierder.txt", "# greetings\nMoien\r\n\n  Äddi  \nMoien\nbasic:Hi;Moien\n");

        expect(loadDeck(file)).toEqual({
            name: "Mäin Wierder",
            fileName: "main_wierder",
            flashcards: ["Moien", "Äddi", "Moien", "basic:Hi;Moien"],
            languages: ["EN"],
        });
    });

    it("overrides the name and languages", () => {
        const file = write("words.txt", "Moien\n");

        const deck = loadDeck(file, { name: "Greetings", languages: "en, fr,EN" });

        expect(deck.name).toBe("Greetings");
        expect(deck.fileName).toBe("words");
        expect(deck.languages).toEqual(["EN", "FR"]);
    });

    it("keeps JSON deck files unchanged unless overridden", () => {
        const json = { name: "Greetings", fileName: "greetings", flashcards: ["Moien"], languages: ["ALL", "PO"] };
        const file = write("deck.json", JSON.stringify(json));

        expect(loadDeck(file)).toEqual(json);
        expect(loadDeck(file, { languages: "FR" }).languages).toEqual(["FR"]);
    });

    it("rejects unknown languages", () => {
        const file = write("words.txt", "Moien\n");

        expect(() => loadDeck(file, { languages: "EN,DE" })).toThrow("Unknown language DE");
    });

    it("rejects a JSON deck without languages", () => {
        const file = write("deck.json", JSON.stringify({ name: "Greetings", fileName: "greetings", flashcards: ["Moien"] }));

        expect(() => loadDeck(file)).toThrow("The deck has no languages");
    });

    it("sets the audio mode and rejects unknown ones", () => {
        const file = write("words.txt", "Moien\n");

        expect(loadDeck(file).audio).toBeUndefined();
        expect(loadDeck(file, { audio: "Online" }).audio).toBe("online");
        expect(() => loadDeck(file, { audio: "stream" })).toThrow("Unknown audio mode stream");
    });
});
