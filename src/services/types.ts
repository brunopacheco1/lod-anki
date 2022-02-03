const TYPES = {
    Cli: Symbol.for("Cli"),
    WordExtractor: Symbol.for("WordExtractor"),
    NounExtractor: Symbol.for("NounExtractor"),
    AdjectiveExtractor: Symbol.for("AdjectiveExtractor"),
    AdverbExtractor: Symbol.for("AdverbExtractor"),
    VerbExtractor: Symbol.for("VerbExtractor"),
    LodAudioCrawler: Symbol.for("LodAudioCrawler"),
    WordIdGenerator: Symbol.for("WordIdGenerator"),
    FileWriter: Symbol.for("FileWriter"),
    DeckExporter: Symbol.for("DeckExporter"),
    LabelProvider: Symbol.for("LabelProvider")
};

export { TYPES };
