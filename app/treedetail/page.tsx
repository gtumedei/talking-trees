import TreeDetail, { TreeData } from "./TreeDetail";

const SAMPLE_DATA: TreeData = {
  commonName: "Cipresso",
  latinName: "Cupressus sempervirens",
  description: "Specie sempreverde, long-lived example ...",
  height: { maturity: "20-25 m", sizeClass: "II°", crownSize: "Media (10–15 m)" },
  features: [
    { emoji: "🌿", label: "Forma chioma", value: "Fastigiata" },
    { emoji: "🌱", label: "Tipo", value: "Sempreverde" },
    { emoji: "📏", label: "Circonferenza", value: "650 cm" },
    // aggiungi altre features
  ],
  ecology: "Rifugio per piccoli uccelli, resistente alla siccità."
};

export default function TreeInfo() {
  return (
    <main>
      <TreeDetail data={SAMPLE_DATA} />
    </main>
  );
}
