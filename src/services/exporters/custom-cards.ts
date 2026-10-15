export interface Card {
    front: string,
    back: string
}

const CLOZE_REGEX = /\{\{(.+?)\}\}/g;
const PREFIX_LENGTH = "basic:".length;

/** Builds a card from a deck entry like `basic:front;back`. */
export function basicCard(flashcard: string): Card {
    const [front, back = ""] = flashcard.slice(PREFIX_LENGTH).split(";");
    return { front, back };
}

/** Builds a card from a deck entry like `cloze:Ech {{sinn}} midd.`, hiding the words in braces on the front. */
export function clozeCard(flashcard: string): Card {
    const content = flashcard.slice(PREFIX_LENGTH);
    return {
        front: content.replace(CLOZE_REGEX, "<span style=\"color: blue\">[...]</span>"),
        back: content.replace(CLOZE_REGEX, (_match, word: string) => `<span style="color: blue">${word}</span>`),
    };
}
