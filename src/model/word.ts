export interface Deck {
    name: string,
    fileName: string,
    types?: string[],
    /** LOD categories such as CEFR levels (A1) or topics (FAMILL); without flashcards, the deck holds every word in them. */
    categories?: string[],
    flashcards?: string[],
    languages: string[]
}

export interface Word {
    id: string,
    word: string,
    types: WordType[]
}

export interface WordType {
    type: string,
    lodKey: string,
    details: WordTypeDetails,
    meanings: WordMeaning[],
    /** LOD categories of the entry, such as CEFR levels (A1) and topics (FAMILL). */
    categories?: string[]
}

export interface WordTypeDetails {
    auxiliaryVerb?: string,
    pastParticiples?: string[],
    nounGender?: string,
    nounCategory?: string,
    plural?: string,
    variationOf?: string,
    variationOfLodKey?: string,
    variationType?: string,
    verbCategory?: string,
    audio?: string
}

export interface WordMeaning {
    translations: WordTranslation[],
    examples?: WordUsageExample[],
    synonyms?: string[],
    polyLex?: string,
    case?: string,
    reflexivePronoun?: string,
    employsImpersonal?: string
}

export interface WordUsageExample {
    usage: string,
    example: string
}

export interface WordTranslation {
    language: string,
    translation?: string,
    complement?: string,
}
