import fs from "fs";
import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;

const INPUT = path.resolve("scripts/data/vehicle-data.csv");
const OUTPUT = path.resolve("src/data/vehicle-data.json");

if (!fs.existsSync(INPUT)) {
  console.error("❌ CSV file not found:", INPUT);
  process.exit(1);
}

const raw = fs.readFileSync(INPUT, "utf-8");

// Split lines, ignore empty
const lines = raw.split(/\r?\n/).filter(Boolean);

// Remove header
const header = lines.shift();

// Parse CSV (simple + safe)
const rows = lines.map((line) => {
  // Handles commas inside quotes
  const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  return parts.map((p) => p.replace(/^"|"$/g, "").trim());
});

// Build structure: year -> make -> [models]
const data = {};

for (const [year, make, model] of rows) {
  if (!year || !make || !model) continue;

  if (!data[year]) data[year] = {};
  if (!data[year][make]) data[year][make] = [];

  if (!data[year][make].includes(model)) {
    data[year][make].push(model);
  }
}

// Sort years descending, makes & models alphabetically
const sorted = {};

Object.keys(data)
  .sort((a, b) => b.localeCompare(a))
  .forEach((year) => {
    sorted[year] = {};
    Object.keys(data[year])
      .sort((a, b) => a.localeCompare(b))
      .forEach((make) => {
        sorted[year][make] = data[year][make].sort((a, b) =>
          a.localeCompare(b)
        );
      });
  });

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 2), "utf-8");

console.log("✅ Vehicle JSON generated:");
console.log("   ", OUTPUT);