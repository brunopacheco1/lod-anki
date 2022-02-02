#!/usr/bin/env node
import "reflect-metadata";
import { Container } from "inversify";
import { Cli } from "./controllers/cli";
import { TYPES } from "./types";
import { WordExtractor, WordExtractorImpl } from "./services/word-extractor";
import { LodAudioCrawler, LodAudioCrawlerImpl } from "./services/lod-audio-crawler";
import { FileOutputStream, FileOutputStreamImpl } from "./services/file-output-stream";
import { KeyGenerator, KeyGeneratorImpl } from "./services/key-generator";
import { NounExtractor, NounExtractorImpl } from "./services/noun-extractor";
import { AdjectiveExtractor, AdjectiveExtractorImpl } from "./services/adjective-extractor";
import { AdverbExtractor, AdverbExtractorImpl } from "./services/adverb-extractor";
import { VerbExtractor, VerbExtractorImpl } from "./services/verb-extractor";
import { DeckExporter, DeckExporterImpl } from "./services/deck-exporter";
import { LabelProvider, LabelProviderImpl } from "./services/label-provider";

export function init(): Cli {
    const container: Container = new Container();

    container.bind<KeyGenerator>(TYPES.KeyGenerator).to(KeyGeneratorImpl).inSingletonScope();
    container.bind<NounExtractor>(TYPES.NounExtractor).to(NounExtractorImpl).inSingletonScope();
    container.bind<AdjectiveExtractor>(TYPES.AdjectiveExtractor).to(AdjectiveExtractorImpl).inSingletonScope();
    container.bind<AdverbExtractor>(TYPES.AdverbExtractor).to(AdverbExtractorImpl).inSingletonScope();
    container.bind<VerbExtractor>(TYPES.VerbExtractor).to(VerbExtractorImpl).inSingletonScope();
    container.bind<WordExtractor>(TYPES.WordExtractor).to(WordExtractorImpl).inSingletonScope();
    container.bind<LodAudioCrawler>(TYPES.LodAudioCrawler).to(LodAudioCrawlerImpl).inSingletonScope();
    container.bind<FileOutputStream>(TYPES.FileOutputStream).to(FileOutputStreamImpl).inSingletonScope();
    container.bind<DeckExporter>(TYPES.DeckExporter).to(DeckExporterImpl).inSingletonScope();
    container.bind<LabelProvider>(TYPES.LabelProvider).to(LabelProviderImpl).inSingletonScope();
    container.bind<Cli>(TYPES.Cli).to(Cli).inSingletonScope();

    return container.get<Cli>(TYPES.Cli);
}

const app: Cli = init();

app.main(process.argv);
