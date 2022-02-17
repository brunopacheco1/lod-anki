const TYPES = {
    Cli: Symbol.for("Cli"),
    LodContentExtractor: Symbol.for("LodContentExtractor"),
    NounExtractor: Symbol.for("NounExtractor"),
    AdjectiveExtractor: Symbol.for("AdjectiveExtractor"),
    AdverbExtractor: Symbol.for("AdverbExtractor"),
    VerbExtractor: Symbol.for("VerbExtractor"),
    LodAudioCrawler: Symbol.for("LodAudioCrawler"),
    WordIdGenerator: Symbol.for("WordIdGenerator"),
    FileWriter: Symbol.for("FileWriter"),
    AdjectiveExporter: Symbol.for("AdjectiveExporter"),
    AdverbExporter: Symbol.for("AdverbExporter"),
    NounExporter: Symbol.for("NounExporter"),
    VerbExporter: Symbol.for("VerbExporter"),
    BasicCardExporter: Symbol.for("BasicCardExporter"),
    LodContentExporter: Symbol.for("LodContentExporter"),
    ClozeCardExporter: Symbol.for("ClozeCardExporter"),
    DeckExporter: Symbol.for("DeckExporter"),
    LabelProvider: Symbol.for("LabelProvider"),
    ConjunctionExtractor: Symbol.for("ConjunctionExtractor"),
    PrepositionExtractor: Symbol.for("PrepositionExtractor")
};

export { TYPES };
