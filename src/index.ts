#!/usr/bin/env node
import "reflect-metadata";
import "module-alias/register";
import { Container } from "inversify";
import { Cli } from "@controllers/cli";
import { TYPES } from "@services/types";
import { LodContentExtractor, LodContentExtractorImpl } from "@services/extractors/lod-content-extractor";
import { LodAudioCrawler, LodAudioCrawlerImpl } from "@services/lod-audio-crawler";
import { FileWriter, FileWriterImpl } from "@services/file-writer";
import { WordIdGenerator, WordIdGeneratorImpl } from "@services/word-id-generator";
import { NounExtractor, NounExtractorImpl } from "@services/extractors/noun-extractor";
import { AdjectiveExtractor, AdjectiveExtractorImpl } from "@services/extractors/adjective-extractor";
import { AdverbExtractor, AdverbExtractorImpl } from "@services/extractors/adverb-extractor";
import { VerbExtractor, VerbExtractorImpl } from "@services/extractors/verb-extractor";
import { DeckExporter, DeckExporterImpl } from "@services/exporters/deck-exporter";
import { LabelProvider, LabelProviderImpl } from "@services/label-provider";
import { AdjectiveExporter, AdjectiveExporterImpl } from "@services/exporters/adjective-exporter";
import { AdverbExporter, AdverbExporterImpl } from "@services/exporters/adverb-exporter";
import { BasicCardExporter, BasicCardExporterImpl } from "@services/exporters/basic-card-exporter";
import { ClozeCardExporter, ClozeCardExporterImpl } from "@services/exporters/cloze-card-exporter";
import { NounExporter, NounExporterImpl } from "@services/exporters/noun-exporter";
import { VerbExporter, VerbExporterImpl } from "@services/exporters/verb-exporter";
import { LodContentExporter, LodContentExporterImpl } from "@services/exporters/lod-content-exporter";
import { ConjunctionExtractor, ConjunctionExtractorImpl } from "@services/extractors/conjunction-extractor";

export function init(): Cli {
    const container: Container = new Container();

    container.bind<WordIdGenerator>(TYPES.WordIdGenerator).to(WordIdGeneratorImpl).inSingletonScope();
    container.bind<NounExtractor>(TYPES.NounExtractor).to(NounExtractorImpl).inSingletonScope();
    container.bind<AdjectiveExtractor>(TYPES.AdjectiveExtractor).to(AdjectiveExtractorImpl).inSingletonScope();
    container.bind<AdverbExtractor>(TYPES.AdverbExtractor).to(AdverbExtractorImpl).inSingletonScope();
    container.bind<VerbExtractor>(TYPES.VerbExtractor).to(VerbExtractorImpl).inSingletonScope();
    container.bind<ConjunctionExtractor>(TYPES.ConjunctionExtractor).to(ConjunctionExtractorImpl).inSingletonScope();
    container.bind<LodContentExtractor>(TYPES.LodContentExtractor).to(LodContentExtractorImpl).inSingletonScope();
    container.bind<LodAudioCrawler>(TYPES.LodAudioCrawler).to(LodAudioCrawlerImpl).inSingletonScope();
    container.bind<FileWriter>(TYPES.FileWriter).to(FileWriterImpl).inSingletonScope();
    container.bind<AdjectiveExporter>(TYPES.AdjectiveExporter).to(AdjectiveExporterImpl).inSingletonScope();
    container.bind<AdverbExporter>(TYPES.AdverbExporter).to(AdverbExporterImpl).inSingletonScope();
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
