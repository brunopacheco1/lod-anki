export interface Dictionary {
    name: string,
    words: string[],
    language: string
}

export interface Word {
    id: string,
    word: string,
    type: string,
    wordDetails: WordDetails,
    meanings: WordMeaning[]
}

export interface WordDetails {
    auxiliaryVerb: string,
    pastParticiple: string,
    nounGender: string,
    plural: string,
    variationOf: string,
    variationOfLodKey: string
}

export interface WordMeaning {
    id: string,
    lodKey: string,
    index: number,
    details: WordMeaningDetails,
    translations: WordTranslation[]
}

export interface WordMeaningDetails {
    polyLex: string,
    verbGroup: string,
}

export interface WordTranslation {
    language: string,
    translation: string,
    complement: string,
}