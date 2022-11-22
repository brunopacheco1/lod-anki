# lod-anki
This project exports LOD.lu content into [Anki](https://apps.ankiweb.net/) flashcards, so anyone can rapidly design and generate decks. Here there are also some [decks](https://github.com/brunopacheco1/lod-anki/tree/main/decks/schwatzt_dir_letzebuergesh), based on the book series "Schwätzt Dir Lëtzebuergesch?" published by [INL](https://www.inll.lu/).

## LOD.lu
[Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) is a platform maintained by [ZLS](https://portal.education.lu/zls/), where anyone can easily search word meanings and how to pronounce them.

The word database was extracted from [data.public.lu](https://data.public.lu/en/datasets/letzebuerger-online-dictionnaire/). The audio content was downloaded directly from LOD.lu.

## How to use it
(Un)Fortunately, the amount of data is huge. To soothe the struggle of fetching everything again, you can find a mirror of the LOD content included in this project repo ([here](https://github.com/brunopacheco1/lod-anki/tree/main/lod)). To use this app, please follow these steps:

1. Install this app running ```npm i -g lod-anki```;
2. Download and extract this [file](https://www.dropbox.com/s/ussujs7ryrnt6et/lod.zip?dl=0);
3. Navigate to the root folder where the zip file was extracted;
4. Run ```lod-anki export <deckFile>```.