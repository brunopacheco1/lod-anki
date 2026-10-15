import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import kleur from "kleur";
import figlet from "figlet";
import { CONSTANTS } from "../model/constants";
import { Deck } from "../model/word";
import { loadDeck } from "../services/deck-loader";
import { DeckExporter } from "../services/exporters/deck-exporter";
import { extractLodContent } from "../services/extractors/lod-content-extractor";
import { cachedDataDirectory, downloadLodData, hasWords } from "../services/lod-data";

const MINIMUM_ARG_SIZE = 2;
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json")).toString()) as { version: string };

export class Cli {

    constructor(private readonly deckExporter: DeckExporter) { }

    public async main(argv: string[]): Promise<void> {
        console.log(kleur.red(figlet.textSync("LOD to Anki", { horizontalLayout: "full" })));

        const command = new Command("lod-anki");

        command.option("-o, --output <directory>", "The output directory", process.cwd());
        command.option("-d, --data <directory>", "The extracted LOD data folder (default: ./lod, or downloaded automatically)");

        command.version(pkg.version, "-v, --version")
            .usage("<command> [options]");

        command.command("extract <lodDump>")
            .description("extract words definitions from LOD dump file")
            .action(async (lodDump: string) => {
                await extractLodContent(path.resolve(lodDump), command.opts().output);
            });

        command.command("export <deck>")
            .description("export a deck file (.json, or .txt with one word per line) into Anki apkg format")
            .option("-l, --languages <codes>", "comma-separated card languages: ALL (German), EN, FR, PO (default: the deck's, or EN for a word list)")
            .option("-n, --name <name>", "the deck name shown in Anki (default: the deck's, or the word list's file name)")
            .action(async (deckPath: string, options: { languages?: string, name?: string }) => {
                const deckFile = path.resolve(deckPath);
                if (!fs.existsSync(deckFile)) {
                    this.fail(`Deck file not found: ${deckFile}`);
                }
                let deck: Deck;
                try {
                    deck = loadDeck(deckFile, options);
                } catch (error) {
                    this.fail(`Could not read ${deckFile}: ${error instanceof Error ? error.message : error}`);
                }
                const dataDirectory = await this.resolveDataDirectory(command.opts().data, command.opts().output);
                await this.deckExporter.export(deck, command.opts().output, dataDirectory);
            });

        command.command("update")
            .description("download the latest extracted LOD data")
            .action(async () => {
                const data: string | undefined = command.opts().data;
                await this.download(data ? path.resolve(data) : cachedDataDirectory());
            });

        if (argv.length <= MINIMUM_ARG_SIZE) {
            command.help();
        }
        await command.parseAsync(argv);
    }

    private async resolveDataDirectory(data: string | undefined, output: string): Promise<string> {
        if (data) {
            const candidates = [path.resolve(data), path.resolve(data, CONSTANTS.DATA_FOLDER)];
            const found = candidates.find(hasWords);
            if (!found) {
                this.fail([
                    "LOD data not found. Looked for a 'words' folder in:",
                    ...[...new Set(candidates)].map((candidate) => `  - ${candidate}`),
                    "Pass the folder that contains 'words' with --data, or leave --data out to download the data automatically.",
                ].join("\n"));
            }
            return found;
        }

        const local = [path.resolve(output, CONSTANTS.DATA_FOLDER), path.resolve(CONSTANTS.DATA_FOLDER)].find(hasWords);
        if (local) {
            return local;
        }
        const cached = cachedDataDirectory();
        if (!hasWords(cached)) {
            await this.download(cached);
        }
        return cached;
    }

    private async download(dataDirectory: string): Promise<void> {
        try {
            await downloadLodData(dataDirectory);
        } catch (error) {
            this.fail(`${error instanceof Error ? error.message : error}\nDownload lod.zip yourself (see README) and pass its 'lod' folder with --data.`);
        }
    }

    private fail(message: string): never {
        console.error(kleur.red(message));
        process.exit(1);
    }
}
