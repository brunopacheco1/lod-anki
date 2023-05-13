# lod-anki

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

lod-anki is a command line tool that allows you to import data from the [Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) into [Anki](https://apps.ankiweb.net/), a popular open-source flashcard program. With this library, you can create personalized flashcards from LOD dataset, enabling efficient learning and retention of information.

## Features

- Import data from LOD.lu into Anki decks.
- Map `noun`, `verb`, `preposition`, `conjunction`, `adjective`, and `adverb` to words dataset.
- Export words into Anki flashcards.

## Installation

Install the command line, running the following command.

```shell
npm i -g lod-anki
```

## Usage

1. Download and extract the [file](https://www.dropbox.com/s/ussujs7ryrnt6et/lod.zip?dl=0).
2. Navigate to the root folder where the zip file was extracted.
3. Prepare your deck file (see below).
4. Run ```lod-anki export <deckFile>```.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request. Make sure to follow the existing code style and include appropriate tests.

## License

This project is licensed under the [GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html) License.

## HOWTO

### How to build a deck file?

The deck file is a JSON file, with the following schema:

- name: It is the name of the deck, shown in Anki. It will be concatenated with the language, to avoid duplicity, if you want to export multiple languages;
- fileName: It is the file name. It will be concatenated with the language, to avoid duplicity;
- flashcards: The collection of words in Luxembourgish you want to export;
- languages: The collection of languages you want to export to. The possible values are: ALL (German), EN (English), FR (French), and PO (Portuguese);
- types: The collection of word types you want to export. `lod-anki` will filter the flashcards (or words), and export only the ones matching the types in this list. This field is optional. `noun`, `verb`, `preposition`, `conjunction`, `adjective`, and `adverb` are supported by this tool.

Below you can see an example:

```json
{
    "name": "Greeting in Luxembourgish",
    "fileName": "greeting_in_luxembourgish",
    "flashcards": [
        "Äddi",
        "Awar",
        "Awuer",
        "Bonjour",
        "Moien"
    ],
    "languages": [
        "ALL",
        "EN",
        "FR",
        "PO"
    ]
}
```

When building the deck, put the words in lowercase. But if it is a noun, capitalize the first character, as it is in Luxembourgish.