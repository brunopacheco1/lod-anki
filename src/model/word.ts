export interface Dictionary {
    name: string,
    fileName: string,
    words: string[],
    exportAll?: boolean
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
    imperative?: string,
    nounGender?: string,
    nounCategory?: string,
    plural?: string,
    variationOf?: string,
    variationOfLodKey?: string
}

export interface WordMeaning {
    translations: WordTranslation[],
    examples?: WordUsageExample[],
    synonyms?: string[]
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