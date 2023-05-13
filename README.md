# lod-anki
This project exports LOD.lu content into [Anki](https://apps.ankiweb.net/) flashcards, so anyone can rapidly design and generate decks. Here there are also some [decks](https://github.com/brunopacheco1/lod-anki/tree/main/decks/schwatzt_dir_letzebuergesh), based on the book series "Schwätzt Dir Lëtzebuergesch?" published by [INL](https://www.inll.lu/).

## LOD.lu
[Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) is a platform maintained by [ZLS](https://portal.education.lu/zls/), where anyone can easily search word meanings and how to pronounce them.

The word database was extracted from [data.public.lu](https://data.public.lu/en/datasets/letzebuerger-online-dictionnaire/). The audio content was downloaded directly from LOD.lu.

## How to use it?
(Un)Fortunately, the amount of data is huge. To soothe the struggle of fetching everything again, you can find a mirror of the LOD (2022-10-06) content included in this project repo ([here](https://www.dropbox.com/s/ussujs7ryrnt6et/lod.zip?dl=0)). To use this app, please follow these steps:

1. Install this app running ```npm i -g lod-anki```;
2. Download and extract the [file](https://www.dropbox.com/s/ussujs7ryrnt6et/lod.zip?dl=0);
3. Navigate to the root folder where the zip file was extracted;
4. Run ```lod-anki export <deckFile>```.

## How to build a deck file?

The deck file is a JSON file, with the following schema:

- name: It is the name of the deck, shown in Anki. It will be concatenated with the language, to avoid duplicity, if you want to export multiple languages;
- fileName: It is the file name. It will be concatenated with the language, to avoid duplicity;
- flashcards: The collection of words in Luxembourguish you want to export;
- languages: The collection of languages you want to export to. The possible values are: ALL (German), EN (English), FR (French), and PO (Portuguese);
- types: The collection of word types you wannt to export. `lod-anki` will filter the flashcards (or words), and export only the ones matching the types in this list. This field is optional. `noun`, `verb`, `preposition`, `conjunction`, `adjective`, and `adverb` are supported by this tool.

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

When building the deck, put the words in lower case. But if it is a noun, capitalize the first character, as it is in Luxembourgish.