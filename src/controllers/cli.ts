import { Command } from "commander";
import { injectable, inject } from "inversify";
import kleur from "kleur";
import figlet from "figlet";
import { TYPES } from "../types";
import { LodAudioCrawler } from "../services/lod-audio-crawler";
import { WordExtractor } from "../services/word-extractor";
import * as fs from "fs";
import * as path from "path";
import { Dictionary } from "../model/word";
import { DeckExporter } from "../services/deck-exporter";
const pkg = require("../../package.json");

@injectable()
export class Cli {

    private readonly _MINIMUM_ARG_SIZE = 2;

    constructor(
        @inject(TYPES.LodAudioCrawler) private readonly lodCrawler: LodAudioCrawler,
        @inject(TYPES.WordExtractor) private readonly wordExtractor: WordExtractor,
        @inject(TYPES.DeckExporter) private readonly deckExporter: DeckExporter) { }

    public main(argv: string[]): void {
        console.log(
            kleur.red(
                figlet.textSync("LOD to Anki", { horizontalLayout: "full" }),
            ),
        );

        const command = new Command();

        command.option("-o, --output <directory>", "The output directory", process.cwd());

        command.version(pkg.version, "-v, --version")
            .usage("<command> [options]");

        command.command("fetchaudio <wordList>")
            .description("fetch mp3 of all words")
            .action(async (wordList: any) => {
                const wordListFile = path.join(process.cwd(), wordList);
                const wordListArray: string[] = fs.readFileSync(wordListFile).toString().split("\n");
                await this.lodCrawler.fetch(wordListArray, command.opts().output);
            });

        command.command("extract <lodDump>")
            .description("extract words definitions from LOD dump file")
            .action(async (lodDump: any) => {
                const lodDumpFile = path.join(process.cwd(), lodDump);
                await this.wordExtractor.extract(lodDumpFile, command.opts().output);
            });

        command.command("export <dictionary>")
            .description("export dictionary into Anki txt file")
            .action(async (dictionaryPath: any) => {
                const dictionaryFile = path.join(process.cwd(), dictionaryPath);
                const dictionary: Dictionary = JSON.parse(fs.readFileSync(dictionaryFile).toString());
                await this.deckExporter.export(dictionary, command.opts().output);
            });

        command.parse(argv);

        if (argv.length <= this._MINIMUM_ARG_SIZE) {
            command.help();
        }
    }
}
