"""Print a structural summary and sample entries of the LOD XML dump (used by CI)."""
import collections
import sys
import xml.etree.ElementTree as ET

path = sys.argv[1]
wanted = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else set()

with open(path, "rb") as f:
    print(f.read(600).decode("utf-8", "replace"))

pos_counts = collections.Counter()
attr_names = collections.Counter()
samples_per_pos = collections.defaultdict(list)
printed = 0
for _, elem in ET.iterparse(path, events=("end",)):
    if elem.tag != "entry":
        continue
    for ms in elem.iter("microStructure"):
        for pos in ms.iter("partOfSpeech"):
            pos_counts[pos.text or ""] += 1
    for e in elem.iter():
        for a in e.attrib:
            attr_names[f"{e.tag}@{a}"] += 1
    lemma = elem.find("lemma")
    lemma_text = "".join(lemma.itertext()).strip() if lemma is not None else ""
    pos = elem.find(".//partOfSpeech")
    pos_text = pos.text if pos is not None else "?"
    if lemma_text in wanted or (len(samples_per_pos[pos_text]) < 1 and printed < 40):
        samples_per_pos[pos_text].append(lemma_text)
        printed += 1
        print(f"===== {lemma_text} ({pos_text})")
        print(ET.tostring(elem, encoding="unicode"))
    elem.clear()

print("===== partOfSpeech counts")
for k, v in pos_counts.most_common():
    print(v, k)
print("===== attributes")
for k, v in attr_names.most_common(120):
    print(v, k)
