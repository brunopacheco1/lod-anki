# lod-anki

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

lod-anki is a command line tool that allows you to import data from the [Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) into [Anki](https://apps.ankiweb.net/), a popular open-source flashcard program. With this library, you can create personalized flashcards from LOD dataset, enabling efficient learning and retention of information.

## Features

- Import data from LOD.lu into Anki decks, with pronunciations and examples.
- Map `noun`, `verb`, `preposition`, `conjunction`, `adjective`, `adverb`, and `numeral` to words dataset.
- Export words into Anki flashcards.

## Quick start

You don't need to be a programmer. You need about 5 minutes and a terminal (the "Terminal" app on macOS, "PowerShell" on Windows).

### 1. Install Node.js

Download the **LTS** version from [nodejs.org](https://nodejs.org/) and install it like any other app. To check it worked, open a new terminal and run:

```shell
node -v
```

It should print a version number such as `v22.12.0` or newer. lod-anki needs Node.js 22.12 or later.

### 2. Write a deck file

Create a folder for your decks, for example `lux-decks` in your home folder. In it, create a file named `deck.json` with the words you want to learn (see [How to build a deck file](#how-to-build-a-deck-file)):

```json
{
    "name": "Greeting in Luxembourgish",
    "fileName": "greeting_in_luxembourgish",
    "flashcards": ["Äddi", "Moien"],
    "languages": ["EN"]
}
```

### 3. Create the Anki deck

In the terminal, go to your folder and run lod-anki:

```shell
cd lux-decks
npx lod-anki export deck.json
```

`npx` downloads and runs lod-anki for you, so there is nothing to install globally. This creates `greeting_in_luxembourgish_english.apkg`. Double-click it (or use **File > Import** in Anki) to add the deck.

The first export downloads the LOD data (about 20 MB) and keeps it in your user cache folder (`~/.cache/lod-anki` on Linux, `~/Library/Caches/lod-anki` on macOS, `%LOCALAPPDATA%\lod-anki` on Windows). Pronunciations are downloaded from [lod.lu](https://lod.lu) the first time a word is exported and kept there too, so you need an internet connection when you export.

The data is rebuilt every month from the [LOD linguistic dataset](https://data.public.lu/fr/datasets/letzebuerger-online-dictionnaire-lod-linguistesch-daten/) published by the Zenter fir d'Lëtzebuerger Sprooch (CC0). Run `npx lod-anki update` to get the latest data.

Re-importing a deck you exported again later updates the existing cards in Anki instead of adding duplicates, so your review progress is kept.

> Just want ready-made decks for the *Schwätzt dir Lëtzebuergesch?* books? Download `decks.zip` from the [lod-data release](https://github.com/brunopacheco1/lod-anki/releases/tag/lod-data) and import the `.apkg` files into Anki.

### Commands

| Command | Description |
| --- | --- |
| `export <deck>` | Creates one `.apkg` file per language of the deck file. |
| `update` | Downloads the latest LOD data. |
| `extract <lodDump>` | Builds the data yourself from the LOD XML dump into `<output>/lod`. |

### Options

| Option | Description |
| --- | --- |
| `-d, --data <directory>` | Use LOD data from this folder instead of the downloaded one, for example a [`lod.zip`](https://github.com/brunopacheco1/lod-anki/releases/download/lod-data/lod.zip) you extracted yourself. A `lod` folder next to where you run lod-anki is also picked up. |
| `-o, --output <directory>` | Where to write the `.apkg` files. Defaults to the current folder. |

For example: `npx lod-anki export deck.json --data ~/Downloads/lod`. Set the `LOD_ANKI_CACHE` environment variable to keep the downloaded data somewhere else.

### Prefer a global install?

```shell
npm install -g lod-anki
lod-anki export deck.json
```

If this fails with `EACCES: permission denied`, your npm is not allowed to write to its global folder. Use `npx` as above, or install Node.js through a version manager such as [nvm](https://github.com/nvm-sh/nvm), which avoids the problem.

### Troubleshooting

- **`Could not download the LOD data`**: check your internet connection. You can also download [`lod.zip`](https://github.com/brunopacheco1/lod-anki/releases/download/lod-data/lod.zip) yourself, extract it, and pass `--data <path/to/lod>`.
- **`LOD data not found`**: the folder given with `--data` has no `words` folder. Point it at the extracted `lod` folder.
- **`<word> not found!`**: that word is not in the LOD data. Check the spelling and capitalisation (nouns start with a capital letter).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request. Make sure to follow the existing code style and include appropriate tests.

## License

This project is licensed under the [GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html) License.

## HOWTO

### How to build a deck file?

The deck file is a JSON file, with the following schema:

- name: It is the name of the deck, shown in Anki. It will be concatenated with the language, to avoid duplicity, if you want to export multiple languages;
- fileName: It is the file name. It will be concatenated with the language, to avoid duplicity;
- flashcards: The collection of words in Luxembourgish you want to export. Optional when you use `categories`;
- languages: The collection of languages you want to export to. The possible values are: ALL (German), EN (English), FR (French), and PO (Portuguese);
- types: The collection of word types you want to export. `lod-anki` will filter the flashcards (or words), and export only the ones matching the types in this list. This field is optional. `noun`, `verb`, `preposition`, `conjunction`, `adjective`, `adverb`, and `numeral` are supported by this tool.
- categories: LOD categories to export, such as CEFR levels (`A1`, `A2`, `B1`, ...) or topics (`FAMILL` for family, ...). This field is optional. Without `flashcards`, the deck holds every word in these categories; with `flashcards`, only the listed words in these categories are kept. Cards are tagged with their word type and categories in Anki.

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

A deck with all A1 words needs no word list:

```json
{
    "name": "Luxembourgish A1",
    "fileName": "luxembourgish_a1",
    "categories": ["A1"],
    "languages": ["EN"]
}
```

If such a deck comes out empty, run `npx lod-anki update` to download LOD data that includes categories.

When building the deck, put the words in lowercase. But if it is a noun, capitalize the first character, as it is in Luxembourgish.