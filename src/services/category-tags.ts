import categories from "../resources/categories.json";

type LabelLanguage = "de" | "en" | "fr" | "pt";

const LEVEL = /^[ABC][12]$/;
const topics: { [code: string]: { [language in LabelLanguage]: string } } = categories.topics;
const hidden = new Set(categories.hidden);

function labelLanguage(language: string): LabelLanguage {
    switch (language.toLowerCase()) {
        case "all": return "de";
        case "po": return "pt";
        case "fr": return "fr";
        default: return "en";
    }
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
    // Anki tags cannot contain spaces.
    const topic = (topics[category]?.[lang] || category).replace(/\s+/g, "_");
    return `LOD::${categories.topic[lang]}::${topic}`;
}
