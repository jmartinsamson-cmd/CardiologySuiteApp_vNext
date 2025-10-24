import { debugLog } from "../utils/logger.js";
/**
 * Extract clinical context (temporal, severity, causality, negations)
 * @param text - Clinical text
 * @returns Context metadata
 */
export function extractClinicalContext(text) {
    const context = {
        temporal: [],
        severity: [],
        causality: [],
        negations: []
    };
    // Temporal markers
    const temporalPatterns = [
        /(?<event>chest pain|dyspnea|edema)\s+(?:for|x|over)\s+(?<duration>\d+\s*(?:hour|day|week|month)s?)/gi,
        /(?<modifier>acute|chronic|new|worsening)\s+(?<condition>[a-z\s]+)/gi,
        /(?<condition>\w+)\s+since\s+(?<date>\d{1,2}\/\d{1,2}\/\d{2,4})/gi
    ];
    temporalPatterns.forEach(pattern => {
        for (const match of text.matchAll(pattern)) {
            context.temporal.push({
                entity: match.groups?.condition || match.groups?.event,
                modifier: match.groups?.modifier || match.groups?.duration,
                type: match.groups?.modifier ? 'onset' : 'duration'
            });
        }
    });
    // Severity markers
    const severityPatterns = [
        /(?<severity>mild|moderate|severe|critical)\s+(?<condition>[a-z\s]+)/gi,
        /(?<condition>\w+)\s+(?<modifier>improved|worsened|stable|progressive)/gi
    ];
    severityPatterns.forEach(pattern => {
        for (const match of text.matchAll(pattern)) {
            context.severity.push({
                entity: match.groups?.condition,
                level: match.groups?.severity || match.groups?.modifier
            });
        }
    });
    // Causality (A → B relationships)
    const causalityPatterns = [
        /(?<cause>\w+)\s+(?:causing|leading to|resulting in)\s+(?<effect>[^.]+)/gi,
        /(?<effect>\w+)\s+(?:due to|secondary to|from)\s+(?<cause>[^.]+)/gi
    ];
    causalityPatterns.forEach(pattern => {
        for (const match of text.matchAll(pattern)) {
            context.causality.push({
                cause: match.groups?.cause?.trim(),
                effect: match.groups?.effect?.trim()
            });
        }
    });
    // Negations (critical for accuracy)
    const negationPatterns = [
        /(?:no|denies|negative for|without)\s+(?<negated>[^.,]+)/gi,
        /(?<entity>\w+):\s*(?:none|negative|not present)/gi
    ];
    negationPatterns.forEach(pattern => {
        for (const match of text.matchAll(pattern)) {
            const negated = match.groups?.negated?.trim() || match.groups?.entity?.trim();
            if (negated) {
                context.negations.push(negated);
            }
        }
    });
    return context;
}
/**
 * Disambiguate overlapping diagnoses using clinical context
 * @param diagnoses - Raw extracted diagnoses
 * @param context - Clinical context from extractClinicalContext
 * @param vitals - Vital signs
 * @returns Disambiguated diagnoses with confidence
 */
export function disambiguateDiagnoses(diagnoses, context, vitals) {
    if (!diagnoses || diagnoses.length === 0)
        return [];
    let processed = diagnoses.map(d => typeof d === 'string' ? d : d.diagnosis || String(d));
    // Rule 1: Prioritize acute over chronic when both present
    const acuteMarkers = context.temporal.filter(t => t.modifier && /acute|new|sudden/i.test(t.modifier));
    if (acuteMarkers.length > 0) {
        processed = processed.filter(d => {
            const hasAcute = acuteMarkers.some(m => m.entity && d.toLowerCase().includes(m.entity.toLowerCase()));
            const hasChronic = /chronic/i.test(d);
            return !hasChronic || hasAcute; // Remove chronic if acute exists
        });
    }
    // Rule 2: Remove negated diagnoses
    const negations = context.negations.map(n => n.toLowerCase());
    processed = processed.filter(d => {
        const dLower = d.toLowerCase();
        return !negations.some(neg => dLower.includes(neg));
    });
    // Rule 3: Flag inconsistencies and calculate confidence
    const disambiguated = processed.map(dx => {
        let confidence = 1.0;
        const warnings = [];
        // Check vital sign consistency
        if (/stable|improved/i.test(dx) && vitals) {
            if (vitals.hr && (vitals.hr > 120 || vitals.hr < 50)) {
                confidence *= 0.7;
                warnings.push('HR abnormal despite "stable" description');
            }
            if (vitals.bp) {
                const [systolic] = vitals.bp.split('/').map(v => Number.parseInt(v, 10));
                if (systolic && systolic < 90) {
                    confidence *= 0.6;
                    warnings.push('Hypotensive despite "stable" description');
                }
            }
        }
        // Check causality consistency
        const relatedCausality = context.causality.find(c => c.effect && dx.toLowerCase().includes(c.effect.toLowerCase()));
        return {
            diagnosis: dx,
            confidence,
            supportingEvidence: relatedCausality && relatedCausality.cause ? [relatedCausality.cause] : [],
            warnings
        };
    });
    return disambiguated.sort((a, b) => b.confidence - a.confidence);
}
/**
 * Extract vitals from text with tolerant regex
 * @param text - Section text
 * @returns Extracted vitals
 */
export function extractVitals(text) {
    if (!text)
        return {};
    const vitals = {};
    // NEW: MIN/MAX format detection (VITAL SIGNS: 24 HRS MIN & MAX)
    if (/VITAL SIGNS.*MIN.*MAX/i.test(text)) {
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^Temp\s+Min:/i.test(line)) {
                const tempMatch = line.match(/Max:\s+[\d.]+\s+°F[^°]*°C\)\s+(\d{2,3}(?:\.\d+)?)/);
                if (tempMatch)
                    vitals.temp = Number.parseFloat(tempMatch[1]);
            }
            else if (/^BP\s+Min:/i.test(line)) {
                const bpMatch = line.match(/Max:\s+\d{2,3}\/\d{2,3}\s+(?:\(!\)\s*)?(\d{2,3}\/\d{2,3})/);
                if (bpMatch)
                    vitals.bp = bpMatch[1];
            }
            else if (/^Pulse\s+Min:/i.test(line)) {
                const hrMatch = line.match(/Max:\s+\d{2,3}\s+(\d{2,3})\s*$/);
                if (hrMatch)
                    vitals.hr = Number.parseInt(hrMatch[1], 10);
            }
            else if (/^Resp\s+Min:/i.test(line)) {
                const rrMatch = line.match(/Max:\s+\d{1,2}\s+(\d{1,2})\s*$/);
                if (rrMatch)
                    vitals.rr = Number.parseInt(rrMatch[1], 10);
            }
            else if (/^SpO2\s+Min:/i.test(line)) {
                const spo2Match = line.match(/Max:\s+\d{2,3}\s*%\s+(?:\(!\)\s*)?(\d{2,3})\s*%/);
                if (spo2Match)
                    vitals.spo2 = Number.parseInt(spo2Match[1], 10);
            }
        }
        if (Object.keys(vitals).length > 0) {
            vitals.source = "vitals-minmax";
            return vitals;
        }
    }
    // NEW: Table format detection (common in EPIC ED notes)
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/BP\s+Pulse\s+Resp\s+Temp\s+SpO2/i.test(line)) {
            const dataLine = lines[i + 1];
            if (dataLine) {
                const cleanLine = dataLine.replaceAll("(!)", "").trim();
                const bpMatch = cleanLine.match(/(\d{2,3}\/\d{2,3})/);
                if (bpMatch) {
                    vitals.bp = bpMatch[1];
                }
                const parts = cleanLine.split(/[\s\t]+/).filter((p) => p.length > 0);
                if (parts[1] && /^\d{2,3}$/.test(parts[1])) {
                    vitals.hr = Number.parseInt(parts[1], 10);
                }
                if (parts[2] && /^\d{1,2}$/.test(parts[2])) {
                    vitals.rr = Number.parseInt(parts[2], 10);
                }
                if (parts[3] && /^\d{2,3}(\.\d+)?$/.test(parts[3])) {
                    vitals.temp = Number.parseFloat(parts[3]);
                }
                const spo2Match = cleanLine.match(/(\d{2,3})\s*%/);
                if (spo2Match) {
                    vitals.spo2 = Number.parseInt(spo2Match[1], 10);
                }
                vitals.source = "vitals-table";
                debugLog("✅ Extracted vitals from EPIC table format:", vitals);
                return vitals;
            }
        }
    }
    // NEW: Vertical list format (common in EPIC vitals section)
    if (!vitals.hr || !vitals.rr || !vitals.temp || !vitals.spo2 || !vitals.bp) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^Pulse:/i.test(line) && !vitals.hr) {
                const hrMatch = line.match(/Pulse:\s*(?:\(!\)\s*)?(\d{2,3})/i);
                if (hrMatch)
                    vitals.hr = Number.parseInt(hrMatch[1], 10);
            }
            if (/^Resp:/i.test(line) && !vitals.rr) {
                const rrMatch = line.match(/Resp:\s*(?:\(!\)\s*)?(\d{1,2})/i);
                if (rrMatch)
                    vitals.rr = Number.parseInt(rrMatch[1], 10);
            }
            if (/^Temp:/i.test(line) && !vitals.temp) {
                const tempMatch = line.match(/Temp:\s*(?:\(!\)\s*)?(\d{2,3}(?:\.\d)?)/i);
                if (tempMatch)
                    vitals.temp = Number.parseFloat(tempMatch[1]);
            }
            if (/^(?:SpO2|O2\s*Sat):/i.test(line) && !vitals.spo2) {
                const spo2Match = line.match(/(?:SpO2|O2\s*Sat):\s*(?:\(!\)\s*)?(\d{2,3})/i);
                if (spo2Match)
                    vitals.spo2 = Number.parseInt(spo2Match[1], 10);
            }
            if (/^BP:/i.test(line) && !vitals.bp) {
                const bpMatch = line.match(/BP:\s*(?:\(!\)\s*)?(\d{2,3}\/\d{2,3})/i);
                if (bpMatch)
                    vitals.bp = bpMatch[1];
            }
        }
        if (vitals.hr || vitals.rr || vitals.temp) {
            vitals.source = "vitals-vertical-list";
        }
    }
    // EXISTING: Inline format patterns (fallback)
    if (!vitals.bp) {
        const bpPattern = /\b(?:bp|blood\s*pressure)(?:\s+today)?(?:\s+is)?\s*[:-]?\s*(\d{2,3})\s*\/\s*(\d{2,3})\b/i;
        const bpMatch = text.match(bpPattern);
        if (bpMatch) {
            vitals.bp = `${bpMatch[1]}/${bpMatch[2]}`;
        }
        else {
            const inlineBp = text.match(/\b(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:mmhg)?\b/i);
            if (inlineBp &&
                Number.parseInt(inlineBp[1], 10) >= 60 &&
                Number.parseInt(inlineBp[1], 10) <= 250) {
                vitals.bp = `${inlineBp[1]}/${inlineBp[2]}`;
            }
        }
    }
    if (!vitals.hr) {
        const hrPattern = /\b(?:hr|heart\s*rate|pulse|p)(?:\s+of)?\s*[:-]?\s*(\d{2,3})\b/i;
        const hrMatch = text.match(hrPattern);
        if (hrMatch) {
            vitals.hr = Number.parseInt(hrMatch[1], 10);
        }
    }
    if (!vitals.rr) {
        const rrPattern = /\b(?:rr|resp(?:iratory)?\s*rate|breathing(?:\s+at)?|r)\s*[:-]?\s*(\d{1,2})(?:\s*breaths)?/i;
        const rrMatch = text.match(rrPattern);
        if (rrMatch) {
            vitals.rr = Number.parseInt(rrMatch[1], 10);
        }
    }
    if (!vitals.temp) {
        const tempPattern = /\b(?:t|temp|temperature)(?:\s+is)?(?:\s+normal)?(?:\s+at)?\s*[:-]?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|c)?\b/i;
        const tempMatch = text.match(tempPattern);
        if (tempMatch) {
            vitals.temp = Number.parseFloat(tempMatch[1]);
        }
    }
    if (!vitals.spo2) {
        const spo2Pattern = /\b(?:spo2|o2\s*sats?|oxygen\s*saturation)\s*[:-]?\s*(\d{2,3})\s*%?/i;
        const spo2Match = text.match(spo2Pattern);
        if (spo2Match) {
            vitals.spo2 = Number.parseInt(spo2Match[1], 10);
        }
    }
    const wtPattern = /\b(?:wt|weight)\s*[:-]?\s*(\d{2,3}(?:\.\d)?)\s*(kg|lb|lbs)?\b/i;
    const wtMatch = text.match(wtPattern);
    if (wtMatch) {
        vitals.weight = {
            value: Number.parseFloat(wtMatch[1]),
            unit: wtMatch[2]
                ? wtMatch[2].toLowerCase().replaceAll("lbs", "lb")
                : "unknown",
        };
    }
    const htPattern1 = /\b(?:ht|height)\s*[:-]?\s*(\d)\s*['']?\s*(\d{1,2})\s*[""]?\b/i;
    const htPattern2 = /\b(?:ht|height)\s*[:-]?\s*(\d{3})\s*cm\b/i;
    const htMatch1 = text.match(htPattern1);
    const htMatch2 = text.match(htPattern2);
    if (htMatch1) {
        vitals.height = `${htMatch1[1]}'${htMatch1[2]}"`;
    }
    else if (htMatch2) {
        vitals.height = `${htMatch2[1]} cm`;
    }
    return vitals;
}
/**
 * Extract medications with tolerant parsing
 * @param text - Medications section text
 * @returns Array of medication strings
 */
export function extractMeds(text) {
    if (!text)
        return [];
    let cleaned = text.replace(/^(?:medications?|current\s*meds?|home\s*meds?)[:-]?\s*/i, "");
    const delimiters = /[;\n,•-]/;
    const parts = cleaned.split(delimiters);
    const meds = parts
        .map((m) => m.trim())
        .filter((m) => {
        if (m.length < 2)
            return false;
        if (/^(none|n\/a|nkda|nil)$/i.test(m))
            return false;
        return true;
    })
        .map((m) => {
        return m.replace(/^[\s\-•]+/, "").trim();
    })
        .filter((m) => m.length > 0);
    return meds;
}
/**
 * Extract allergies (handles EPIC format with bullets and NKDA)
 * @param text - Full note text or allergies section text
 * @returns Array of allergy strings
 */
export function extractAllergies(text) {
    if (!text)
        return [];
    const allergyHeaderMatch = text.match(/(?:Review of patient'?s? allergies indicates?|^Allergies?:)/im);
    if (allergyHeaderMatch && allergyHeaderMatch.index !== undefined) {
        const startIndex = allergyHeaderMatch.index + allergyHeaderMatch[0].length;
        const remainingText = text.substring(startIndex);
        const sectionMatch = remainingText.match(/^[:\-\s]*\n?(?:Allergen\s+Reactions\s*)?\n?([^\n]+(?:\n[•\-\s]*[^\n]+)*)/i);
        if (!sectionMatch)
            return [];
        const allergyText = sectionMatch[1];
        if (/No Known (?:Drug )?Allergies|NKDA|None Known/i.test(allergyText)) {
            return ["NKDA"];
        }
        const bullets = allergyText.match(/[•-]\s*([^\n•\-\t]+)/g);
        if (bullets && bullets.length > 0) {
            return bullets
                .map((b) => b.replace(/^[•-]\s*/, "").trim())
                .map((b) => b.replace(/\t.*$/, "").trim())
                .filter((a) => a.length > 1 && !/^(Allergen|Reactions)$/i.test(a));
        }
        const items = allergyText.split(/[,\n]/);
        const allergies = items
            .map((a) => a.trim())
            .map((a) => a.split(/\s*-\s*/)[0].trim())
            .filter((a) => a.length > 1 && !/^(allergies?|allergen|reactions)$/i.test(a));
        if (allergies.length > 0)
            return allergies;
    }
    if (/^(?:allergies?|drug\s*allergies?|allergy|drug\s*sensitivities?|sensitivities?)[:-]/i.test(text.trim())) {
        const cleaned = text.replace(/^(?:allergies?|drug\s*allergies?|allergy|drug\s*sensitivities?|sensitivities?)[:-]?\s*/i, "");
        if (/^(none|nkda|no\s*known|nil)$/i.test(cleaned.trim())) {
            return ["NKDA"];
        }
        const delimiters = /[;\n,•]/;
        const allergies = cleaned
            .split(delimiters)
            .map((a) => a.trim())
            .map((a) => a.split(/\s*-\s*/)[0].trim())
            .filter((a) => a.length > 1);
        return allergies.length > 0 ? allergies : [];
    }
    return [];
}
/**
 * Extract diagnoses from assessment/impression text
 * @param text - Assessment text or full note
 * @returns Array of diagnosis strings
 */
export function extractDiagnoses(text) {
    if (!text)
        return [];
    const diagnoses = [];
    // Format 1: "Problems Addressed:" section
    const problemsMatch = text.match(/Problems Addressed:[:\n]+([\s\S]+?)(?:\n\n|Amount and\/or Complexity|Risk|$)/i);
    if (problemsMatch) {
        const problemsText = problemsMatch[1];
        const lines = problemsText.split("\n");
        for (const line of lines) {
            const diagMatch = line.match(/^([^:]+):/);
            if (diagMatch) {
                let diag = diagMatch[1].trim();
                diag = diag.replace(/\s+due to.*$/i, "");
                diag = diag.replace(/\s+of both.*$/i, "");
                diag = diag.replaceAll(/\(.*?\)/g, "");
                if (diag.length > 3) {
                    diagnoses.push(diag.trim());
                }
            }
        }
    }
    // Format 2: Numbered lists
    const numberedPattern = /(\d+|#)\.\s*([^\n]+)/g;
    const numberedMatches = text.matchAll(numberedPattern);
    for (const match of numberedMatches) {
        let diag = match[2].trim();
        diag = diag.replaceAll(/\s*\([^)]*\)\s*/g, " ").trim();
        diag = diag.replace(/\s*-\s*.+$/, "").trim();
        if (diag.length > 3) {
            diagnoses.push(diag);
        }
    }
    // Format 3: Bullet lists
    if (diagnoses.length === 0) {
        const bulletPattern = /[•-]\s*(.+)/g;
        const bulletMatches = text.matchAll(bulletPattern);
        for (const match of bulletMatches) {
            const diag = match[1].trim();
            if (diag.length > 3 && !/^(assessment|plan|diagnosis)/i.test(diag)) {
                diagnoses.push(diag);
            }
        }
    }
    // Format 4: Keyword extraction for common cardiology diagnoses
    const keywords = [
        { pattern: /\b(heart failure|HF|HFrEF|HFpEF|CHF|congestive heart failure)\b/i, canonical: "Heart failure" },
        { pattern: /\b(CAD|coronary artery disease)\b/i, canonical: "CAD" },
        { pattern: /\b(pneumonia|PNA)\b/i, canonical: "Pneumonia" },
        { pattern: /\b(GERD|gastroesophageal reflux)\b/i, canonical: "GERD" },
        { pattern: /\b(diabetes|DM|T2DM|type 2 diabetes|diabetes mellitus|new onset type 2 diabetes)\b/i, canonical: "Type 2 diabetes" },
        { pattern: /\b(CKD|chronic kidney disease)\b/i, canonical: "CKD" },
        { pattern: /\b(hypertension|HTN)\b/i, canonical: "Hypertension" },
        { pattern: /\b(atrial fibrillation|AFib|AF)\b/i, canonical: "Atrial fibrillation" },
        { pattern: /\b(CABG|coronary artery bypass)\b/i, canonical: "CABG" },
        { pattern: /\b(COPD|chronic obstructive pulmonary disease)\b/i, canonical: "COPD" },
        { pattern: /\b(stroke|CVA|cerebrovascular accident)\b/i, canonical: "Stroke" },
    ];
    for (const { pattern, canonical } of keywords) {
        if (pattern.test(text)) {
            const exactMatch = diagnoses.some((d) => d.toLowerCase() === canonical.toLowerCase());
            if (!exactMatch) {
                diagnoses.push(canonical);
            }
        }
    }
    return [...new Set(diagnoses)];
}
/**
 * Helper: Extract last numeric value from a line (for multi-column lab tables)
 * @param line - Lab result line
 * @param pattern - Regex pattern to match value
 * @returns Last numeric value or null
 */
function extractLastValue(line, pattern) {
    const matches = line.match(new RegExp(pattern, "g"));
    if (!matches || matches.length === 0)
        return null;
    return Number.parseFloat(matches[matches.length - 1]);
}
/**
 * Extract lab values from EPIC lab format
 * @param text - Full note text
 * @returns Extracted lab values
 */
export function extractLabs(text) {
    if (!text)
        return {};
    const labs = {};
    const lines = text.split("\n");
    const glucoseLine = lines.find((l) => /^GLU|^Glucose/i.test(l.trim()));
    if (glucoseLine) {
        const val = extractLastValue(glucoseLine, /\d{2,3}/);
        if (val)
            labs.glucose = val;
    }
    const hgbLine = lines.find((l) => /^HGB|^Hgb|^Hemoglobin/i.test(l.trim()));
    if (hgbLine) {
        const val = extractLastValue(hgbLine, /\d{1,2}\.\d+/);
        if (val)
            labs.hgb = val;
    }
    const crLine = lines.find((l) => /^CREATININE|^Creatinine/i.test(l.trim()));
    if (crLine) {
        const val = extractLastValue(crLine, /\d+\.\d+/);
        if (val)
            labs.creatinine = val;
    }
    const wbcLine = lines.find((l) => /^WBC/i.test(l.trim()));
    if (wbcLine) {
        const val = extractLastValue(wbcLine, /\d+\.\d+/);
        if (val)
            labs.wbc = val;
    }
    const bunLine = lines.find((l) => /^BUN|^Blood Urea Nitrogen/i.test(l.trim()));
    if (bunLine) {
        const val = extractLastValue(bunLine, /\d+\.?\d*/);
        if (val)
            labs.bun = val;
    }
    const bnpCommaMatch = text.match(/(?:NT-proBNP|BNP)[:\s=]+(\d{1,3}),(\d{3})/i);
    if (bnpCommaMatch) {
        labs.bnp = Number.parseInt(bnpCommaMatch[1] + bnpCommaMatch[2], 10);
    }
    else {
        const bnpSimpleMatch = text.match(/(?:NT-proBNP|BNP)[:\s=]+(\d{1,4})/i);
        if (bnpSimpleMatch) {
            labs.bnp = Number.parseInt(bnpSimpleMatch[1], 10);
        }
    }
    const tropMatch = text.match(/Troponin[^\d]*?(\d+\.?\d*)/i);
    if (tropMatch) {
        labs.troponin = Number.parseFloat(tropMatch[1]);
    }
    const lactateMatch = text.match(/(?:Lactic Acid Level|Lactate)\s+(\d+\.?\d*)/i);
    if (lactateMatch) {
        labs.lactate = Number.parseFloat(lactateMatch[1]);
    }
    const amylaseMatch = text.match(/Amylase Level\s+(\d+)/i);
    if (amylaseMatch) {
        labs.amylase = Number.parseInt(amylaseMatch[1], 10);
    }
    const lipaseMatch = text.match(/Lipase Level\s+(\d+)/i);
    if (lipaseMatch) {
        labs.lipase = Number.parseInt(lipaseMatch[1], 10);
    }
    return labs;
}
/**
 * Extract provider name from text
 * @param text - Full text
 * @returns Provider name or null
 */
export function extractProvider(text) {
    const patterns = [
        /(?:seen\s*by|attending|provider|physician)[:-]?\s*(dr\.?\s*[a-z\s]+)/i,
        /(?:^|\n)(dr\.?\s*[a-z\s]{3,20})(?:\n|$)/i,
        /((?:dr|md|do)\.?\s*[a-z]+(?:\s+[a-z]+)?)/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    return null;
}
/**
 * Extract patient demographics
 * @param text - Full text
 * @returns Demographics object
 */
export function extractDemographics(text) {
    const demographics = {};
    const agePattern = /\b(\d{1,3})[\s-]*(?:years?|yrs?|y\.?o\.?|yo)[\s-]*(?:old|m|f|male|female)?\b|\bage[:\s]+(\d{1,3})\b|[•-]\s*(\d{1,3})\s*y\.?o\.?\b/i;
    const ageMatch = text.match(agePattern);
    if (ageMatch) {
        demographics.age = Number.parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3], 10);
    }
    if (/\b(?:male|man|gentleman)\b/i.test(text) && !/\bfemale\b/i.test(text)) {
        demographics.gender = "male";
    }
    else if (/\b(?:female|woman|lady)\b/i.test(text)) {
        demographics.gender = "female";
    }
    else if (/\b\d+\s*y\.?o\.?\s+M\b/i.test(text)) {
        demographics.gender = "male";
    }
    else if (/\b\d+\s*y\.?o\.?\s+F\b/i.test(text)) {
        demographics.gender = "female";
    }
    else if (/\bM\s*\/\s*(?:male)?\b/i.test(text)) {
        demographics.gender = "male";
    }
    else if (/\bF\s*\/\s*(?:female)?\b/i.test(text)) {
        demographics.gender = "female";
    }
    const mrnPattern = /\bmrn[:\s]+([a-z0-9-]+)/i;
    const mrnMatch = text.match(mrnPattern);
    if (mrnMatch) {
        demographics.mrn = mrnMatch[1];
    }
    const dobPattern = /\b(?:dob|date\s*of\s*birth)[:\s]+([\d/-]+)/i;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
        demographics.dob = dobMatch[1];
    }
    return demographics;
}
//# sourceMappingURL=entityExtraction.js.map