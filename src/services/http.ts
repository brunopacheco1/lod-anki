import * as https from "node:https";

const HTTP_OK = 200;
const MAX_REDIRECTS = 5;
const USER_AGENT = "lod-anki (https://github.com/brunopacheco1/lod-anki)";

/**
 * Downloads a URL following redirects. Resolves with undefined when the server does not return 200,
 * and rejects on network errors or when no data arrives for `timeoutMs`.
 */
export function download(url: string, timeoutMs: number, redirects = MAX_REDIRECTS): Promise<Buffer | undefined> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { timeout: timeoutMs, headers: { "User-Agent": USER_AGENT } }, (response) => {
            const status = response.statusCode ?? 0;
            const location = response.headers.location;
            if (location && status >= 300 && status < 400 && redirects > 0) {
                response.resume();
                resolve(download(new URL(location, url).toString(), timeoutMs, redirects - 1));
                return;
            }
            if (status !== HTTP_OK) {
                response.resume();
                console.warn(`Not available at ${url} (HTTP ${status})`);
                resolve(undefined);
                return;
            }
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => chunks.push(chunk));
            response.on("end", () => resolve(Buffer.concat(chunks)));
            response.on("error", reject);
        });
        request.on("timeout", () => request.destroy(new Error(`timed out after ${timeoutMs} ms`)));
        request.on("error", reject);
    });
}
