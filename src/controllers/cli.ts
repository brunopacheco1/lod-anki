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
const pkg = require("../../package.json");

@injectable()
export class Cli {

    private readonly _MINIMUM_ARG_SIZE = 2;

    constructor(
        @inject(TYPES.LodAudioCrawler) private readonly lodCrawler: LodAudioCrawler,
        @inject(TYPES.WordExtractor) private readonly wordExtractor: WordExtractor) { }

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
            .description("fetch mp3 from a text file containing the words you want to fecth")
            .action(async (wordList: any) => {
                const wordListFile = path.join(process.cwd(), wordList);
                const wordListArray: string[] = fs.readFileSync(wordListFile).toString().split("\n");
                await this.lodCrawler.fetch(wordListArray, command.opts().output);
            });

        command.command("extract <wordList>")
            .description("extract wordList definitions to JSON")
            .action(async (wordList: any) => {
                const wordListFile = path.join(process.cwd(), wordList);
                const wordListArray: string[] = fs.readFileSync(wordListFile).toString().split("\n");
                await this.wordExtractor.extract(wordListArray, command.opts().output);
            });

        command.command("generate <dictionary>")
            .description("generate anki dictionary from a JSON")
            .action(async (dictionaryPath: any) => {
            });

        command.parse(argv);

        if (argv.length <= this._MINIMUM_ARG_SIZE) {
            command.help();
        }
    }
}
