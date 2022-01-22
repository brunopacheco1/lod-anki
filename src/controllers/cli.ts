import { Command } from "commander";
import { injectable, inject } from "inversify";
import kleur from "kleur";
import figlet from "figlet";
import { TYPES } from "../types";
import { LodCrawler } from "../services/lod-crawler";
import { WordExtractor } from "../services/word-extractor";
import * as fs from "fs";
import * as path from "path";
import { Dictionary } from "../model/word";
const pkg = require("../../package.json");

@injectable()
export class Cli {

    private readonly _MINIMUM_ARG_SIZE = 2;

    constructor(
        @inject(TYPES.LodCrawler) private readonly lodCrawler: LodCrawler,
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

            command.command("fetch <dictionary>")
            .description("fetch dictionary words definitions and mp3 from LOD.lu")
            .action(async (dictionaryPath: any) => {
                const dictionaryFile = path.join(process.cwd(), dictionaryPath);
                const dictionary: Dictionary = JSON.parse(fs.readFileSync(dictionaryFile).toString());
                await this.lodCrawler.fetch(dictionary, command.opts().output);
            });
        
        command.command("extract <dictionary>")
            .description("extract dictionary words definitions to JSON")
            .action(async (dictionaryPath: any) => {
                const dictionaryFile = path.join(process.cwd(), dictionaryPath);
                const dictionary: Dictionary = JSON.parse(fs.readFileSync(dictionaryFile).toString());
                await this.wordExtractor.extract(dictionary, command.opts().output);
            });

        command.parse(argv);

        if (argv.length <= this._MINIMUM_ARG_SIZE) {
            command.help();
        }
    }
}
