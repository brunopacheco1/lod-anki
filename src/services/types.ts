const TYPES = {
    Cli: Symbol.for("Cli"),

    BasicCardExporter: Symbol.for("BasicCardExporter"),
    ClozeCardExporter: Symbol.for("ClozeCardExporter"),

    BaseLodWordExporter: Symbol.for("BaseLodWordExporter"),
    DeckExporter: Symbol.for("DeckExporter"),
    LodContentExporter: Symbol.for("LodContentExporter"),
    NounExporter: Symbol.for("NounExporter"),
    VerbExporter: Symbol.for("VerbExporter"),

    BaseLodWordExtractor: Symbol.for("BaseLodWordExtractor"),
    LodContentExtractor: Symbol.for("LodContentExtractor"),
    NounExtractor: Symbol.for("NounExtractor"),
    PrepositionExtractor: Symbol.for("PrepositionExtractor"),
    VerbExtractor: Symbol.for("VerbExtractor"),

    FileWriter: Symbol.for("FileWriter"),
    LabelProvider: Symbol.for("LabelProvider"),
    WordIdGenerator: Symbol.for("WordIdGenerator")
};

export { TYPES };
