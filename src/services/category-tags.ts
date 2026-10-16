import categories from "../resources/categories.json";
import { label } from "./label-provider";

type LabelLanguage = "de" | "en" | "fr" | "pt";
type Labels = { [code: string]: { [language in LabelLanguage]: string } };

const LEVEL = /^[ABC][12]$/;
const topics: Labels = categories.topics;
const wordTypes: Labels = categories.wordTypes;
const hidden = new Set(categories.hidden);

function labelLanguage(language: string): LabelLanguage {
    switch (language.toLowerCase()) {
        case "all": return "de";
        case "po": return "pt";
        case "fr": return "fr";
        default: return "en";
    }
}

/** Builds a hierarchical Anki tag such as "LOD::Topic::Animals"; Anki tags cannot contain spaces. */
function tag(...parts: string[]): string {
    return ["LOD", ...parts].map((part) => part.replace(/\s+/g, "_")).join("::");
}

/**
 * Returns the Anki tag of a LOD category in the deck language: CEFR levels stay as they are (A1),
 * topics become hierarchical tags such as "LOD::Topic::Animals". Internal LOD markers get no tag.
 */
export function categoryTag(category: string, language: string): string | undefined {
    if (LEVEL.test(category)) {
        return category;
    }
    if (hidden.has(category)) {
        return undefined;
    }
    const lang = labelLanguage(language);
    return tag(categories.topic[lang], topics[category]?.[lang] || category);
}

/** Returns the Anki tag of a word type in the deck language, such as "LOD::Word_type::Noun". */
export function wordTypeTag(type: string, language: string): string {
    const lang = labelLanguage(language);
    return tag(categories.wordType[lang], wordTypes[type]?.[lang] || type);
}

/** Returns the Anki tag of a register (usage flag of an example such as EGS), such as "LOD::Register::Colloquial". */
export function registerTag(usage: string, language: string): string {
    const name = label(`${usage}_USAGE`, language);
    return tag(categories.register[labelLanguage(language)], name.charAt(0).toUpperCase() + name.slice(1));
}
