import { injectable } from "inversify";
import * as crypto from "crypto";

export interface KeyGenerator {
    generateWordKey(word: string): string;
}

@injectable()
export class KeyGeneratorImpl implements KeyGenerator {

    public generateWordKey(word: string): string {
        return crypto.createHash("md5").update(word, "utf-8").digest("hex");
    }
}
