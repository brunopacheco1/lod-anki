#!/usr/bin/env node
import "reflect-metadata";
import { Container } from "inversify";
import { Cli } from "./controllers/cli";
import { TYPES } from "./types";
import { WordExtractor, WordExtractorImpl } from "./services/word-extractor";
import { LodCrawler, LodCrawlerImpl } from "./services/lod-crawler";
import { FileOutputStream, FileOutputStreamImpl } from "./services/file-output-stream";
import { KeyGenerator, KeyGeneratorImpl } from "./services/key-generator";

export function init(): Cli {
    const container: Container = new Container();

    container.bind<KeyGenerator>(TYPES.KeyGenerator).to(KeyGeneratorImpl).inSingletonScope();
    container.bind<WordExtractor>(TYPES.WordExtractor).to(WordExtractorImpl).inSingletonScope();
    container.bind<LodCrawler>(TYPES.LodCrawler).to(LodCrawlerImpl).inSingletonScope();
    container.bind<FileOutputStream>(TYPES.FileOutputStream).to(FileOutputStreamImpl).inSingletonScope();
    container.bind<Cli>(TYPES.Cli).to(Cli).inSingletonScope();

    return container.get<Cli>(TYPES.Cli);
}

const app: Cli = init();

app.main(process.argv);
