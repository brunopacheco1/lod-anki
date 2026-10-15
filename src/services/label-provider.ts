import deLabels from "../resources/de-labels.json";
import enLabels from "../resources/en-labels.json";
import frLabels from "../resources/fr-labels.json";
import ptLabels from "../resources/pt-labels.json";

type Labels = { [label: string]: string };

/** Returns the translation of a label for a deck language, or the label itself when there is none. */
export function label(key: string, language = "en"): string {
    let labels: Labels;
    switch (language.toLowerCase()) {
        case "all": labels = deLabels; break;
        case "po": labels = ptLabels; break;
        case "fr": labels = frLabels; break;
        default: labels = enLabels; break;
    }
    return labels[key] || key;
}
