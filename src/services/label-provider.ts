import { injectable } from "inversify";

const deLabels = require("../resources/de-labels.json");
const ptLabels = require("../resources/pt-labels.json");
const frLabels = require("../resources/fr-labels.json");
const enLabels = require("../resources/en-labels.json");

export interface LabelProvider {
    get(language: string, label: string): string;
}

@injectable()
export class LabelProviderImpl implements LabelProvider {

    public get(label: string, language: string = "en"): string {
        switch (language.toLowerCase()) {
            case "all":
                return deLabels[label];
            case "po":
                return ptLabels[label];
            case "fr":
                return frLabels[label];
            case "en":
            default:
                return enLabels[label];
        }
    }
}
