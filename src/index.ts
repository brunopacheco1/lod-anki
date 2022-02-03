#!/usr/bin/env node
import "reflect-metadata";
import "module-alias/register";
import { Container } from "inversify";
import { Cli } from "@controllers/cli";
import { TYPES } from "@services/types";
import { WordExtractor, WordExtractorImpl } from "@services/extractors/word-extractor";
import { LodAudioCrawler, LodAudioCrawlerImpl } from "@services/lod-audio-crawler";
import { FileWriter, FileWriterImpl } from "@services/file-writer";
import { WordIdGenerator, WordIdGeneratorImpl } from "@services/word-id-generator";
import { NounExtractor, NounExtractorImpl } from "@services/extractors/noun-extractor";
import { AdjectiveExtractor, AdjectiveExtractorImpl } from "@services/extractors/adjective-extractor";
import { AdverbExtractor, AdverbExtractorImpl } from "@services/extractors/adverb-extractor";
import { VerbExtractor, VerbExtractorImpl } from "@services/extractors/verb-extractor";
import { DeckExporter, DeckExporterImpl } from "@services/exporters/deck-exporter";
import { LabelProvider, LabelProviderImpl } from "@services/label-provider";

export function init(): Cli {
    const container: Container = new Container();

    container.bind<WordIdGenerator>(TYPES.WordIdGenerator).to(WordIdGeneratorImpl).inSingletonScope();
    container.bind<NounExtractor>(TYPES.NounExtractor).to(NounExtractorImpl).inSingletonScope();
    container.bind<AdjectiveExtractor>(TYPES.AdjectiveExtractor).to(AdjectiveExtractorImpl).inSingletonScope();
    container.bind<AdverbExtractor>(TYPES.AdverbExtractor).to(AdverbExtractorImpl).inSingletonScope();
    container.bind<VerbExtractor>(TYPES.VerbExtractor).to(VerbExtractorImpl).inSingletonScope();
    container.bind<WordExtractor>(TYPES.WordExtractor).to(WordExtractorImpl).inSingletonScope();
    container.bind<LodAudioCrawler>(TYPES.LodAudioCrawler).to(LodAudioCrawlerImpl).inSingletonScope();
    container.bind<FileWriter>(TYPES.FileWriter).to(FileWriterImpl).inSingletonScope();
    container.bind<DeckExporter>(TYPES.DeckExporter).to(DeckExporterImpl).inSingletonScope();
    container.bind<LabelProvider>(TYPES.LabelProvider).to(LabelProviderImpl).inSingletonScope();
    container.bind<Cli>(TYPES.Cli).to(Cli).inSingletonScope();

    return container.get<Cli>(TYPES.Cli);
}

const app: Cli = init();

app.main(process.argv);
