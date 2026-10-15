import { Command } from "commander";
import { injectable, inject } from "inversify";
import kleur from "kleur";
import figlet from "figlet";
import { TYPES } from "../services/types";
import { LodContentExtractor } from "../services/extractors/lod-content-extractor";
import * as fs from "fs";
import * as path from "path";
import { Deck } from "../model/word";
import { DeckExporter } from "../services/exporters/deck-exporter";
import { CONSTANTS } from "../model/constants";
const pkg = require("../../package.json");

@injectable()
export class Cli {

    private readonly _MINIMUM_ARG_SIZE = 2;

    constructor(
        @inject(TYPES.LodContentExtractor) private readonly lodContentExtractor: LodContentExtractor,
        @inject(TYPES.DeckExporter) private readonly deckExporter: DeckExporter) { }

    public main(argv: string[]): void {
        console.log(
            kleur.red(
                figlet.textSync("LOD to Anki", { horizontalLayout: "full" }),
            ),
        );

        const command = new Command();

        command.option("-o, --output <directory>", "The output directory", process.cwd());
        command.option("-d, --data <directory>", "The extracted LOD data folder (default: ./lod)");

        command.version(pkg.version, "-v, --version")
            .usage("<command> [options]");

        command.command("extract <lodDump>")
            .description("extract words definitions from LOD dump file")
            .action(async (lodDump: any) => {
                const lodDumpFile = path.resolve(lodDump);
                await this.lodContentExtractor.extract(lodDumpFile, command.opts().output);
            });

        command.command("export <deck>")
            .description("export deck into Anki apkg format")
            .action(async (deckPath: any) => {
                const deckFile = path.resolve(deckPath);
                if (!fs.existsSync(deckFile)) {
                    this.fail(`Deck file not found: ${deckFile}`);
                }
                const dataDirectory = this.resolveDataDirectory(command.opts().data, command.opts().output);
                const deck: Deck = JSON.parse(fs.readFileSync(deckFile).toString());
                await this.deckExporter.export(deck, command.opts().output, dataDirectory);
            });

        command.parse(argv);

        if (argv.length <= this._MINIMUM_ARG_SIZE) {
            command.help();
        }
    }

    private resolveDataDirectory(data: string | undefined, output: string): string {
        const candidates = data
            ? [path.resolve(data), path.resolve(data, CONSTANTS.DATA_FOLDER)]
            : [path.resolve(output, CONSTANTS.DATA_FOLDER), path.resolve(CONSTANTS.DATA_FOLDER)];
        const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, CONSTANTS.WORDS_FOLDER)));
        if (!found) {
            this.fail([
                "LOD data not found. Looked for a 'words' folder in:",
                ...[...new Set(candidates)].map((candidate) => `  - ${candidate}`),
                "Download and extract the LOD data (see README), then either run lod-anki from the folder",
                "that contains the 'lod' folder, or pass its location with --data <path/to/lod>.",
            ].join("\n"));
        }
        return found!;
    }

    private fail(message: string): never {
        console.error(kleur.red(message));
        process.exit(1);
    }
}
