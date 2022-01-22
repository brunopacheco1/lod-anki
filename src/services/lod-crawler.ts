import { inject, injectable } from "inversify";
import {Builder, By, until, WebDriver, WebElement} from "selenium-webdriver"; 
import { TYPES } from "../types";
import { FileOutputStream } from "./file-output-stream";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { Dictionary } from "../model/word";
import { KeyGenerator } from "./key-generator";
import { CONSTANTS } from "../constants";

export interface LodCrawler {
    fetch(dictionary: Dictionary, outputDirectory: string): Promise<void>;
}

@injectable()
export class LodCrawlerImpl implements LodCrawler {


    constructor(
        @inject(TYPES.FileOutputStream) private readonly outputStream: FileOutputStream,
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator
    ) { }

    public async fetch(dictionary: Dictionary, outputDirectory: string): Promise<void> {
        const lodTempFolder = path.join(outputDirectory, CONSTANTS.LOD_TEMP_FOLDER);
        const driver = await new Builder().forBrowser("safari").build();

        for (const word of dictionary.words) {
            try {
                console.log(`Fetching [${word}]...`)
                for (let index = 1;; index++) {
                    const lodKey = this.keyGenerator.generateLodKey(word, index);
                    
                    if(this.wordExists(lodKey, lodTempFolder)) {
                        console.warn(`${lodKey} fetched before.`);
                        continue;
                    }

                    const meanings = await this.retrieveMeanings(lodKey, driver);
                    if(meanings === null) {
                        break;
                    }

                    await this.persistHtml(lodKey, meanings, lodTempFolder, CONSTANTS.MEANINGS_SUFFIX);
                    await this.persistMp3(lodKey, lodTempFolder);

                    console.log(`${lodKey} was fetched.`);
                }
            } catch(exception) {
                console.error(exception);
            }
        }

        await driver.quit();
    }

    private wordExists(lodKey: string, outputDirectory: string): boolean {
        const existsMp3 = fs.existsSync(path.join(outputDirectory, `${lodKey.toLowerCase()}.mp3`));
        const existsMeanings = fs.existsSync(path.join(outputDirectory, `${lodKey.toLowerCase()}${CONSTANTS.MEANINGS_SUFFIX}`));
        return existsMeanings && existsMp3;
    }

    private async retrieveMeanings(lodKey: string, driver: WebDriver): Promise<WebElement | null> {
        await driver.get(`https://www.lod.lu/?${lodKey}`);
        const articleFrame = await driver.findElement(By.id("art"));
        await driver.wait(until.ableToSwitchToFrame(articleFrame));

        const elements = await driver.findElements(By.className("artikel"));
        if(elements.length > 1) {
            console.error(`More than one article for ${lodKey}.`);
            return null;
        }
        if(elements.length === 1) {
            await driver.wait(until.elementIsVisible(elements[0]));
            return elements[0];
        }
        console.warn(`No articles for ${lodKey}.`);
        return null;
    }

    private async persistHtml(lodKey: string, article: WebElement, outputDirectory: string, suffix: string): Promise<void> {
        const html = await article.getAttribute("innerHTML");
        const htmlInBase64 = Buffer.from(html).toString("base64");
        this.outputStream.write(outputDirectory, `${lodKey.toLowerCase()}${suffix}`, htmlInBase64);
    }

    private async persistMp3(lodKey: string, outputDirectory: string): Promise<void> {
        https.get(`https://www.lod.lu/audio/${lodKey.toLowerCase()}.mp3`, (response) => {
            response.setEncoding("base64");
            let body = "";
            response.on("data", (data) => { body += data});
            response.on("end", () => {
                this.outputStream.write(outputDirectory, `${lodKey.toLowerCase()}.mp3`, body);
            });
        });
    }
}
