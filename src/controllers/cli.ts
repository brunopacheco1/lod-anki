import { Command } from "commander";
import { injectable, inject } from "inversify";
import kleur from "kleur";
import figlet from "figlet";
import { TYPES } from "@services/types";
import { LodAudioCrawler } from "@services/lod-audio-crawler";
import { LodContentExtractor } from "@services/extractors/lod-content-extractor";
import * as fs from "fs";
import * as path from "path";
import { Deck } from "@model/word";
import { DeckExporter } from "@services/exporters/deck-exporter";
import { execSync } from "child_process";
const pkg = require("../../package.json");

@injectable()
export class Cli {

    private readonly _MINIMUM_ARG_SIZE = 2;

    constructor(
        @inject(TYPES.LodAudioCrawler) private readonly lodCrawler: LodAudioCrawler,
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

        command.version(pkg.version, "-v, --version")
            .usage("<command> [options]");

        command.command("convert-all <wordList>")
            .description("convert all mp3 into aac")
            .action(async (wordList: any) => {
                const wordListFile = path.join(process.cwd(), wordList);
                const wordListArray: string[] = fs.readFileSync(wordListFile).toString().split("\n");
                for (const lodKey of wordListArray) {
                    const mp3File = path.join(command.opts().output, "lod/audios", `${lodKey.toLowerCase().trim()}.mp3`);
                    const m4aFile = path.join(command.opts().output, "lod/audios", `${lodKey.toLowerCase().trim()}.m4a`);
                    if(!fs.existsSync(m4aFile)) {
                        try {
                            execSync(`ffmpeg -y -i "${mp3File}" -map a:0 -c:a aac "${m4aFile}"`);
                        } catch(error) {
                            console.log(error);
                        }
                    }
                }
            });

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
                await this.lodContentExtractor.extract(lodDumpFile, command.opts().output);
            });

        command.command("export <deck>")
            .description("export deck into Anki apkg format")
            .action(async (deckPath: any) => {
                const deckFile = path.join(process.cwd(), deckPath);
                const deck: Deck = JSON.parse(fs.readFileSync(deckFile).toString());
                await this.deckExporter.export(deck, command.opts().output);
            });

        command.parse(argv);

        if (argv.length <= this._MINIMUM_ARG_SIZE) {
            command.help();
        }
    }
}
