#!/usr/bin/env node
 

/**
 * Generate a complete cardiology clinical note from a minimal HPI or defaults.
 *
 * Usage examples:
 *   node --loader ts-node/esm scripts/generateNote.ts
 *   node --loader ts-node/esm scripts/generateNote.ts --hpi "68yo M with chest pain x3h, diaphoresis, HTN, HLD"
 *   node --loader ts-node/esm scripts/generateNote.ts --hpi-file ./sample-hpi.txt --output ./generated-note.txt
 */

import fs from 'fs';
import path from 'path';

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--hpi' && argv[i + 1]) out.hpi = argv[++i];
    else if (a === '--hpi-file' && argv[i + 1]) out.hpiFile = argv[++i];
    else if (a === '--output' && argv[i + 1]) out.output = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function help() {
  console.log(`\nGenerate a complete cardiology clinical note\n\nOptions:\n  --hpi <text>         Provide an HPI string to base the note on\n  --hpi-file <path>    Read HPI text from a file\n  --output <path>      Write output to file instead of stdout\n\nExamples:\n  node --loader ts-node/esm scripts/generateNote.ts\n  node --loader ts-node/esm scripts/generateNote.ts --hpi "68yo M with chest pain x3h, diaphoresis, HTN, HLD"\n  node --loader ts-node/esm scripts/generateNote.ts --hpi-file ./sample-hpi.txt --output ./generated-note.txt\n`);
}

function ensureTrailingPeriod(s: string) {
  const t = s.trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : t + '.';
}

function deriveChiefComplaint(hpi: string) {
  const lower = hpi.toLowerCase();
  if (/chest pain|cp/.test(lower)) return 'Chest pain';
  if (/shortness of breath|dyspnea|sob/.test(lower)) return 'Shortness of breath';
  if (/palpitations/.test(lower)) return 'Palpitations';
  if (/syncope|faint/.test(lower)) return 'Syncope';
  return 'Cardiology evaluation';
}

function generateROS(hpi: string) {
  const parts: string[] = [];
  const lower = hpi.toLowerCase();
  if (/chest pain|palpitations|syncope/.test(lower)) parts.push('Cardiovascular: As per HPI. Denies orthopnea/PND unless otherwise stated.');
  if (/shortness of breath|dyspnea|cough/.test(lower)) parts.push('Respiratory: As per HPI. Denies hemoptysis unless otherwise stated.');
  if (/fever|fatigue|weak/.test(lower)) parts.push('Constitutional: As per HPI. No weight loss reported.');
  if (parts.length === 0) parts.push('Pertinent systems reviewed as per HPI. Complete ROS otherwise negative.');
  return parts.join('\n');
}

function generateAssessment(hpi: string) {
  const a: string[] = [];
  const L = hpi.toLowerCase();
  if (/chest pain/.test(L)) a.push('1. Chest pain - rule out acute coronary syndrome, consider non-cardiac causes');
  if (/shortness of breath|dyspnea/.test(L)) a.push(`${a.length + 1}. Dyspnea - consider heart failure vs pulmonary etiology`);
  if (/palpitations/.test(L)) a.push(`${a.length + 1}. Palpitations - evaluate for arrhythmia and structural disease`);
  if (a.length === 0) a.push('1. Cardiology evaluation - differential to be refined with exam and diagnostics');
  return a.join('\n');
}

function generatePlan(hpi: string) {
  const L = hpi.toLowerCase();
  const p: string[] = [];
  p.push('1. Complete history and physical examination');
  if (/chest pain/.test(L)) {
    p.push(`${p.length + 1}. Serial ECGs and cardiac enzymes`);
    p.push(`${p.length + 1}. Chest X-ray; risk stratification for ACS`);
  }
  if (/shortness of breath|dyspnea/.test(L)) {
    p.push(`${p.length + 1}. Chest X-ray and BNP; evaluate for HF vs pulmonary etiology`);
    p.push(`${p.length + 1}. Echocardiogram if indicated`);
  }
  if (/palpitations/.test(L)) {
    p.push(`${p.length + 1}. 12-lead ECG and consider ambulatory monitoring`);
  }
  p.push(`${p.length + 1}. Medication reconciliation and patient counseling`);
  p.push(`${p.length + 1}. Follow-up as clinically appropriate`);
  return p.join('\n');
}

function generateCompleteNote(hpiInput?: string) {
  const hpi = ensureTrailingPeriod(hpiInput && hpiInput.trim() ? hpiInput : '68-year-old patient presents with exertional chest pain for 3 hours associated with diaphoresis. Past history notable for hypertension and hyperlipidemia.');
  const cc = deriveChiefComplaint(hpi);
  const ros = generateROS(hpi);
  const assessment = generateAssessment(hpi);
  const plan = generatePlan(hpi);

  const pmh = 'Hypertension, Hyperlipidemia';
  const psh = 'None reported';
  const fh = 'No premature CAD reported';
  const sh = 'Never smoker; occasional alcohol';
  const meds = '- Aspirin 81 mg daily\n- Atorvastatin 40 mg nightly';
  const allergies = 'No known drug allergies';
  const vitals = 'BP 138/82, HR 92, RR 18, SpO2 98% RA, Temp 36.8°C';
  const exam = 'General: No acute distress.\nCardiac: Regular rhythm, no murmur/rub/gallop.\nLungs: Clear to auscultation bilaterally.\nExtremities: No edema.';
  const labs = 'CBC/CMP pending. Troponin pending. Lipid panel pending.';
  const diagnostics = 'ECG pending; CXR pending.';

  const note = [
    `CC: ${cc}`,
    '',
    `HPI: ${hpi}`,
    '',
    `PMH: ${pmh}`,
    `PSH: ${psh}`,
    `FH: ${fh}`,
    `SH: ${sh}`,
    '',
    'Medications:',
    meds,
    '',
    `Allergies: ${allergies}`,
    '',
    `ROS:\n${ros}`,
    '',
    `Vitals: ${vitals}`,
    '',
    'PHYSICAL EXAMINATION:',
    exam,
    '',
    `Labs: ${labs}`,
    `Diagnostics: ${diagnostics}`,
    '',
    'ASSESSMENT:',
    assessment,
    '',
    'PLAN:',
    plan,
  ].join('\n');

  return note;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    help();
    process.exit(0);
  }
  let hpi = '';
  if (typeof args.hpi === 'string') {
    hpi = args.hpi;
  } else if (typeof args.hpiFile === 'string') {
    const p = path.resolve(String(args.hpiFile));
    if (!fs.existsSync(p)) {
      console.error(`❌ HPI file not found: ${p}`);
      process.exit(2);
    }
    hpi = fs.readFileSync(p, 'utf-8');
  }

  const note = generateCompleteNote(hpi);
  if (typeof args.output === 'string') {
    const outPath = path.resolve(String(args.output));
    fs.writeFileSync(outPath, note, 'utf-8');
    console.log(`✅ Wrote note to ${outPath}`);
  } else {
    console.log(note);
  }
}

main().catch((e) => {
  console.error('❌ Failed to generate note:', e?.message || e);
  process.exit(1);
});
