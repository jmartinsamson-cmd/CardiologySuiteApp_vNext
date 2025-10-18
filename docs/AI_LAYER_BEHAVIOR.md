# AI Layer Behavior — Cardiology Parser

**AI is opt-in:**  
`refineWithAI()` only runs when `process.env.OPENAI_API_KEY` is set **and** the note length ≥ 300 chars.

## Guarantees

- **No secrets in browser:** The API key is server-only; browser bundles exclude it.
- **Rule-first extraction:** The rule-based parser always runs first.
- **Deterministic tests:** If no key is present, the AI step is skipped; unit/E2E tests remain deterministic.
- **JSON schema preservation:** The AI layer is instructed to output only valid `CardioNote` JSON.  
  All merges are safe, shape-preserving, and de-duplicated.
- **Strict typing:** The schema in `types/cardiology-schema.ts` remains the single source of truth.  
  `parseCardioNote()` always returns a conformant object.

## Behavior summary

| Stage | Action |
|-------|---------|
| **Rule parser** | Extracts HPI, Assessment, Plan, Diagnoses, Meds, Labs, Imaging, Procedures |
| **AI refine** | Adds or corrects missing fields using `gpt-4o-mini` |
| **Merge** | Non-destructive, schema-safe merge |
| **Skip condition** | Triggered if note length < 300 or no OPENAI_API_KEY |
| **Execution** | Node-only; browser clients bypass refinement |
| **Output** | Final `CardioNote` object preserving schema integrity |

## Build & Test

### Build

```bash
npm run build
```

### Behavior with Azure Education Context

“When connected to Azure Blob Storage, GPT-4o-mini uses uploaded cardiology education materials as context to refine the Assessment and Plan sections. Rule-based extraction remains the authoritative source.”
