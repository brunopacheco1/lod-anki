import { Command } from "commander";
import { injectable, inject } from "inversify";
import kleur from "kleur";
import figlet from "figlet";
import { TYPES } from "@services/types";
import { LodContentExtractor } from "@services/extractors/lod-content-extractor";
import * as fs from "fs";
import * as path from "path";
import { Deck } from "@model/word";
import { DeckExporter } from "@services/exporters/deck-exporter";
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

        command.version(pkg.version, "-v, --version")
            .usage("<command> [options]");

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
