/**
 * Update Real Notes Test Expected Outputs
 * Automatically updates fixture expected outputs to match current parser behavior
 * 
 * Usage:
 *   node scripts/update-real-notes-expected.js          # Update all fixtures
 *   node scripts/update-real-notes-expected.js --dry-run # Preview changes
 */

// @ts-check
import { parseNote } from "../src/parsers/smartParser.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * @param {keyof typeof colors} color
 * @param {string} text
 */
function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Load all fixture files
 */
function loadFixtures() {
  const fixturesDir = path.join(__dirname, "../tests/fixtures/real");
  const files = fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".json") && f !== "TEMPLATE.json");

  return files.map((filename) => {
    const filepath = path.join(fixturesDir, filename);
    const content = fs.readFileSync(filepath, "utf-8");
    return { filename, filepath, fixture: JSON.parse(content) };
  });
}

/**
 * Update fixture with current parser output
 */
/**
 * @param {{filename: string, filepath: string, fixture: any}} fixtureData
 */
function updateFixture(fixtureData) {
  const { filename, filepath, fixture } = fixtureData;

  console.log(colorize("blue", `\n📝 Processing: ${filename}`));
  console.log(`   ID: ${fixture.id}`);
  console.log(`   Description: ${fixture.description}`);

  // Parse note with current parser
  const result = /** @type {any} */ (parseNote(fixture.input));

  console.log(`   Parser confidence: ${colorize("cyan", result.confidence.toFixed(2))}`);
  console.log(`   Warnings: ${result.warnings.length > 0 ? colorize("yellow", result.warnings.join(", ")) : colorize("green", "none")}`);

  // Update expected output with actual parser output from result.data
  // Use result.data fields which contain the actual parsed content
  // IMPORTANT: Parser returns "meds" not "medications" - use exact field names from parser
  /** @type {any} */
  const data = result.data || {};
  const updatedExpected = {
    patient: data.patient,
    vitals: data.vitals,
    subjective: data.subjective,
    objective: data.objective,
    assessment: data.assessment,
    plan: data.plan,
    diagnoses: data.diagnoses,
    meds: data.meds, // Parser uses "meds" not "medications"
    allergies: data.allergies,
    labs: data.labs,
    pmh: data.pmh,
    socialHistory: data.socialHistory,
    familyHistory: data.familyHistory,
  };

  // Show key changes
  const changes = [];
  if (fixture.expected.subjective !== updatedExpected.subjective) {
    changes.push("subjective");
  }
  if (fixture.expected.objective !== updatedExpected.objective) {
    changes.push("objective");
  }
  if (fixture.expected.assessment !== updatedExpected.assessment) {
    changes.push("assessment");
  }
  if (fixture.expected.plan !== updatedExpected.plan) {
    changes.push("plan");
  }
  if (JSON.stringify(fixture.expected.meds || fixture.expected.medications) !== JSON.stringify(updatedExpected.meds)) {
    changes.push("meds");
  }

  if (changes.length > 0) {
    console.log(colorize("yellow", `   ⚠️  Changed fields: ${changes.join(", ")}`));
  } else {
    console.log(colorize("green", "   ✅ No changes needed"));
  }

  // Update fixture
  const updatedFixture = {
    ...fixture,
    expected: updatedExpected,
  };

  if (dryRun) {
    console.log(colorize("cyan", "   [DRY RUN] Would update file"));
  } else {
    fs.writeFileSync(filepath, JSON.stringify(updatedFixture, null, 2) + "\n", "utf-8");
    console.log(colorize("green", `   ✅ Updated ${filename}`));
  }

  return { filename, changes, confidence: result.confidence, warnings: result.warnings };
}

/**
 * Main execution
 */
function main() {
  console.log(colorize("bright", "🔧 Real Notes Fixture Expected Output Updater\n"));

  if (dryRun) {
    console.log(colorize("yellow", "⚠️  DRY RUN MODE - No files will be modified\n"));
  }

  const fixtures = loadFixtures();
  console.log(`Found ${fixtures.length} fixture(s)\n`);

  const results = fixtures.map(updateFixture);

  console.log(colorize("bright", "\n📊 Summary:"));
  console.log(`   Total fixtures: ${results.length}`);
  console.log(`   Modified: ${results.filter((r) => r.changes.length > 0).length}`);
  console.log(`   Unchanged: ${results.filter((r) => r.changes.length === 0).length}`);

  if (dryRun) {
    console.log(colorize("yellow", "\n⚠️  DRY RUN COMPLETE - Run without --dry-run to apply changes"));
  } else {
    console.log(colorize("green", "\n✅ All fixtures updated successfully!"));
    console.log(colorize("cyan", "\nRun npm run test:real-notes to verify changes"));
  }
}

main();
