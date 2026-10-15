import { Word, WordType } from "../../model/word";
import { label } from "../label-provider";

const HIGHLIGHT = "<span style=\"color: #b00c12;\">";

/** Builds the bold header of a word type: link to lod.lu, type, grammar details and audio. */
export function wordTypeHeader(language: string, word: Word, type: WordType): string {
    let content = `<b><a href="https://lod.lu/artikel/${type.lodKey}">${word.word}</a> `;
    switch (type.type) {
        case "noun": content += nounDescription(language, type); break;
        case "verb": content += verbDescription(language, type); break;
        default: content += label(type.type.toUpperCase(), language); break;
    }
    if (type.details.variationOfLodKey) {
        content += ` - ${label(type.details.variationType!, language)} ${type.details.variationOf}`;
    }
    if (type.details.audio) {
        content += ` [sound:${type.details.audio}]`;
    }
    return `${content}</b>`;
}

function nounDescription(language: string, type: WordType): string {
    const { nounCategory, nounGender, plural } = type.details;
    let description = label(type.type.toUpperCase(), language);
    if (nounCategory === "NOM-PROPRE") {
        description = label("PROPER_NOUN", language);
    } else if (nounGender) {
        description = label(`${nounGender.toUpperCase()}_${type.type.toUpperCase()}`, language);
    }
    if (nounGender === "INDEF") {
        description += ` (${label("NO_SINGULAR", language)})`;
    } else if (plural) {
        description += ` (${label("PLURAL", language)} ${HIGHLIGHT}${plural}</span>)`;
    }
    return description;
}

function verbDescription(language: string, type: WordType): string {
    const { auxiliaryVerb, pastParticiples } = type.details;
    const forms: string[] = [];
    if (auxiliaryVerb) {
        forms.push(`${label("AUXILIARY_VERB", language)} ${HIGHLIGHT}${auxiliaryVerb.toLowerCase()}</span>`);
    }
    if (pastParticiples && pastParticiples.length > 0) {
        forms.push(`${label("PAST_PARTICIPLE", language)} ${HIGHLIGHT}${pastParticiples.join(" / ")}</span>`);
    }
    const description = label(type.type.toUpperCase(), language);
    return forms.length > 0 ? `${description} (${forms.join(", ")})` : description;
}
