import { injectable } from "inversify";
import * as crypto from "crypto";

export interface KeyGenerator {
    generateLodKey(word: string, index: number): string;
    generateWordKey(word: string): string;
}

@injectable()
export class KeyGeneratorImpl implements KeyGenerator {

    public generateLodKey(word: string, index: number): string {
        return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").trim().toUpperCase() + index;
    }

    public generateWordKey(word: string): string {
        return crypto.createHash("md5").update(word, "utf-8").digest("hex");
    }
}
