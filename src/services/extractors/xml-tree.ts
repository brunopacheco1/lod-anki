import * as fs from "fs";
import * as sax from "sax";

export interface XmlNode {
    name: string,
    attributes: { [key: string]: string },
    children: XmlNode[],
    text: string
}

export function children(node: XmlNode | undefined, name: string): XmlNode[] {
    return node ? node.children.filter((child) => child.name === name) : [];
}

export function child(node: XmlNode | undefined, name: string): XmlNode | undefined {
    return node?.children.find((child) => child.name === name);
}

export function descendants(node: XmlNode | undefined, name: string): XmlNode[] {
    if (!node) {
        return [];
    }
    const found: XmlNode[] = [];
    for (const item of node.children) {
        if (item.name === name) {
            found.push(item);
        }
        found.push(...descendants(item, name));
    }
    return found;
}

export function textOf(node: XmlNode | undefined): string {
    if (!node) {
        return "";
    }
    return (node.text + node.children.map(textOf).join("")).trim();
}

/**
 * Streams an XML file and calls `onElement` with the full tree of every element named `elementName`,
 * so large dumps never have to be loaded into memory at once.
 */
export function streamElements(file: string, elementName: string, onElement: (node: XmlNode) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const parser = sax.createStream(true, { trim: false });
        const stack: XmlNode[] = [];

        parser.on("opentag", (tag) => {
            if (stack.length === 0 && tag.name !== elementName) {
                return;
            }
            const node: XmlNode = { name: tag.name, attributes: tag.attributes as { [key: string]: string }, children: [], text: "" };
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(node);
            }
            stack.push(node);
        });
        parser.on("text", (text) => {
            if (stack.length > 0) {
                stack[stack.length - 1].text += text;
            }
        });
        parser.on("closetag", () => {
            const node = stack.pop();
            if (node && stack.length === 0) {
                onElement(node);
            }
        });
        parser.on("error", reject);
        parser.on("end", resolve);

        fs.createReadStream(file).on("error", reject).pipe(parser);
    });
}
