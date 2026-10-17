import { execFile, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Converts audio files to small mono mp3 with ffmpeg, when ffmpeg is installed. */
export class AudioConverter {

    private available?: boolean;

    /** Whether ffmpeg can be run; checked once. */
    public isAvailable(): boolean {
        if (this.available === undefined) {
            this.available = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
        }
        return this.available;
    }

    /** Converts `input` to a mono 24 kbit/s, 22 kHz mp3 at `output`, which is plenty for speech. Returns whether it worked. */
    public async toMp3(input: string, output: string): Promise<boolean> {
        try {
            await run("ffmpeg", ["-loglevel", "error", "-nostdin", "-y", "-i", input, "-ac", "1", "-ar", "22050", "-b:a", "24k", output]);
            return true;
        } catch {
            fs.rmSync(output, { force: true });
            return false;
        }
    }
}
