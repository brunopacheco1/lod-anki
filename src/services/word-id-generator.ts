import * as crypto from "node:crypto";

/** Returns the id used as file name for a word in the extracted LOD data. */
export function wordId(word: string): string {
    return crypto.createHash("md5").update(word, "utf-8").digest("hex");
}
