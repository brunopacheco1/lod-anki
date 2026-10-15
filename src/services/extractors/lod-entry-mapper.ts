import { Word, WordMeaning, WordTranslation, WordType, WordTypeDetails, WordUsageExample } from "../../model/word";
import { child, children, descendants, textOf, XmlNode } from "./xml-tree";

const WORD_TYPES: { [partOfSpeech: string]: string } = {
    SUBST: "noun",
    NP: "noun",
    VRB: "verb",
    ADJ: "adjective",
    ADV: "adverb",
    PREP: "preposition",
    CONJ: "conjunction",
    NB: "numeral",
};

// LOD language codes mapped to the language keys used by deck files.
const LANGUAGES: { [lang: string]: string } = {
    de: "ALL",
    fr: "FR",
    pt: "PO",
    en: "EN",
    nl: "NL",
};

const NO_SPACE_BEFORE = /^[,.!?;:)]/;

/**
 * Maps one `<entry>` of the LOD linguistic dataset (data.public.lu) to the words it defines,
 * keeping only the word types lod-anki can export.
 */
export function mapEntry(entry: XmlNode, generateId: (word: string) => string): Word[] {
    const lodKey = entry.attributes["id"];
    const word = textOf(child(entry, "lemma"));
    if (!lodKey || !word) {
        return [];
    }

    const types: WordType[] = [];
    for (const microStructure of children(entry, "microStructure")) {
        const partOfSpeechNode = child(microStructure, "partOfSpeech");
        const partOfSpeech = textOf(partOfSpeechNode);
        const type = WORD_TYPES[partOfSpeech];
        if (!type) {
            continue;
        }
        types.push({
            type,
            lodKey,
            details: {
                ...mapDetails(partOfSpeech, partOfSpeechNode!, microStructure),
                audio: `${lodKey.toLowerCase()}.m4a`,
            },
            meanings: descendants(microStructure, "meaning").map((meaning) => mapMeaning(partOfSpeech, meaning)),
        });
    }

    if (types.length === 0) {
        return [];
    }
    return [{ id: generateId(word), word, types }];
}

function mapDetails(partOfSpeech: string, partOfSpeechNode: XmlNode, microStructure: XmlNode): WordTypeDetails {
    switch (partOfSpeech) {
        case "SUBST":
        case "NP": {
            const plural = descendants(microStructure, "inflection")
                .find((inflection) => inflection.attributes["type"] === "plural");
            return {
                nounGender: partOfSpeechNode.attributes["gen"],
                nounCategory: partOfSpeech === "NP" ? "NOM-PROPRE" : undefined,
                plural: plural ? textOf(child(plural, "form")) || undefined : undefined,
            };
        }
        case "VRB":
            return {
                auxiliaryVerb: textOf(child(microStructure, "auxiliaryVerb")) || undefined,
                pastParticiples: children(microStructure, "pastParticiple").map(textOf),
            };
        default:
            return {};
    }
}

function mapMeaning(partOfSpeech: string, meaning: XmlNode): WordMeaning {
    const translations: WordTranslation[] = children(meaning, "targetLanguage")
        .filter((targetLanguage) => !!LANGUAGES[targetLanguage.attributes["lang"]])
        .map((targetLanguage) => ({
            language: LANGUAGES[targetLanguage.attributes["lang"]],
            translation: joinTexts(children(targetLanguage, "translation")),
            complement: joinTexts(children(targetLanguage, "semanticClarifier")),
        }));

    const grammaticalInformation = joinTexts(children(meaning, "grammaticalInformation"));
    return {
        translations,
        examples: children(child(meaning, "examples"), "example").map(mapExample),
        synonyms: descendants(child(meaning, "synonyms"), "synonym").map(textOf),
        polyLex: textOf(child(meaning, "secondaryHeadword")) || undefined,
        case: partOfSpeech === "PREP" ? grammaticalInformation : undefined,
    };
}

function mapExample(example: XmlNode): WordUsageExample {
    const text = child(example, "text");
    const attributes = children(text, "attribute").map(textOf);
    let sentence = joinWords(text);
    const gloss = joinWords(child(example, "gloss"));
    if (gloss) {
        sentence += ` (${gloss})`;
    }
    return {
        usage: attributes.length > 0 ? attributes.join(" ") : "ALLG",
        example: sentence,
    };
}

function joinWords(node: XmlNode | undefined): string {
    let sentence = "";
    for (const item of node?.children || []) {
        if (item.name !== "word" && item.name !== "inflectedHeadword") {
            continue;
        }
        const token = textOf(item);
        if (!token) {
            continue;
        }
        const glue = sentence === "" || sentence.endsWith("'") || NO_SPACE_BEFORE.test(token) ? "" : " ";
        sentence += glue + token;
    }
    return sentence;
}

function joinTexts(nodes: XmlNode[]): string | undefined {
    const texts = nodes.map(textOf).filter((text) => !!text);
    return texts.length > 0 ? texts.join(", ") : undefined;
}
