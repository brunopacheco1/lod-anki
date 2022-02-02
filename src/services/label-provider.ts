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
        let value;
        switch (language.toLowerCase()) {
            case "all": value = deLabels[label]; break;
            case "po": value = ptLabels[label]; break;
            case "fr": value = frLabels[label]; break;
            case "en":
            default: value = enLabels[label]; break;
        }
        if (!!value) {
            return value;
        }
        return label;
    }
}
