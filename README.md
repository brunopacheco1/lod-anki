# lod-anki
This project exports LOD.lu content into [Anki](https://apps.ankiweb.net/) flashcards, so anyone can rapidly design and generate decks. Here there will be also base deck definitions written from the series of Books "Schwätzt Dir Lëtzebuergesch?", published by [INL](https://www.inll.lu/).

## LOD.lu
[Luxembourger Dictionary Online (LOD)](https://www.lod.lu/) is a platform maintained by [ZLS](https://portal.education.lu/zls/), where anyone can easily search word meanings and how to pronounce it.

The word database was extracted from [data.public.lu](https://data.public.lu/en/datasets/letzebuerger-online-dictionnaire/). The audio content was download directly from LOD.lu and converted into AAC, to reduce the size of the files.

## How to use it
(Un)Fortunately, the amount of data is huge. To soothe the struggle of fetching everything again, you can find a mirror of the LOD content included in this project repo ([here](https://github.com/brunopacheco1/lod-anki/tree/main/lod)). To use this app, please follow these steps:

1. Install this app running ```npm i -g lod-anki```;
2. Download and extract this [file](https://github.com/brunopacheco1/lod-anki/blob/main/lod.zip);
3. Navigate to the root folder where the zip file was extracted;
4. Run ```lod-anki export <deckFile>```.