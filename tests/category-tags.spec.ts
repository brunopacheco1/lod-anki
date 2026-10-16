import { describe, expect, it } from "vitest";
import { categoryTag } from "../src/services/category-tags";

describe("Category tags", () => {
    it("keeps CEFR levels as they are", () => {
        expect(categoryTag("A1", "FR")).toBe("A1");
    });

    it("labels topics in the deck language", () => {
        expect(categoryTag("DEIER", "EN")).toBe("LOD::Topic::Animals");
        expect(categoryTag("DEIER", "FR")).toBe("LOD::Thème::Animaux");
        expect(categoryTag("DEIER", "ALL")).toBe("LOD::Thema::Tiere");
        expect(categoryTag("DEIER", "PO")).toBe("LOD::Tema::Animais");
    });

    it("replaces spaces, which Anki tags cannot hold", () => {
        expect(categoryTag("MUSEKSINSTRUMENT", "EN")).toBe("LOD::Topic::Musical_instruments");
    });

    it("drops internal LOD markers and keeps unknown topics by their code", () => {
        expect(categoryTag("CHECKVIDEO", "EN")).toBeUndefined();
        expect(categoryTag("GWS A1", "EN")).toBeUndefined();
        expect(categoryTag("NEW TOPIC", "EN")).toBe("LOD::Topic::NEW_TOPIC");
    });
});
