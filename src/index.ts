#!/usr/bin/env node
import { Cli } from "./controllers/cli";
import { AudioProvider } from "./services/audio-provider";
import { DeckExporter } from "./services/exporters/deck-exporter";
import { LodContentExporter } from "./services/exporters/lod-content-exporter";

const cli = new Cli(new DeckExporter(new LodContentExporter(new AudioProvider())));

cli.main(process.argv).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
