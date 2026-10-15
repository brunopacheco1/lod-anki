#!/usr/bin/env node
import "reflect-metadata";
import { Container } from "inversify";
import { Cli } from "./controllers/cli";
import { TYPES } from "./services/types";
import { LodContentExtractor, LodContentExtractorImpl } from "./services/extractors/lod-content-extractor";
import { FileWriter, FileWriterImpl } from "./services/file-writer";
import { AudioProvider, AudioProviderImpl } from "./services/audio-provider";
import { WordIdGenerator, WordIdGeneratorImpl } from "./services/word-id-generator";
import { DeckExporter, DeckExporterImpl } from "./services/exporters/deck-exporter";
import { LabelProvider, LabelProviderImpl } from "./services/label-provider";
import { BasicCardExporter, BasicCardExporterImpl } from "./services/exporters/basic-card-exporter";
import { ClozeCardExporter, ClozeCardExporterImpl } from "./services/exporters/cloze-card-exporter";
import { NounExporter, NounExporterImpl } from "./services/exporters/noun-exporter";
import { VerbExporter, VerbExporterImpl } from "./services/exporters/verb-exporter";
import { LodContentExporter, LodContentExporterImpl } from "./services/exporters/lod-content-exporter";
import { BaseLodWordExporter, BaseLodWordExporterImpl } from "./services/exporters/base-lod-word-exporter";

export function init(): Cli {
    const container: Container = new Container();

    container.bind<WordIdGenerator>(TYPES.WordIdGenerator).to(WordIdGeneratorImpl).inSingletonScope();
    container.bind<LodContentExtractor>(TYPES.LodContentExtractor).to(LodContentExtractorImpl).inSingletonScope();
    container.bind<FileWriter>(TYPES.FileWriter).to(FileWriterImpl).inSingletonScope();
    container.bind<AudioProvider>(TYPES.AudioProvider).to(AudioProviderImpl).inSingletonScope();
    container.bind<BaseLodWordExporter>(TYPES.BaseLodWordExporter).to(BaseLodWordExporterImpl).inSingletonScope();
    container.bind<BasicCardExporter>(TYPES.BasicCardExporter).to(BasicCardExporterImpl).inSingletonScope();
    container.bind<ClozeCardExporter>(TYPES.ClozeCardExporter).to(ClozeCardExporterImpl).inSingletonScope();
    container.bind<NounExporter>(TYPES.NounExporter).to(NounExporterImpl).inSingletonScope();
    container.bind<VerbExporter>(TYPES.VerbExporter).to(VerbExporterImpl).inSingletonScope();
    container.bind<LodContentExporter>(TYPES.LodContentExporter).to(LodContentExporterImpl).inSingletonScope();
    container.bind<DeckExporter>(TYPES.DeckExporter).to(DeckExporterImpl).inSingletonScope();
    container.bind<LabelProvider>(TYPES.LabelProvider).to(LabelProviderImpl).inSingletonScope();
    container.bind<Cli>(TYPES.Cli).to(Cli).inSingletonScope();

    return container.get<Cli>(TYPES.Cli);
}

const app: Cli = init();

app.main(process.argv);
