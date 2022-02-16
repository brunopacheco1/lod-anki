export interface Deck {
    name: string,
    fileName: string,
    flashcards: string[],
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
    meanings: WordMeaning[]
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
}

export interface WordMeaning {
    translations: WordTranslation[],
    examples?: WordUsageExample[],
    synonyms?: string[],
    polyLex?: string,
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
