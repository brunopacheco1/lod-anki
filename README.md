# lod-anki

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

lod-anki is a command line tool that allows you to import data from the [Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) into [Anki](https://apps.ankiweb.net/), a popular open-source flashcard program. With this library, you can create personalized flashcards from LOD dataset, enabling efficient learning and retention of information.

## Features

- Import data from LOD.lu into Anki decks.
- Map `noun`, `verb`, `preposition`, `conjunction`, `adjective`, and `adverb` to words dataset.
- Export words into Anki flashcards.

## Quick start

You don't need to be a programmer. You need about 10 minutes and a terminal (the "Terminal" app on macOS, "PowerShell" on Windows).

### 1. Install Node.js

Download the **LTS** version from [nodejs.org](https://nodejs.org/) and install it like any other app. To check it worked, open a new terminal and run:

```shell
node -v
```

It should print a version number such as `v22.x.x`.

### 2. Get the LOD data

1. Create a folder for your decks, for example `lux-decks` in your home folder.
2. Download the [LOD data file](https://www.dropbox.com/s/ussujs7ryrnt6et/lod.zip?dl=0) and extract it **inside that folder**. You should end up with:

```text
lux-decks/
└── lod/
    ├── audios/
    └── words/
```

### 3. Write a deck file

In the same `lux-decks` folder, create a file named `deck.json` with the words you want to learn (see [How to build a deck file](#how-to-build-a-deck-file)):

```json
{
    "name": "Greeting in Luxembourgish",
    "fileName": "greeting_in_luxembourgish",
    "flashcards": ["Äddi", "Moien"],
    "languages": ["EN"]
}
```

### 4. Create the Anki deck

In the terminal, go to your folder and run lod-anki:

```shell
cd lux-decks
npx lod-anki export deck.json
```

`npx` downloads and runs lod-anki for you, so there is nothing to install globally. This creates `greeting_in_luxembourgish_english.apkg`. Double-click it (or use **File > Import** in Anki) to add the deck.

### Options

| Option | Description |
| --- | --- |
| `-d, --data <directory>` | Where the extracted `lod` folder is, if you don't run lod-anki next to it. |
| `-o, --output <directory>` | Where to write the `.apkg` files. Defaults to the current folder. |

For example: `npx lod-anki export deck.json --data ~/Downloads/lod`.

### Prefer a global install?

```shell
npm install -g lod-anki
lod-anki export deck.json
```

If this fails with `EACCES: permission denied`, your npm is not allowed to write to its global folder. Use `npx` as above, or install Node.js through a version manager such as [nvm](https://github.com/nvm-sh/nvm), which avoids the problem.

### Troubleshooting

- **`LOD data not found`**: lod-anki could not find the `lod` folder. Run the command from the folder that contains `lod`, or pass `--data <path/to/lod>`.
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