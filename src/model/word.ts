export interface Dictionary {
    name: string,
    words: string[],
    language: string
}

export interface Word {
    id: string,
    word: string,
    types: WordType[]
}

export interface WordType {
    type: string,
    details: WordTypeDetails,
    meanings: WordMeaning[]
}

export interface WordTypeDetails {
    auxiliaryVerb?: string,
    pastParticiple?: string,
    nounGender?: string,
    plural?: string,
    variationOf?: string,
    variationOfLodKey?: string
}

export interface WordMeaning {
    index: number,
    lodKey: string,
    details: WordMeaningDetails,
    translations: WordTranslation[]
}

export interface WordMeaningDetails {
    polyLex?: string,
}

export interface WordTranslation {
    language: string,
    translation: string,
    complement?: string,
}