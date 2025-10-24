// @ts-nocheck
/* eslint-env browser */
/* global requestIdleCallback */
import { debugLog, debugWarn, debugError } from "../utils/logger.js";

/*
  templateRenderer.js - Clinical Note Template Renderer
  ====================================================
  Purpose: Glue code to normalize parseNote() output and render selectable templates
  Features: Section normalization, SmartPhrase toggle, keyboard shortcuts, persistence

  NOTE: Assessment and Plan generation uses flexible pattern matching that works
  with any clinical note format. To extend with new conditions/procedures:
  1. Add pattern matching to generateAssessment() method
  2. Add management logic to generatePlan() method
  3. Follow the existing structure with regex patterns and duplicate checking
*/

// Section key normalization mapping
const SECTION_NORMALIZATION = {
  // Chief Complaint variations
  'Chief Complaint': 'CC',
  'chief complaint': 'CC',
  'chiefComplaint': 'CC',
  'CC': 'CC',
  'cc': 'CC',
  'Chief Complaint:': 'CC',
  'Reason for Consult': 'CC',
  'reason for consult': 'CC',
  'reasonForConsult': 'CC',
  'Presenting Complaint': 'CC',

  // History of Present Illness
  'History of Present Illness': 'HPI',
  'history of present illness': 'HPI',
  'HPI': 'HPI',
  'hpi': 'HPI',
  'Present Illness': 'HPI',
  'History of Present Illness:': 'HPI',

  // Past Medical History
  'Past Medical History': 'PMH',
  'past medical history': 'PMH',
  'pastMedicalHistory': 'PMH',
  'PMH': 'PMH',
  'pmh': 'PMH',
  'Medical History': 'PMH',
  'Past Medical History:': 'PMH',

  // Past Surgical History
  'Past Surgical History': 'PSH',
  'past surgical history': 'PSH',
  'PSH': 'PSH',
  'psh': 'PSH',
  'Surgical History': 'PSH',
  'Past Surgical History:': 'PSH',

  // Family History
  'Family History': 'FH',
  'family history': 'FH',
  'familyHistory': 'FH',
  'FH': 'FH',
  'fh': 'FH',
  'Family History:': 'FH',

  // Social History
  'Social History': 'SH',
  'social history': 'SH',
  'socialHistory': 'SH',
  'SH': 'SH',
  'sh': 'SH',
  'Social History:': 'SH',

  // Review of Systems
  'Review of Systems': 'ROS',
  'review of systems': 'ROS',
  'reviewOfSystems': 'ROS',
  'ROS': 'ROS',
  'ros': 'ROS',
  'Review of Systems:': 'ROS',
  'Systems Review': 'ROS',

  // Physical Exam
  'Physical Exam': 'PHYSICAL_EXAM',
  'physical exam': 'PHYSICAL_EXAM',
  'physicalExam': 'PHYSICAL_EXAM',
  'Physical Examination': 'PHYSICAL_EXAM',
  'PE': 'PHYSICAL_EXAM',
  'Exam': 'PHYSICAL_EXAM',

  // Medications
  'Medications': 'MEDS',
  'medications': 'MEDS',
  'MEDS': 'MEDS',
  'meds': 'MEDS',
  'Current Medications': 'MEDS',
  'current medications': 'MEDS',
  'Home Medications': 'MEDS',
  'Medications:': 'MEDS',

  // Allergies
  'Allergies': 'ALLERGIES',
  'allergies': 'ALLERGIES',
  'ALLERGIES': 'ALLERGIES',
  'Drug Allergies': 'ALLERGIES',
  'Allergies:': 'ALLERGIES',
  'NKDA': 'ALLERGIES',
  'No Known Drug Allergies': 'ALLERGIES',

  // Vitals
  'Vitals': 'VITALS',
  'vitals': 'VITALS',
  'VITALS': 'VITALS',
  'Vital Signs': 'VITALS',
  'vital signs': 'VITALS',
  'Vitals:': 'VITALS',

  // Diagnostics/Studies
  'Diagnostics': 'DIAGNOSTICS',
  'diagnostics': 'DIAGNOSTICS',
  'DIAGNOSTICS': 'DIAGNOSTICS',
  'Diagnostic Studies': 'DIAGNOSTICS',
  'Previous Diagnostic Studies': 'DIAGNOSTICS',
  'previousDiagnosticStudies': 'DIAGNOSTICS',
  'priorStudies': 'DIAGNOSTICS',
  'Studies': 'DIAGNOSTICS',
  'Imaging': 'DIAGNOSTICS',
  'imaging': 'DIAGNOSTICS',
  'ECG': 'DIAGNOSTICS',
  'EKG': 'DIAGNOSTICS',
  'ecg': 'DIAGNOSTICS',
  'Echocardiogram': 'DIAGNOSTICS',
  'Cardiac Studies': 'DIAGNOSTICS',
  'reviewManagement': 'DIAGNOSTICS',

  // Labs
  'Labs': 'LABS',
  'labs': 'LABS',
  'LABS': 'LABS',
  'Laboratory': 'LABS',
  'laboratory': 'LABS',
  'Laboratory Results': 'LABS',
  'Lab Results': 'LABS',
  'Labs:': 'LABS',

  // Assessment/Impression
  'Assessment': 'ASSESSMENT',
  'assessment': 'ASSESSMENT',
  'ASSESSMENT': 'ASSESSMENT',
  'Impression': 'ASSESSMENT',
  'impression': 'ASSESSMENT',
  'IMPRESSION': 'ASSESSMENT',
  'impressionFreeText': 'ASSESSMENT',
  'diagnoses': 'ASSESSMENT',
  'Assessment and Plan': 'ASSESSMENT',
  'Impression and Plan': 'ASSESSMENT',
  'A&P': 'ASSESSMENT',
  'Assessment:': 'ASSESSMENT',
  'Impression:': 'ASSESSMENT',

  // Plan
  'Plan': 'PLAN',
  'plan': 'PLAN',
  'PLAN': 'PLAN',
  'Plan:': 'PLAN',
  'planFreeText': 'PLAN',
  'Treatment Plan': 'PLAN',
  'Management Plan': 'PLAN',

  // Disposition
  'Disposition': 'DISPO',
  'disposition': 'DISPO',
  'DISPO': 'DISPO',
  'Disposition:': 'DISPO',
  'Discharge': 'DISPO',
  'discharge': 'DISPO',
  'Follow-up': 'DISPO',
  'Followup': 'DISPO'
};

// Template definitions
const TEMPLATES = {
  cis: {
    name: 'CIS Cerner H&P/Consult',
    sections: ['HPI', 'DIAGNOSTICS', 'ASSESSMENT', 'PLAN'],
    format: function(sections /*, useSmartPhrase, rewriteHPIFunction, fullParsedData */) {
      const hpiContent = sections.HPI && sections.HPI.trim() ? sections.HPI.trim() : '[History of Present Illness not available]';
      const assessmentContent = sections.ASSESSMENT && sections.ASSESSMENT.trim() ? sections.ASSESSMENT.trim() : '[Assessment not available]';
      const planContent = sections.PLAN && sections.PLAN.trim() ? sections.PLAN.trim() : '[Plan not available]';

      return `History of Present Illness:\n${hpiContent}\n\nAssessment:\n${assessmentContent}\n\nPlan:\n${planContent}`;
    }
  },
  consult: {
    name: 'Cardiology Consult',
    sections: ['CC', 'HPI', 'PMH', 'PSH', 'FH', 'SH', 'MEDS', 'ALLERGIES', 'ROS', 'VITALS', 'DIAGNOSTICS', 'LABS', 'PHYSICAL_EXAM', 'ASSESSMENT', 'PLAN'],
    format: {
      'CC': 'CHIEF COMPLAINT:\n{content}\n',
      'HPI': 'HISTORY OF PRESENT ILLNESS:\n{content}\n',
      'PMH': 'PAST MEDICAL HISTORY:\n{content}\n',
      'PSH': 'PAST SURGICAL HISTORY:\n{content}\n',
      'FH': 'FAMILY HISTORY:\n{content}\n',
      'SH': 'SOCIAL HISTORY:\n{content}\n',
      'MEDS': 'CURRENT MEDICATIONS:\n{content}\n',
      'ALLERGIES': 'ALLERGIES:\n{content}\n',
      'ROS': 'REVIEW OF SYSTEMS:\n{content}\n',
      'VITALS': 'VITAL SIGNS:\n{content}\n',
      'DIAGNOSTICS': 'DIAGNOSTIC STUDIES:\n{content}\n',
      'LABS': 'LABORATORY RESULTS:\n{content}\n',
      'PHYSICAL_EXAM': 'PHYSICAL EXAMINATION:\n{content}\n',
      'ASSESSMENT': 'ASSESSMENT:\n{content}\n',
      'PLAN': 'PLAN:\n{content}\n'
    }
  },
  progress: {
    name: 'Progress Note',
    // Locked to exactly three sections per latest instruction
    sections: ['HPI', 'ASSESSMENT', 'PLAN'],
    format: {
      'HPI': 'HPI:\n{content}\n',
      'ASSESSMENT': 'ASSESSMENT:\n{content}\n',
      'PLAN': 'PLAN:\n{content}\n'
    }
  }
};

// Template renderer class
class TemplateRenderer {
  constructor() {
    debugLog('🏗️ TemplateRenderer constructor called');
    this.useSmartPhrase = false;
    // Lock template to progress
    this.currentTemplate = 'progress';
    this.parsedData = null;
    this.normalizedSections = {};
    this.unmappedContent = {};

    debugLog('🔧 Calling init()...');
    this.init();
    debugLog('✅ TemplateRenderer constructor completed');
  }

  init() {
    this.createUI();
    this.bindEvents();
    this.loadSettings();
  }

  // Normalize parsed sections using the mapping
  normalizeSections(parsedData) {
    debugLog('🔍 normalizeSections: Starting...');
    const normalized = {};
    const unmapped = {};

    // Handle different possible structures from parseNote function
    if (parsedData && typeof parsedData === 'object') {
      // If we have a __full text, use that for better extraction
      let fullText = null;
      if (parsedData.sections && parsedData.sections.__full) {
        fullText = parsedData.sections.__full;
      }

      // Extract sections from full text if available
      if (fullText) {
        debugLog('🔍 normalizeSections: Extracting sections from full text...');
        const extractedSections = this.extractSectionsFromFullText(fullText);
        debugLog('🔍 normalizeSections: Sections extracted');
        // Merge extracted sections into parsedData
        Object.assign(parsedData, extractedSections);
      }

      // Handle nested sections object (e.g., sections.__preamble, sections.PMH, etc.)
      if (parsedData.sections && typeof parsedData.sections === 'object') {
        // Flatten sections into main level
        Object.entries(parsedData.sections).forEach(([key, value]) => {
          if (key === '__preamble' && !parsedData.HPI && !parsedData.hpi) {
            // Use preamble as HPI if no HPI exists
            parsedData['HPI'] = value;
          } else if (key === '__full' && !parsedData.fullText) {
            // Store full text separately
            parsedData['fullText'] = value;
          } else if (key !== '__preamble' && key !== '__full') {
            // Copy other section keys to main level if not empty
            if (!parsedData[key] && value && value.trim && value.trim()) {
              parsedData[key] = value;
            }
          }
        });
      }

      Object.entries(parsedData).forEach(([key, value]) => {
        // Skip meta and sections objects as we've processed them
        if (key === 'meta' || key === 'sections' || key === 'fullText') {
          unmapped[key] = value;
          return;
        }

        // FIX: Special handling for vitals array before checking normalization map
        if (key === 'vitals' && Array.isArray(value) && value.length > 0) {
          debugLog('🩺 normalizeSections: Processing vitals array');
          const vitalContent = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              return this.formatObject(item);
            }
            return String(item);
          }).join('\n');
          if (vitalContent && vitalContent.trim()) {
            normalized['VITALS'] = vitalContent;
            debugLog('✅ Vitals normalized:', vitalContent);
          }
          return; // Skip rest of processing for vitals
        }

        const normalizedKey = SECTION_NORMALIZATION[key];

        if (normalizedKey) {
          // Skip if value is undefined or null or empty string
          if (value === undefined || value === null || value === '') {
            return;
          }

          // Format content appropriately
          let content = value;
          if (Array.isArray(content)) {
            // Format arrays nicely
            content = content.map(item => {
              if (typeof item === 'object' && item !== null) {
                return this.formatObject(item);
              }
              return String(item);
            }).join('\n');
          } else if (typeof content === 'object' && content !== null) {
            content = this.formatObject(content);
          } else if (typeof content !== 'string') {
            content = String(content);
          }

          // Only add if content has actual value
          if (content && content.trim()) {
            // Special handling for HPI - rewrite it professionally
            if (normalizedKey === 'HPI') {
              debugLog('🔍 normalizeSections: Rewriting HPI (this may hang)...');
              content = this.rewriteHPIForConsult(content, parsedData);
              debugLog('🔍 normalizeSections: HPI rewritten');
            }
            normalized[normalizedKey] = content;
          }
        } else {
          // Store unmapped content for review
          unmapped[key] = value;
        }
      });

      // Generate Assessment & Plan if not present OR if they're too short (likely truncated)
      // FIX: Check for impressionFreeText and planFreeText from parser
      if (!normalized['ASSESSMENT'] || normalized['ASSESSMENT'].trim().length < 20) {
        // Try to use impressionFreeText from parser first
        if (parsedData.impressionFreeText && parsedData.impressionFreeText.trim()) {
          debugLog('✅ Using impressionFreeText from parser for ASSESSMENT');
          normalized['ASSESSMENT'] = parsedData.impressionFreeText.trim();
        } else if (parsedData.diagnoses && Array.isArray(parsedData.diagnoses) && parsedData.diagnoses.length > 0) {
          debugLog('✅ Using diagnoses array for ASSESSMENT');
          normalized['ASSESSMENT'] = parsedData.diagnoses.join('\n');
        } else {
          debugLog('🔧 Generating ASSESSMENT from full text analysis');
          normalized['ASSESSMENT'] = this.generateAssessment(parsedData, normalized);
        }
      }
      
      if (!normalized['PLAN'] || normalized['PLAN'].trim().length < 20) {
        // Try to use planFreeText from parser first
        if (parsedData.planFreeText && parsedData.planFreeText.trim()) {
          debugLog('✅ Using planFreeText from parser for PLAN');
          normalized['PLAN'] = parsedData.planFreeText.trim();
        } else {
          debugLog('🔧 Generating PLAN from full text analysis');
          normalized['PLAN'] = this.generatePlan(parsedData, normalized);
        }
      }
    }

    return { normalized, unmapped };
  }

  // Extract structured clinical data from diagnostics (echo, cath, labs, etc.)
  extractStructuredData(fullText) {
    const data = {
      echo: [],
      cath: [],
      labs: {},
      vitals: {},
      medications: [],
      ef: null,
      valves: {},
      cad: {},
      scores: {}
    };

    // Extract EF values with dates
    const efMatches = fullText.matchAll(/(?:ejection fraction|LVEF|EF).*?(\d{2})(?:-(\d{2}))?%/gi);
    for (const match of efMatches) {
      const efValue = match[2] ? `${match[1]}-${match[2]}` : match[1];
      const dateMatch = fullText.substring(Math.max(0, match.index - 100), match.index).match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
      data.ef = { value: efValue, date: dateMatch ? dateMatch[1] : null };
    }

    // Extract valve findings
    const valvePatterns = {
      aortic: /aortic valve:?\s*([^\n]+?)(?:\n|mitral|tricuspid|$)/gi,
      mitral: /mitral valve:?\s*([^\n]+?)(?:\n|aortic|tricuspid|$)/gi,
      tricuspid: /tricuspid valve:?\s*([^\n]+?)(?:\n|mitral|aortic|$)/gi
    };

    for (const [valve, pattern] of Object.entries(valvePatterns)) {
      const matches = [...fullText.matchAll(pattern)];
      if (matches.length > 0) {
        data.valves[valve] = matches.map(m => m[1].trim()).filter(v => v.length > 5);
      }
    }

    // Extract CAD/lesion data from cath
    const vesselPattern = /(?:Left main|LAD|left anterior descending|Circumflex|LCx|RCA|right coronary).*?:?\s*(\d{1,3}%.*?(?:lesion|stenosis|occlusion|patent))/gi;
    const vesselMatches = [...fullText.matchAll(vesselPattern)];
    if (vesselMatches.length > 0) {
      data.cad.lesions = vesselMatches.map(m => m[0].trim());
    }

    // Extract CHA2DS2-VASc score
    const chadsMatch = fullText.match(/CHA2?DS2?[- ]?VASc.*?(\d+)\s*(?:point|pt)/i);
    if (chadsMatch) {
      data.scores.chadsvasc = chadsMatch[1];
      const riskMatch = fullText.match(/(\d+\.?\d*)%\s*(?:stroke|risk)/i);
      if (riskMatch) data.scores.strokeRisk = riskMatch[1];
    }

    // Extract lab values
    const labPatterns = {
      creatinine: /(?:creatinine|Cr)[:\s]+(\d+\.?\d*)/i,
      bun: /BUN[:\s]+(\d+\.?\d*)/i,
      bnp: /BNP[:\s]+(\d+,?\d*)/i,
      troponin: /troponin[:\s]+([<>]?\d+\.?\d*)/i,
      hgb: /(?:H\/H|HGB)[:\s]+(\d+\.?\d*)\/(\d+\.?\d*)/i,
      potassium: /(?:potassium|K)[:\s]+(\d+\.?\d*)/i
    };

    for (const [lab, pattern] of Object.entries(labPatterns)) {
      const match = fullText.match(pattern);
      if (match) {
        data.labs[lab] = lab === 'hgb' ? `${match[1]}/${match[2]}` : match[1];
      }
    }

    // Extract pulmonary artery pressure
    const papMatch = fullText.match(/(?:PA|pulmonary artery).*?(?:systolic\s+)?pressure.*?(\d+)\s*mmHg/i);
    if (papMatch) data.vitals.pap = papMatch[1];

    // Extract baseline creatinine
    const baselineCrMatch = fullText.match(/baseline.*?(?:creatinine|Cr).*?(\d+\.?\d*)/i);
    if (baselineCrMatch) data.labs.baselineCr = baselineCrMatch[1];

    return data;
  }

  // Generate Assessment based on all clinical data with structured sub-bullets
  // This is a FALLBACK when no Assessment section is found in the source note
  // Diagnoses are ordered by clinical priority: ACS > Valve Disease > HF > Arrhythmia > CAD > Vascular > Other
 
// eslint-disable-next-line no-unused-vars
  generateAssessment(parsedData, normalizedSections) {
    const fullText = parsedData.fullText || '';

    // Extract structured data first
    const structuredData = this.extractStructuredData(fullText);

 
 
    // Organize diagnoses by priority
    // eslint-disable-next-line no-unused-vars
    const priorityGroups = {
      acute: [],      // STEMI, NSTEMI, Unstable Angina, ACS
      valve: [],      // VHD, AR, MR, MS, AS
      hf: [],         // Heart failure, cardiomyopathy
      rhythm: [],     // AFib, arrhythmias
      cad: [],        // CAD with lesion details
      vascular: [],   // AAA, aneurysms, PAD, pulm HTN
      respiratory: [], // COPD
      metabolic: [],  // HTN, HLD, DM
      other: []       // Everything else
    };

    const assessments = [];

    // Chest Pain (as primary presenting symptom/diagnosis)
    if (/(?:chief complaint|reason for consult|c\/o|presents.*?with).*?(?:chest pain|CP\b)/i.test(fullText) && !assessments.some(a => /chest pain/i.test(a))) {
      assessments.push('Chest Pain');
    }

    // === ACUTE CORONARY SYNDROMES (Highest Priority) ===
    // Only detect STEMI if explicitly mentioned OR if ST elevation is present WITHOUT "No STEMI" or "age undetermined"
    const hasNoStemi = /No STEMI|ruled out.*?STEMI|r\/o.*?STEMI.*?negative/i.test(fullText);
    const hasOldInfarct = /age undetermined|old infarct|prior infarct|remote infarct/i.test(fullText);
    
    if (!hasNoStemi && !hasOldInfarct && /(?:acute\s+)?STEMI|(?:acute\s+)?ST[- ]elevation myocardial infarction/i.test(fullText)) {
      const location = fullText.match(/\b(anterior|inferior|lateral|inferolateral|anterolateral|posterior|septal)\b.*?(?:STEMI|infarct)/i);
      assessments.push(location ? `STEMI, ${location[1]}` : 'STEMI');

      // PCI details
      if (/successful.*?(?:PCI|intervention)|PCI.*?successful/i.test(fullText)) {
        const vessel = fullText.match(/(?:PCI|intervention).*?(?:to|of)\s+(?:the\s+)?(?:mid\s+|proximal\s+|distal\s+)?(PDA|LAD|RCA|LCx|OM\d?|PLB|diagonal)/i);
        if (vessel && !assessments.some(a => a.includes(vessel[1]))) {
          const ivusUsed = /IVUS/i.test(fullText);
          assessments.push(`-Successful ${ivusUsed ? 'IVUS guided ' : ''}PCI of the ${vessel[1]}`);
        }
      }

      // Graft issues - check for atretic LIMA or poor flow
      if (/atretic|poor\s+flow/i.test(fullText) && /LIMA/i.test(fullText)) {
        if (/atretic\s+LIMA|LIMA.*?atretic|poor\s+flow.*?(?:into\s+)?(?:the\s+)?(?:native\s+)?LAD/i.test(fullText) && !assessments.some(a => /atretic|poor flow/i.test(a))) {
          assessments.push('-atretic LIMA with poor flow into the native LAD');
        }
      }
    } else if (/NSTEMI|non[- ]?ST[- ]?elevation/i.test(fullText) && !assessments.some(a => /NSTEMI/i.test(a))) {
      assessments.push('NSTEMI');
    } else if (/unstable\s+angina/i.test(fullText) && /chest\s+pain|crushing.*pain|substernal|angina/i.test(fullText) && !assessments.some(a => /angina/i.test(a))) {
      assessments.push('Unstable Angina');
    }

    // CABG status
    if (/CABG|coronary\s+artery\s+bypass/i.test(fullText) && !assessments.some(a => /CABG/i.test(a))) {
      const cabgNum = fullText.match(/CABG\s*x\s*(\d)/i);
      const grafts = [];

      if (/(?:LIMA|internal\s+mammary).*?(?:to|->)\s*(?:the\s+)?LAD/i.test(fullText)) grafts.push('LIMA to LAD');
      if (/SVG.*?(?:to|->)\s*(?:the\s+)?(OM\d?|obtuse\s+marginal)/i.test(fullText)) grafts.push('SVG to OM');
      if (/SVG.*?(?:to|->)\s*(?:the\s+)?PDA/i.test(fullText)) grafts.push('SVG to PDA');
      if (/SVG.*?(?:to|->)\s*(?:the\s+)?PLB/i.test(fullText)) grafts.push('SVG to PLB');
      if (/SVG.*?(?:to|->)\s*(?:the\s+)?RCA/i.test(fullText)) grafts.push('SVG to RCA');

      if (cabgNum) {
        assessments.push(`CAD/CABG x ${cabgNum[1]}`);
      } else if (grafts.length > 0) {
        assessments.push(`CAD/CABG x ${grafts.length}`);
      } else {
        assessments.push('CAD/CABG');
      }

      if (grafts.length > 0) {
        assessments.push(`-${grafts.join(', ')}`);
      }

      // Surgery date and surgeon
      const surgeryDate = fullText.match(/CABG.*?(\d{1,2}[./]\d{1,2}?[./]\d{2,4})/i) ||
                          fullText.match(/Procedure:.*?(\d{1,2}[./]\d{1,2}?[./]?\d{2,4})/i);
      const surgeon = fullText.match(/(?:with|w\/|by)\s+Dr\.?\s*(\w+)/i);

      if (surgeryDate && surgeon) {
        // Convert to user's preferred format (M.YYYY or M.D.YY)
        const dateStr = surgeryDate[1].replace(/\//g, '.');
        assessments.push(`-(${dateStr} w/ Dr. ${surgeon[1]})`);
      } else if (surgeryDate) {
        const dateStr = surgeryDate[1].replace(/\//g, '.');
        assessments.push(`-(${dateStr})`);
      }

      // LAA ligation
      if (/left\s+atrial\s+appendage.*?ligation|LAA.*?(?:ligation|clip)/i.test(fullText)) {
        assessments.push('-left atrial appendage ligation');
      }
    }

    // Cardiomyopathy
    if (/ischemic\s+cardiomyopathy|ICMO|ICM\b/i.test(fullText) ||
        (/cardiomyopathy/i.test(fullText) && /(?:CAD|ischemic|CABG)/i.test(fullText))) {
      if (!assessments.some(a => /cardiomyopathy|CMO/i.test(a))) {
        const ef = fullText.match(/(?:ejection\s+fraction|LVEF|EF).*?<?(\d{2})(?:-(\d{2}))?%/i);
        if (ef) {
          const efValue = ef[2] ? `${ef[1]}-${ef[2]}` : ef[1];
          const efNum = parseInt(ef[1]);
          assessments.push(`ICMO/EF ${efNum <= 30 ? '<' : ''}${efValue}%`);
        } else {
          assessments.push('ICMO/EF reduced');
        }
      }
    }

    // Common comorbidities
    if (/\b(?:hypertension|HTN)\b/i.test(fullText) && !assessments.some(a => /HTN/i.test(a))) {
      assessments.push('HTN');
    }

    if (/\b(?:hyperlipidemia|HLD|dyslipidemia)\b/i.test(fullText) && !assessments.some(a => /HLD/i.test(a))) {
      assessments.push('HLD');
    }

    if (/\b(?:diabetes|DM2|diabetic)\b/i.test(fullText) && !assessments.some(a => /DM|diabetes/i.test(a))) {
      const hba1c = fullText.match(/HgbA1c.*?[>]?\s*(\d+(?:\.\d+)?)/i) || fullText.match(/A1[Cc].*?(\d+(?:\.\d+)?)/i);
      if (hba1c && parseFloat(hba1c[1]) > 9) {
        assessments.push('DM2--poorly controlled');
        assessments.push(`-HgbA1c ${parseFloat(hba1c[1]) > 11 ? '>' : ''}${hba1c[1]}`);
      } else {
        assessments.push('DM2');
      }
    }

    // Additional cardiology conditions
    if (/atrial\s+fibrillation|paroxysmal.*?fib|AFib RVR|AF\b/i.test(fullText) && !assessments.some(a => /atrial.*fib|AFib/i.test(a))) {
      if (/paroxysmal/i.test(fullText)) {
        assessments.push('Paroxysmal Atrial Fibrillation');
      } else if (/RVR|rapid.*?ventricular/i.test(fullText)) {
        assessments.push('Atrial Fibrillation with RVR');
      } else {
        assessments.push('Atrial Fibrillation');
      }
    }

    if (/heart\s+failure|HF\b|HFrEF|HFpEF/i.test(fullText) && !assessments.some(a => /heart.*failure|HF\b/i.test(a))) {
      const ef = fullText.match(/(?:ejection\s+fraction|LVEF|EF).*?(\d{2})(?:-(\d{2}))?%/i);
      if (ef && parseInt(ef[1]) < 40) {
        assessments.push(`Heart Failure with reduced EF`);
      } else if (ef && parseInt(ef[1]) >= 50) {
        assessments.push('Heart Failure with preserved EF');
      } else {
        assessments.push('Heart Failure');
      }
    }

    // Valve disease - Aortic Regurgitation (skip trace findings)
    if (/aortic.*?regurgitation|aortic.*?insufficiency/i.test(fullText) && !/trace\s+(?:aortic\s+)?(?:regurgitation|insufficiency|AR)/i.test(fullText) && !assessments.some(a => /aortic.*regurg/i.test(a))) {
      const severity = fullText.match(/(mild|moderate|severe)\s+(?:to\s+)?(mild|moderate|severe)?\s*aortic.*?(?:regurgitation|insufficiency)/i);
      if (severity) {
        assessments.push(`Aortic Regurgitation (${severity[2] ? severity[1] + ' to ' + severity[2] : severity[1]})`);
      } else {
        assessments.push('Aortic Regurgitation');
      }
    }

    // Mitral Regurgitation (only moderate-severe; skip trace/mild/1+)
    if (/mitral.*?regurgitation|mitral.*?insufficiency/i.test(fullText) && !assessments.some(a => /mitral.*regurg/i.test(a))) {
      const severity = fullText.match(/(moderate|severe)\s+(?:to\s+)?(moderate|severe)?\s*(?:\(\d\+\))?\s*mitral.*?regurgitation/i);
      if (severity) {
        assessments.push(`Mitral Regurgitation (${severity[2] ? severity[1] + ' to ' + severity[2] : severity[1]})`);
      } else if (!/trace|mild|\(1\+\)/i.test(fullText.match(/mitral.*?regurgitation[^.]{0,50}/i)?.[0] || '')) {
        assessments.push('Mitral Regurgitation');
      }
    }

    // Only detect Mitral Stenosis if explicitly mentioned (MS is too generic)
    if (/mitral.*?stenosis/i.test(fullText) && !assessments.some(a => /mitral.*stenos/i.test(a))) {
      assessments.push('Mitral Stenosis');
    }

    // Vascular conditions
    if (/\b(?:AAA|abdominal\s+aortic\s+aneurysm)\b/i.test(fullText) && !assessments.some(a => /AAA|aneurysm/i.test(a))) {
      const size = fullText.match(/(?:AAA|aneurysm).*?(\d+\.?\d*)\s*cm/i);
      assessments.push(size ? `AAA (${size[1]} cm)` : 'AAA');
    }

    if (/ascending\s+aortic\s+aneurysm/i.test(fullText) && !assessments.some(a => /ascending.*aneurysm/i.test(a))) {
      const size = fullText.match(/ascending.*?aneurysm.*?(\d+)\s*mm/i);
      assessments.push(size ? `Ascending Aortic Aneurysm (${size[1]} mm)` : 'Ascending Aortic Aneurysm');
    }

    if (/\bPAD\b|peripheral\s+arterial\s+disease/i.test(fullText) && !assessments.some(a => /PAD|peripheral.*arterial/i.test(a))) {
      assessments.push('PAD');
    }

    if (/pulmonary\s+hypertension/i.test(fullText) && !assessments.some(a => /pulmonary.*hypertension/i.test(a))) {
      const pap = fullText.match(/(?:PA|pulmonary artery).*?(?:pressure|systolic).*?(\d+)\s*mmHg/i);
      assessments.push(pap ? `Pulmonary Hypertension (PA ${pap[1]} mmHg)` : 'Pulmonary Hypertension');
    }

    // Respiratory
    if (/\bCOPD\b|chronic\s+obstructive/i.test(fullText) && !assessments.some(a => /COPD/i.test(a))) {
      assessments.push('COPD');
    }

    // Gastrointestinal
    if (/\bGERD\b|gastroesophageal\s+reflux/i.test(fullText) && !assessments.some(a => /GERD/i.test(a))) {
      assessments.push('GERD');
    }

    // Hepatic
    if (/hepatitis/i.test(fullText) && !assessments.some(a => /hepatitis/i.test(a))) {
      assessments.push('Hepatitis');
    }

    // Substance use
    if (/tobacco\s+(?:use|abuse|disorder)|smoking|smoker/i.test(fullText) && !assessments.some(a => /tobacco/i.test(a))) {
      assessments.push('Tobacco use');
    }

    // Other conditions
    if (/\b(?:acute\s+)?lower\s+back\s+pain|lumbar.*?pain|LBP\b/i.test(fullText) && !assessments.some(a => /back.*pain/i.test(a))) {
      assessments.push('Acute lower back pain');
    }

    if (/\b(?:anxiety|anxious)\b/i.test(fullText) && !assessments.some(a => /anxiety/i.test(a))) {
      assessments.push('Anxiety');
    }

    if (/graves|hyperthyroid/i.test(fullText) && !assessments.some(a => /graves|thyroid/i.test(a))) {
      assessments.push('Graves disease');
    }

    if (/\bCKD|chronic\s+kidney\s+disease|renal\s+insufficiency/i.test(fullText) && !assessments.some(a => /kidney|CKD|renal/i.test(a))) {
      const stage = fullText.match(/CKD\s+(?:stage\s+)?(\d|[IV]+)/i);
      assessments.push(stage ? `CKD stage ${stage[1]}` : 'CKD');
    }

    // Anemia
    if (structuredData.labs.hgb) {
      const hgbValue = parseFloat(structuredData.labs.hgb.split('/')[0]);
      if (hgbValue < 12 && !assessments.some(a => /anemia/i.test(a))) {
        assessments.push(`Anemia (H/H ${structuredData.labs.hgb})`);
      }
    }

    // AKI
    if (structuredData.labs.creatinine && structuredData.labs.baselineCr) {
      const currentCr = parseFloat(structuredData.labs.creatinine);
      const baselineCr = parseFloat(structuredData.labs.baselineCr);
      if (currentCr > baselineCr * 1.5 && !assessments.some(a => /AKI|acute.*kidney/i.test(a))) {
        assessments.push(`AKI (Cr ${currentCr}, baseline ${baselineCr})`);
      }
    }

    // CAD (from cath findings)
    if (structuredData.cad.lesions && structuredData.cad.lesions.length > 0 && !assessments.some(a => /^CAD/i.test(a))) {
      assessments.push('CAD');
      structuredData.cad.lesions.forEach(lesion => {
        assessments.push(`-${lesion}`);
      });
    }

    if (assessments.length === 0) {
      return '[Assessment to be completed based on clinical presentation]';
    }

    // Sort assessments by clinical priority
    const sortedAssessments = this.sortAssessmentsByPriority(assessments);
    return sortedAssessments.join('\n');
  }

  // Sort diagnoses by clinical priority, keeping sub-bullets with their parent
  sortAssessmentsByPriority(assessments) {
    const priorityOrder = {
      // Symptoms/Presenting complaints
      'Chest Pain': 0,

      // Acute life-threatening (highest priority)
      'STEMI': 1, 'NSTEMI': 2, 'Unstable Angina': 3,

      // Valve disease
      'VHD': 10, 'Aortic': 11, 'Mitral': 12, 'Tricuspid': 13,

      // Heart failure
      'Heart Failure': 20, 'Acute': 21, 'Systolic': 22, 'ICMO': 23,

      // Arrhythmias
      'Atrial Fibrillation': 30, 'Paroxysmal': 31, 'Atrial Flutter': 32,

      // CAD
      'CAD': 40,

      // Vascular
      'AAA': 50, 'Aneurysm': 51, 'PAD': 52, 'Pulmonary Hypertension': 53,

      // Respiratory
      'COPD': 60, 'exacerbation': 61,

      // Metabolic/chronic (lower priority)
      'HTN': 70, 'HLD': 71, 'DM': 72, 'Diabetes': 73,

      // Other
      'Anemia': 80, 'AKI': 81, 'CKD': 82, 'GERD': 83, 'Hepatitis': 84, 'Tobacco': 85,
      'Anxiety': 90, 'Graves': 91
    };

    // Group diagnoses with their sub-bullets
    const groups = [];
    let currentGroup = [];

    for (const assessment of assessments) {
      if (assessment.startsWith('-')) {
        // Sub-bullet - add to current group
        currentGroup.push(assessment);
      } else {
        // Main diagnosis - start new group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [assessment];
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Sort groups by the priority of their first (main) diagnosis
    groups.sort((a, b) => {
      const scoreA = this.getDiagnosisPriority(a[0], priorityOrder);
      const scoreB = this.getDiagnosisPriority(b[0], priorityOrder);
      return scoreA - scoreB;
    });

    // Flatten back to single array
    return groups.flat();
  }

  // Get priority score for a diagnosis
  getDiagnosisPriority(diagnosis, priorityOrder) {
    // Check each keyword in priority order
    for (const [keyword, priority] of Object.entries(priorityOrder)) {
      if (diagnosis.includes(keyword)) {
        return priority;
      }
    }
    return 100; // Default priority for unrecognized diagnoses
  }

  // Generate Plan based on Assessment and clinical data
  // This is a FALLBACK when no Plan section is found in the source note
  generatePlan(parsedData, normalizedSections) {
    const plans = [];
    const fullText = parsedData.fullText || '';
    const assessment = normalizedSections['ASSESSMENT'] || '';

    // Try to generate evidence-based plan first (TypeScript integration)
    if (typeof globalThis.generateEvidenceBasedPlan === 'function') {
      try {
        const evidencePlan = globalThis.generateEvidenceBasedPlan(parsedData);
        if (evidencePlan) {
          plans.push('=== Evidence-Based Clinical Plan ===');
          plans.push(evidencePlan);
          plans.push('\n=== Additional Clinical Considerations ===');
        }
      } catch (error) {
        debugWarn('Evidence-based plan generation failed:', error);
      }
    }

    // Diagnostic review
    if (/echo|echocardiogram|TTE/i.test(fullText) && /reviewed|review/i.test(fullText)) {
      plans.push('Echo reviewed');
    }
    if (/(?:cardiac\s+)?cath|LHC.*?reviewed/i.test(fullText) && /reviewed/i.test(fullText)) {
      plans.push('Cath reviewed');
    }

    // DAPT management for ACS/PCI (only if not on anticoagulation)
    const onAnticoag = /apixaban|eliquis|rivaroxaban|xarelto|warfarin|coumadin|dabigatran|pradaxa/i.test(fullText);
    if (/STEMI|NSTEMI|ACS|PCI|stent/i.test(assessment + fullText) && !onAnticoag) {
      const p2y12Drug = fullText.match(/\b(ticagrelor|brilinta|clopidogrel|plavix|prasugrel|effient)\b/i);
      if (p2y12Drug) {
        const drugName = p2y12Drug[1].toLowerCase();
        const displayName = drugName === 'ticagrelor' ? 'Brilinta' :
                           drugName === 'clopidogrel' ? 'Plavix' :
                           drugName === 'prasugrel' ? 'Effient' : drugName;
        plans.push(`Continue DAPT (ASA and ${displayName})`);
      } else {
        plans.push('Continue DAPT (ASA and P2Y12 inhibitor)');
      }
    }

    // GDMT optimization
    if (/ICMO|cardiomyopathy|CMO|heart\s+failure|HFrEF/i.test(assessment + fullText)) {
      if (/optimize|optimization|GDMT/i.test(fullText)) {
        plans.push('Optimize GDMT for CMO as tolerated');
      } else {
        plans.push('Continue GDMT for heart failure');
      }
    }

    // Co-management
    if (/internal\s+medicine.*?following|IM\s+following|hospitalist.*?following/i.test(fullText)) {
      plans.push('Internal medicine following');
    } else if (/cardiology.*?following/i.test(fullText)) {
      plans.push('Cardiology following');
    }

    // Planned procedures
    if (/will.*?(?:plan|proceed|undergo).*?(?:LHC|cath)|plan.*?(?:LHC|cath)|(?:LHC|cath).*?(?:today|planned|scheduled)/i.test(fullText)) {
      const vessel = fullText.match(/(?:LHC|cath|intervention).*?(?:to|of)\s+(?:the\s+)?(?:native\s+)?(LAD|RCA|LCx|OM|PDA|PLB)/i);
      const timing = fullText.match(/\b(today|tomorrow|this\s+(?:morning|afternoon)|urgent(?:ly)?)\b/i);

      let planText = 'Will plan for LHC';
      if (vessel) {
        planText += ` with intervention to ${vessel[1]}`;
      } else {
        planText += ' with possible intervention';
      }
      if (timing) {
        planText += ` ${timing[1]}`;
      }

      if (/risk.*?benefit.*?alternative|consent.*?discussed|discussed.*?risk/i.test(fullText)) {
        planText += '. Risk, Benefits and Alternatives Reviewed and Discussed with the PT and their Family and they wish to proceed with above Procedure.';
      }

      plans.push(planText);

      // NPO and consent
      if (/NPO|nothing\s+by\s+mouth/i.test(fullText)) {
        plans.push('NPO since midnight');
      }
      if (/consent.*?(?:obtained|on\s+chart|signed)/i.test(fullText)) {
        plans.push('Consent obtained and placed on chart');
      }
    }

    // Anticoagulation
    if (/atrial\s+fibrillation|AFib/i.test(assessment + fullText)) {
      const anticoag = fullText.match(/\b(warfarin|coumadin|apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa)\b/i);
      if (anticoag) {
        plans.push(`Continue anticoagulation with ${anticoag[1]}`);
      }
    }

    // Monitoring
    if (/telemetry|tele\s+monitoring|continuous\s+monitoring/i.test(fullText)) {
      plans.push('Continue telemetry monitoring');
    }

    // Follow-up
    if (/follow[- ]?up/i.test(fullText)) {
      const followUpMatch = fullText.match(/follow[- ]?up.*?(\d+)\s*(day|week|month)/i);
      if (followUpMatch) {
        plans.push(`Follow-up in ${followUpMatch[1]} ${followUpMatch[2]}s`);
      }
    }

    if (plans.length === 0) {
      return '[Plan to be completed based on clinical assessment and discussion with patient]';
    }

    return plans.join('\n');
  }

  // Rewrite HPI for a professional cardiology consult note
  rewriteHPIForConsult(originalHPI, parsedData) {
    if (!originalHPI) return '';

    // Extract key information from the original HPI
    const info = this.extractHPIInfo(originalHPI, parsedData);

    // Build professional consult HPI
    let consultHPI = '';

    // Opening statement
    if (info.age && info.gender) {
      consultHPI += `This is a ${info.age}-year-old ${info.gender}`;
    } else {
      consultHPI += 'The patient';
    }

    // Add known to provider if available
    if (info.provider) {
      consultHPI += ` who is known to ${info.provider}`;
    }

    // Add medical history
    if (info.medicalHistory && info.medicalHistory.length > 0) {
      consultHPI += `, with history of ${info.medicalHistory.join(', ')}`;
    }

    consultHPI += '. ';

    // Presentation
    if (info.presentationDate) {
      consultHPI += `The patient presented to the ${info.presentationLocation || 'emergency department'} on ${info.presentationDate}`;
    } else {
      consultHPI += `The patient presented to the ${info.presentationLocation || 'emergency department'}`;
    }

    if (info.transportMethod) {
      consultHPI += ` via ${info.transportMethod}`;
    }

    // Chief complaint and symptoms
    if (info.chiefComplaint) {
      consultHPI += ` with ${info.chiefComplaint}`;
    }

    consultHPI += '. ';

    // Symptom details
    if (info.symptomDetails) {
      consultHPI += info.symptomDetails + ' ';
    }

    // Vitals if available - defensive null guards
    const vitals = info?.vitals || {};
    debugLog('🩺 rewriteHPIForConsult: info.vitals =', info?.vitals);
    
    if (vitals && Object.keys(vitals).length > 0) {
      const vitalsParts = [];
      // Try both uppercase and lowercase keys, plus common aliases
      const BP = vitals.BP || vitals.bp || vitals.bloodPressure;
      const HR = vitals.HR || vitals.hr || vitals.pulse;
      const RR = vitals.RR || vitals.rr || vitals.respiratoryRate;
      const temp = vitals.temp || vitals.temperature;
      const spo2 = vitals.spo2 || vitals.SpO2;
      
      if (BP) vitalsParts.push(`BP: ${BP} mmHg`);
      if (HR) vitalsParts.push(`HR: ${HR} bpm`);
      if (RR) vitalsParts.push(`RR: ${RR}/min`);
      if (temp) vitalsParts.push(`Temp: ${temp}°F`);
      if (spo2) vitalsParts.push(`SpO2: ${spo2}%`);
      
      debugLog('🩺 rewriteHPIForConsult: vitalsParts =', vitalsParts);
      if (vitalsParts.length > 0) {
        consultHPI += `On presentation, vitals: ${vitalsParts.join(', ')}. `;
      }
    }

    // Diagnostic findings
    if (info.diagnosticFindings && info.diagnosticFindings.length > 0) {
      consultHPI += `Initial workup revealed ${info.diagnosticFindings.join(', ')}. `;
    }

    // Reason for consult
    if (info.consultReason) {
      consultHPI += `Cardiology consultation has been requested for ${info.consultReason}. `;
    }

    // Hospital course if available
    if (info.hospitalCourse) {
      consultHPI += '\n\nHospital Course:\n' + info.hospitalCourse;
    }

    return consultHPI.trim();
  }

  // Extract structured information from HPI text
  extractHPIInfo(hpiText, parsedData) {
    const info = {
      age: null,
      gender: null,
      provider: null,
      medicalHistory: [],
      presentationDate: null,
      presentationLocation: null,
      transportMethod: null,
      chiefComplaint: null,
      symptomDetails: null,
      diagnosticFindings: [],
      consultReason: null,
      hospitalCourse: null,
      vitals: null
    };

    // Extract age
    const ageMatch = hpiText.match(/(\d{1,3})[-\s]*year[-\s]*old/i);
    if (ageMatch) info.age = ageMatch[1];

    // Extract gender
    if (/\bfemale\b|\bwoman\b/i.test(hpiText)) {
      info.gender = 'female';
    } else if (/\bmale\b|\bman\b/i.test(hpiText)) {
      info.gender = 'male';
    }

    // Extract provider (skip if "unknown to" or facility names)
    const providerMatch = hpiText.match(/known to\s+(?:Dr\.\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (providerMatch && !/unknown to/i.test(hpiText)) {
      const provider = providerMatch[1].trim();
      // Skip if it's a facility name (contains "cardiology", all caps acronym, etc.)
      if (!/cardiology|^[A-Z]{2,}$|hospital|clinic/i.test(provider)) {
        info.provider = provider.startsWith('Dr.') ? provider : 'Dr. ' + provider;
      }
    }

    // Extract medical history conditions from PMH or HPI
    const fullTextMatch = parsedData.fullText || hpiText;
    const historyPatterns = [
      /PMH:\s*([^\n]+(?:\n(?!PSH)[^\n]+)*)/i,
      /Past Medical History:\s*([^\n]+(?:\n(?!Past Surgical)[^\n]+)*)/i,
      /history of ([^.]+?)(?:\.|She presented|He presented|The patient presented)/i
    ];
    for (const pattern of historyPatterns) {
      const match = fullTextMatch.match(pattern);
      if (match) {
        const conditions = match[1].split(/,|\band\b/).map(c => c.trim()).filter(c => c.length > 2 && c.length < 50);
        info.medicalHistory = conditions.slice(0, 5); // Limit to top 5
        break;
      }
    }

    // Extract presentation date
    const dateMatch = hpiText.match(/(?:presented|started)[^.]*?(?:on|at)\s+(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);
    if (dateMatch) info.presentationDate = dateMatch[1];

    // Extract presentation location
    const locationMatch = hpiText.match(/presented to (?:the\s+)?(\w+)/i);
    if (locationMatch) {
      const loc = locationMatch[1].toLowerCase();
      if (loc === 'er' || loc === 'ed') {
        info.presentationLocation = 'emergency department';
      } else {
        info.presentationLocation = locationMatch[1];
      }
    }

    // Extract transport method
    const transportMatch = hpiText.match(/via\s+(EMS|ambulance|private vehicle)/i);
    if (transportMatch) info.transportMethod = transportMatch[1];

    // Extract chief complaint/symptoms
    const complaintPatterns = [
      /presents?.*?with\s+reports?\s+of\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|\.)/i,
      /presents?.*?with\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /complain(?:s|ing)\s+of\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /stated\s+(?:she|he)\s+had\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /chief complaint.*?:\s*(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|\.)/i
    ];
    for (const pattern of complaintPatterns) {
      const match = hpiText.match(pattern);
      if (match && match[1].length < 150) {
        info.chiefComplaint = match[1].trim().replace(/\.?\s*ED workup.*$/i, '');
        break;
      }
    }

    // Extract diagnostic findings from ED workup
    const workupMatch = hpiText.match(/\.?\s*(?:ED workup|Initial workup)\s+revealed\s+(.+?)(?:\s*\.?\s*CIS\b|\s*cardiology\b|\. CIS|$)/i);
    if (workupMatch) {
      const findings = workupMatch[1].split(/,\s*(?![^()]*\))/).map(f => f.trim()).filter(f => f.length > 3);
      info.diagnosticFindings.push(...findings);
    }

    // Extract diagnostic findings (EKG, labs, imaging)
    if (/EKG|ECG/i.test(hpiText)) {
      const ekgMatch = hpiText.match(/(?:EKG|ECG)\s+(?:revealed|showed)\s+([^.]+)/i);
      if (ekgMatch) {
        info.diagnosticFindings.push('EKG showing ' + ekgMatch[1].trim());
      }
    }

    // Extract troponin if mentioned
    if (/troponin/i.test(hpiText)) {
      const tropMatch = hpiText.match(/(elevated|positive|negative)\s+troponin/i);
      if (tropMatch) {
        info.diagnosticFindings.push(tropMatch[1] + ' troponin');
      }
    }

    // Extract reason for consult
    const consultMatch = hpiText.match(/(?:CIS|cardiology)[^.]*?consulted to (?:evaluate|assess)\s+([^.]+)/i) ||
                         hpiText.match(/consultation\s+(?:has been\s+)?requested for ([^.]+)/i) ||
                         hpiText.match(/Reason for Consult:\s*([^\n]+)/i) ||
                         hpiText.match(/Chief Complaint.*?:\s*([^\n]+)/i);
    if (consultMatch) {
      info.consultReason = consultMatch[1].trim();
    } else if (info.diagnosticFindings.length > 0) {
      info.consultReason = 'further evaluation and management';
    }

    // Extract hospital course if present
    const courseMatch = hpiText.match(/Hospital Course:([\s\S]+?)(?=\n\n|$)/i);
    if (courseMatch) {
      info.hospitalCourse = courseMatch[1].trim();
    }

    // Extract vitals from parsedData if available
    if (parsedData && parsedData.vitals && Object.keys(parsedData.vitals).length > 0) {
      debugLog('🩺 extractHPIInfo: Found vitals in parsedData:', parsedData.vitals);
      info.vitals = parsedData.vitals;
    } else {
      debugLog('🩺 extractHPIInfo: No vitals found. parsedData:', parsedData ? 'exists' : 'null', 
                  'parsedData.vitals:', parsedData?.vitals);
    }

    return info;
  }

  // Extract sections from full text when parser fails
  extractSectionsFromFullText(fullText) {
    const sections = {};

    // Extract PMH
    const pmhMatch = fullText.match(/PMH:\s*(.+?)(?=\nPSH:|$)/is);
    if (pmhMatch && pmhMatch[1].trim()) {
      sections['Past Medical History'] = pmhMatch[1].trim();
    }

    // Extract PSH
    const pshMatch = fullText.match(/PSH:\s*(.+?)(?=\nSocial History:|$)/is);
    if (pshMatch && pshMatch[1].trim()) {
      sections['Past Surgical History'] = pshMatch[1].trim();
    }

    // Extract Social History
    const shMatch = fullText.match(/Social History:\s*(.+?)(?=\nFamily History:|$)/is);
    if (shMatch && shMatch[1].trim()) {
      sections['Social History'] = shMatch[1].trim();
    }

    // Extract Family History (actual family history, not diagnostics)
    const fhMatch = fullText.match(/Family History:\s*(.+?)(?=\n\nPrevious Cardiac Diagnostics:|$)/is);
    if (fhMatch && fhMatch[1].trim() && !fhMatch[1].includes('TTE') && !fhMatch[1].includes('LHC')) {
      sections['Family History'] = fhMatch[1].trim();
    }

    // Extract Previous Diagnostic Studies / Previous Cardiac Diagnostics
    const diagMatch = fullText.match(/Previous Cardiac Diagnostics:\s*(.+?)(?=\nReview of Systems|$)/is);
    if (diagMatch && diagMatch[1].trim()) {
      sections['Diagnostics'] = diagMatch[1].trim();
    }

    // Extract Review of Systems
    const rosMatch = fullText.match(/Review of Systems\s*(.+?)(?=\n\nObjective:|$)/is);
    if (rosMatch && rosMatch[1].trim()) {
      sections['Review of Systems'] = rosMatch[1].trim();
    }

    // Extract Medications from the detailed list
    const medsMatch = fullText.match(/Current Facility-Administered Medications:\s*(.+?)$/is);
    if (medsMatch && medsMatch[1].trim()) {
      sections['Medications'] = medsMatch[1].trim();
    }

    // Extract Vitals from "Vital Signs (Most Recent):" section OR other common formats
    // FIX: Support multiple vitals header variations
    const vitalsMatch = fullText.match(/Vital Signs \(Most Recent\):\s*(.+?)(?=\nVital Signs \(24h Range\):|Weight:|Physical Exam|Labs|$)/is) ||
                        fullText.match(/(?:^|\n)Vitals?:\s*(.+?)(?=\n(?:[A-Z][A-Za-z\s]+:|$))/is) ||
                        fullText.match(/(?:^|\n)VS:\s*(.+?)(?=\n(?:[A-Z][A-Za-z\s]+:|$))/is) ||
                        fullText.match(/(?:^|\n)Vital Signs:\s*(.+?)(?=\n(?:[A-Z][A-Za-z\s]+:|$))/is);
    if (vitalsMatch && vitalsMatch[1].trim()) {
      debugLog('✅ Extracted vitals section');
      sections['Vitals'] = vitalsMatch[1].trim();
    }

    // Extract Labs from detailed lab tables
    const labsMatch = fullText.match(/Significant Labs:\s*(.+?)(?=\nTelemetry:|Physical Exam|$)/is);
    if (labsMatch && labsMatch[1].trim()) {
      sections['Labs'] = labsMatch[1].trim();
    }

    // Extract Physical Exam
    const peMatch = fullText.match(/Physical Exam\s*(.+?)(?=\nCurrent Inpatient Medications:|$)/is);
    if (peMatch && peMatch[1].trim()) {
      sections['Physical Exam'] = peMatch[1].trim();
    }

    return sections;
  }

  // Format objects in a readable way for medical notes
  formatObject(obj) {
    if (!obj || typeof obj !== 'object') return String(obj);

    // Handle special cases for lab/vital objects
    if (obj.name && obj.value) {
      // Lab or vital result format
      let result = `${obj.name}: ${obj.value}`;
      if (obj.unit) result += ` ${obj.unit}`;
      if (obj.refRange) result += ` (ref: ${obj.refRange})`;
      return result;
    }

    // Handle medication objects
    if (obj.name && (obj.dose || obj.route || obj.frequency)) {
      return `${obj.name} ${obj.dose || ''} ${obj.route || ''} ${obj.frequency || ''}`.trim();
    }

    // Handle allergy objects
    if (obj.substance && obj.reaction) {
      return `${obj.substance} - ${obj.reaction}`;
    }

    // Generic object formatting - make it readable
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          lines.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'object') {
          lines.push(`${key}: ${this.formatObject(value)}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    }
    return lines.join('\n');
  }

  // Apply SmartPhrase substitutions
  applySmartPhrases(content) {
    if (!this.useSmartPhrase) return content;

    const now = new Date();
    const replacements = {
      '.ptname': '[PATIENT NAME]',
      '.mrn': '[MRN]',
      '.dob': '[DOB]',
      '.now': now.toLocaleString()
    };

    let result = content;
    Object.entries(replacements).forEach(([phrase, replacement]) => {
      result = result.replace(new RegExp(phrase.replace('.', '\\.'), 'g'), replacement);
    });

    return result;
  }

  // Rewrite HPI to match CIS format and structure, preserving original content when available
  rewriteHPI(originalHPI, patientName) {
    if (!originalHPI || typeof originalHPI !== 'string') {
      return `${patientName} is a [age] y/o [gender] who is known to CIS, Dr. [Provider] (start with this sentence). The patient presented to the ER on [date] (date of admission) with complaints of SOB/CP/BLE Swelling. The patient reported that the CP started 2 days (timing) prior to admission (put date of admission) and was located to his mid-sternal chest wall (location). The pain was described as a "stabbing" (quality) sensation and lasted for about 20 minutes (duration) without identifying factors). The patient denied any 8 out of 10 on a verbal assessment scale (severity). He reported that he had some SOB and Nausea associated with the CP (associated symptoms). In the ER he became Lethargic had a battery of laboratory and diagnostic studies which revealed a negative troponin and an EKG (some TX was Inversion in the Lateral Leads (sentence about what was discovered in the ER). Secondary to the patients symptoms and diagnostic findings he was admitted for CP R/O. The patient continues to have CP and reports that it is progressively worsening since admission. (sentence about why and what they were admitted for, and then give a brief update on the patient).`;
    }

    // Extract key clinical elements from the original HPI
    const hpiAnalysis = this.analyzeHPI(originalHPI);

    // Check if this appears to be a complete, well-structured HPI already
    const isWellStructuredHPI = this.isWellStructuredHPI(originalHPI);

    if (isWellStructuredHPI) {
      // For well-structured HPIs like Elena's, preserve the original content with minimal CIS formatting
      const actualPatientName = hpiAnalysis.patientName || patientName;
      let rewrittenHPI = '';

      // Add CIS opening if not already present
      if (!originalHPI.toLowerCase().includes('known to cis')) {
        rewrittenHPI += `${actualPatientName} is a ${hpiAnalysis.age || '[age]'} y/o ${hpiAnalysis.gender || '[gender]'} who is known to CIS, Dr. [Provider]. `;
      }

      // Add the original HPI content (cleaned of redundant patient intro if present)
      let cleanedOriginal = originalHPI;

      // Remove redundant patient intro if it exists at the beginning
      cleanedOriginal = cleanedOriginal.replace(/^(The (?:client|patient) is [^,]+,?\s*)/i, '');
      cleanedOriginal = cleanedOriginal.replace(/^(a \d+[-\s]*year[-\s]*old [^.]+\.?\s*)/i, '');

      rewrittenHPI += cleanedOriginal.trim();

      // Add standard CIS closure if clinical presentation suggests evaluation/admission
      if (!originalHPI.toLowerCase().includes('admission') && !originalHPI.toLowerCase().includes('evaluate')) {
        rewrittenHPI += ' The patient is being evaluated for cardiology consultation and further management as clinically indicated.';
      }

      return rewrittenHPI;
    }

    // For less structured HPIs, use the original comprehensive rewriting approach
    let rewrittenHPI = '';

    // Opening sentence (CIS requirement) - use extracted patient name or fall back to provided patientName
    const actualPatientName = hpiAnalysis.patientName || patientName;
    rewrittenHPI += `${actualPatientName} is a ${hpiAnalysis.age || '[age]'} y/o ${hpiAnalysis.gender || '[gender]'} who is known to CIS, Dr. [Provider]. `;

    // Presentation details
    if (hpiAnalysis.presentationLocation || hpiAnalysis.presentationDate) {
      rewrittenHPI += `The patient presented to the ${hpiAnalysis.presentationLocation || 'ER'} on ${hpiAnalysis.presentationDate || '[date]'} (date of admission) `;
    } else {
      rewrittenHPI += `The patient presented to the ER on [date] (date of admission) `;
    }

    // Chief symptoms
    const symptoms = hpiAnalysis.symptoms.length > 0 ? hpiAnalysis.symptoms.join('/') : 'SOB/CP/BLE Swelling';
    rewrittenHPI += `with complaints of ${symptoms}. `;

    // Primary symptom analysis (focus on most prominent)
    const primarySymptom = this.identifyPrimarySymptom(hpiAnalysis);
    if (primarySymptom) {
      rewrittenHPI += this.buildSymptomNarrative(primarySymptom, hpiAnalysis);
    } else if (hpiAnalysis.timing || hpiAnalysis.location || hpiAnalysis.quality || hpiAnalysis.duration || hpiAnalysis.severity) {
      // Only include symptom details if they were actually found in the note
      rewrittenHPI += `The patient reported that the symptoms started `;
      if (hpiAnalysis.timing) rewrittenHPI += `${hpiAnalysis.timing} (timing) `;
      rewrittenHPI += `prior to admission`;
      if (hpiAnalysis.location) rewrittenHPI += ` and were located to ${hpiAnalysis.location} (location)`;
      rewrittenHPI += `. `;
      if (hpiAnalysis.quality) rewrittenHPI += `The symptoms were described as "${hpiAnalysis.quality}" (quality) `;
      if (hpiAnalysis.duration) rewrittenHPI += `and lasted for about ${hpiAnalysis.duration} (duration) `;
      if (hpiAnalysis.severity) rewrittenHPI += `with severity rated as ${hpiAnalysis.severity} on a verbal assessment scale (severity)`;
      rewrittenHPI += `. `;
    }

    // Associated symptoms
    if (hpiAnalysis.associatedSymptoms.length > 0) {
      rewrittenHPI += `He reported that he had ${hpiAnalysis.associatedSymptoms.join(', ')} associated with the primary complaint (associated symptoms). `;
    }

    // Emergency department course
    if (hpiAnalysis.edCourse.length > 0 || hpiAnalysis.diagnostics.length > 0) {
      rewrittenHPI += `In the ER, `;
      if (hpiAnalysis.edCourse.length > 0) {
        rewrittenHPI += `the patient ${hpiAnalysis.edCourse.join(', ')} and `;
      }
      rewrittenHPI += `had a battery of laboratory and diagnostic studies`;

      if (hpiAnalysis.diagnostics.length > 0) {
        rewrittenHPI += ` which revealed ${hpiAnalysis.diagnostics.join(', ')}`;
      }
      rewrittenHPI += ` (sentence about what was discovered in the ER). `;
    }

    // Admission reasoning
    if (hpiAnalysis.admissionReason) {
      rewrittenHPI += `Secondary to the patient's symptoms and diagnostic findings he was admitted for ${hpiAnalysis.admissionReason}. `;
    } else {
      rewrittenHPI += `Secondary to the patient's symptoms and diagnostic findings he was admitted for ${primarySymptom?.name || 'CP'} R/O. `;
    }

    // Current status/update
    if (hpiAnalysis.currentStatus) {
      rewrittenHPI += `${hpiAnalysis.currentStatus} (sentence about current status and update on the patient).`;
    } else {
      rewrittenHPI += `The patient continues to have intermittent symptoms and reports stable condition since admission (sentence about current status and update on the patient).`;
    }

    return rewrittenHPI;
  }

  // Determine if an HPI is already well-structured and complete
  isWellStructuredHPI(hpi) {
    const indicators = [
      // Has patient demographics
      /\d+[-\s]*year[-\s]*old/i,
      // Has symptom timeline
      /(four hours|hours of|reports|presented)/i,
      // Has symptom description
      /(symptoms?|complaints?|pain|shortness|fatigue)/i,
      // Has vital signs or clinical findings
      /(blood pressure|heart rate|vital|mmhg|bpm)/i
    ];

    let score = 0;
    indicators.forEach(pattern => {
      if (pattern.test(hpi)) score++;
    });

    // Consider it well-structured if it has at least 3 out of 4 indicators
    return score >= 3;
  }

  // Analyze HPI content to extract structured data
  analyzeHPI(hpi) {
    const analysis = {
      age: null,
      gender: null,
      presentationLocation: null,
      presentationDate: null,
      symptoms: [],
      timing: null,
      location: null,
      quality: null,
      duration: null,
      severity: null,
      associatedSymptoms: [],
      edCourse: [],
      diagnostics: [],
      admissionReason: null,
      currentStatus: null,
      patientName: null
    };

    const text = hpi.toLowerCase();

    // Extract age - look for age pattern specifically (not "years ago" or other contexts)
    const ageMatch = hpi.match(/(\d{1,3})[-\s]*(?:year|y\.?o\.?)[-\s]*old/i) ||
                     hpi.match(/(\d{1,3})\s*y\.?o\.?\s/i) ||
                     hpi.match(/(\d{1,3})\s*years?\s+old/i) ||
                     hpi.match(/(\d{1,3})-year-old/i);
    if (ageMatch) analysis.age = ageMatch[1];

    // Extract patient name if present
    const nameMatch = hpi.match(/(?:client|patient)\s+is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]\.?)?)/i) ||
                      hpi.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z]\.?)?)\s+is\s+a\s+\d+/i);
    if (nameMatch) analysis.patientName = nameMatch[1];

    // Extract gender
    if (text.includes('female') || text.includes('woman') || text.includes('she') || text.includes('her')) {
      analysis.gender = 'female';
    } else if (text.includes('male') || text.includes('man') || text.includes('he') || text.includes('his') || text.includes('him')) {
      analysis.gender = 'male';
    }

    // Extract presentation location
    const locationPatterns = ['emergency room', 'emergency department', 'ed', 'er', 'clinic', 'hospital', 'office'];
    for (const loc of locationPatterns) {
      if (text.includes(loc)) {
        analysis.presentationLocation = loc.toUpperCase();
        break;
      }
    }

    // Extract symptoms
    const symptomPatterns = [
      'chest pain', 'cp', 'shortness of breath', 'sob', 'dyspnea', 'palpitations',
      'syncope', 'dizziness', 'fatigue', 'swelling', 'edema', 'nausea', 'vomiting',
      'diaphoresis', 'sweating', 'weakness', 'pressure', 'tightness', 'indigestion',
      'lightheaded', 'clammy'
    ];

    symptomPatterns.forEach(symptom => {
      if (text.includes(symptom)) {
        const formatted = symptom.toUpperCase().replace('CHEST PAIN', 'CP').replace('SHORTNESS OF BREATH', 'SOB');
        if (!analysis.symptoms.includes(formatted)) {
          analysis.symptoms.push(formatted);
        }
      }
    });

    // Extract timing
    const timingMatch = hpi.match(/(?:started|began|onset|since)\s+(\d+\s+(?:days?|hours?|weeks?|months?)\s+(?:ago|prior))/i);
    if (timingMatch) analysis.timing = timingMatch[1];

    // Extract location (anatomical)
    const locationMatch = hpi.match(/(?:located|pain)\s+(?:in|to|at)\s+([^.]+?)(?:\s+\(|\.|,)/i);
    if (locationMatch) analysis.location = locationMatch[1].trim();

    // Extract quality
    const qualityPatterns = ['stabbing', 'sharp', 'dull', 'aching', 'burning', 'squeezing', 'crushing', 'pressure', 'tearing'];
    for (const quality of qualityPatterns) {
      if (text.includes(quality)) {
        analysis.quality = quality;
        break;
      }
    }

    // Extract severity
    const severityMatch = hpi.match(/(\d+(?:\/\d+|\s+out\s+of\s+\d+))/i);
    if (severityMatch) analysis.severity = severityMatch[1] + ' on a verbal assessment scale';

    // Extract diagnostics
    const diagnosticPatterns = [
      'negative troponin', 'elevated troponin', 'ekg', 'ecg', 'chest x-ray', 'ct scan',
      'echo', 'labs', 'blood work', 't-wave', 'st elevation', 'st depression'
    ];

    diagnosticPatterns.forEach(diag => {
      if (text.includes(diag)) {
        analysis.diagnostics.push(diag);
      }
    });

    // Extract admission reason
    const admissionMatch = hpi.match(/admitted\s+for\s+([^.]+)/i);
    if (admissionMatch) analysis.admissionReason = admissionMatch[1].trim();

    return analysis;
  }

  // Identify the primary symptom to focus the narrative
  identifyPrimarySymptom(analysis) {
    const symptomPriority = {
      'CP': { name: 'chest pain', priority: 1 },
      'SOB': { name: 'shortness of breath', priority: 2 },
      'PALPITATIONS': { name: 'palpitations', priority: 3 },
      'SYNCOPE': { name: 'syncope', priority: 4 },
      'SWELLING': { name: 'swelling', priority: 5 }
    };

    let primarySymptom = null;
    let highestPriority = 999;

    analysis.symptoms.forEach(symptom => {
      const symptomData = symptomPriority[symptom];
      if (symptomData && symptomData.priority < highestPriority) {
        highestPriority = symptomData.priority;
        primarySymptom = symptomData;
      }
    });

    return primarySymptom;
  }

  // Build symptom-specific narrative
  buildSymptomNarrative(primarySymptom, analysis) {
    let narrative = '';

    switch (primarySymptom.name) {
      case 'chest pain':
        narrative += `The patient reported that the chest pain started ${analysis.timing || '2 days ago'} (timing) prior to admission and was located ${analysis.location ? 'in the ' + analysis.location : 'substernally'} (location). `;
        narrative += `The pain was described as ${analysis.quality ? '"' + analysis.quality + '"' : '"pressure-like"'} (quality) and lasted ${analysis.duration || 'several minutes at a time'} (duration). `;
        if (analysis.severity) {
          narrative += `The patient rated the pain ${analysis.severity} (severity). `;
        }
        break;

      case 'shortness of breath':
        narrative += `The patient reported that the shortness of breath started ${analysis.timing || '1 week ago'} (timing) prior to admission and has been ${analysis.quality || 'progressively worsening'} (quality). `;
        narrative += `The dyspnea occurs ${analysis.duration || 'with minimal exertion'} (duration/triggers). `;
        break;

      case 'palpitations':
        narrative += `The patient reported palpitations that began ${analysis.timing || '3 days ago'} (timing) prior to admission. `;
        narrative += `The palpitations were described as ${analysis.quality || 'rapid and irregular'} (quality) and lasted ${analysis.duration || 'several hours'} (duration). `;
        break;

      default:
        narrative += `The patient reported that the ${primarySymptom.name} started ${analysis.timing || '2 days ago'} (timing) prior to admission. `;
        if (analysis.quality) {
          narrative += `It was described as ${analysis.quality} (quality). `;
        }
        break;
    }

    return narrative;
  }

  // Render template
  renderTemplate(templateType = this.currentTemplate) {
    // Force template to 'progress'
    templateType = 'progress';
    if (!this.normalizedSections) {
      return 'No data to render. Please parse a note first.';
    }

    const template = TEMPLATES[templateType];
    if (!template) {
      return 'Invalid template type.';
    }

    let output = '';

    // Handle CIS template differently (function-based format)
    if (templateType === 'cis' && typeof template.format === 'function') {
      output = template.format(this.normalizedSections, this.useSmartPhrase, this.rewriteHPI.bind(this), this.parsedData);
    } else {
      // Handle standard templates (object-based format)
      output = `${template.name}\n${'='.repeat(template.name.length)}\n\n`;

      // Render each section
      template.sections.forEach(sectionKey => {
        if (this.normalizedSections[sectionKey]) {
          let content = this.normalizedSections[sectionKey];
          content = this.applySmartPhrases(content);

          const sectionFormat = template.format[sectionKey];
          output += sectionFormat.replace('{content}', content) + '\n';
        }
      });
    }

    // Add unmapped content if any - COMMENTED OUT FOR PRODUCTION
    /* if (Object.keys(this.unmappedContent).length > 0) {
      output += '\n\nUNMAPPED (REVIEW):\n' + '='.repeat(18) + '\n';
      Object.entries(this.unmappedContent).forEach(([key, value]) => {
        let content = value;
        if (Array.isArray(content)) {
          content = content.join('\n');
        } else if (typeof content === 'object' && content !== null) {
          content = JSON.stringify(content, null, 2);
        }
        output += `${key}:\n${content}\n\n`;
      });
    } */

    // Skip AI insights block for locked progress output (must be exactly 3 sections)
    if (templateType !== 'progress' && this.parsedData && (this.parsedData.assessment || this.parsedData.plan || this.parsedData.citations)) {
      output += '\n\n' + '='.repeat(60) + '\n';
      output += 'AI-POWERED CLINICAL INSIGHTS\n';
      output += '='.repeat(60) + '\n\n';
      
      if (this.parsedData.assessment && Array.isArray(this.parsedData.assessment) && this.parsedData.assessment.length > 0) {
        output += 'AI Assessment Points:\n';
        this.parsedData.assessment.forEach((point, i) => {
          output += `  ${i + 1}. ${point}\n`;
        });
        output += '\n';
      }
      
      if (this.parsedData.plan && Array.isArray(this.parsedData.plan) && this.parsedData.plan.length > 0) {
        output += 'AI Recommended Plan:\n';
        this.parsedData.plan.forEach((item, i) => {
          output += `  ${i + 1}. ${item}\n`;
        });
        output += '\n';
      }
      
      // Add RAG provenance if evidence documents are available
      if (this.parsedData.evidenceDocs && Array.isArray(this.parsedData.evidenceDocs) && this.parsedData.evidenceDocs.length > 0) {
        const ev = this.parsedData.evidenceDocs;
        const titles = ev.slice(0, 3).map(e => e?.title).filter(Boolean);
        const more = ev.length > 3 ? `, +${ev.length - 3} more` : '';
        output += `Based on: ${titles.join(', ')}${more} (Azure Search)\n\n`;
      }
      
      if (this.parsedData.citations && Array.isArray(this.parsedData.citations) && this.parsedData.citations.length > 0) {
        output += 'Supporting Guidelines:\n';
        this.parsedData.citations.forEach((cite, i) => {
          const title = cite.title || `Citation ${i + 1}`;
          const url = cite.url || 'Internal guideline';
          output += `  [${i + 1}] ${title}\n      ${url}\n`;
        });
        output += '\n';
      }
      
      output += '⚠️  NOTE: AI insights are supplementary. Always verify with clinical judgment.\n';
      output += '='.repeat(60) + '\n';
    }

    return output.trim();
  }

  // Populate Guidelines & Teaching section based on detected diagnoses
  async populateGuidelinesAndTeaching(normalized) {
    try {
      // Extract diagnoses from assessment
      const assessment = normalized.ASSESSMENT || '';
      const detectedDiagnoses = this.extractDiagnosesFromAssessment(assessment);

      if (detectedDiagnoses.length === 0) {
        debugLog('No diagnoses detected for guidelines generation');
        return;
      }

      debugLog('Detected diagnoses:', detectedDiagnoses);

      // Load diagnosis database
      const response = await fetch('./data/cardiology_diagnoses/cardiology.json');
      if (!response.ok) {
        debugWarn('Could not load diagnosis database');
        return;
      }
      const database = await response.json();

      // Find matching diagnosis data
      const matchedDiagnoses = detectedDiagnoses
        .map(diagId => database.diagnoses.find(d => d.id === diagId))
        .filter(d => d !== undefined);

      if (matchedDiagnoses.length === 0) {
        debugLog('No matching diagnosis data found');
        return;
      }

      // Generate guidelines content
      const guidelinesHTML = this.generateGuidelinesHTML(matchedDiagnoses);
      const teachingHTML = this.generateTeachingHTML(matchedDiagnoses);

      // Populate the DOM
      const guidelinesContainer = document.querySelector('#acc-guidelines-out .content');
      const teachingContainer = document.querySelector('#teaching-insights-out .content');

      if (guidelinesContainer) {
        guidelinesContainer.innerHTML = guidelinesHTML;
      }
      if (teachingContainer) {
        teachingContainer.innerHTML = teachingHTML;
      }

      debugLog('✅ Guidelines & Teaching populated successfully');
    } catch (error) {
      debugError('Error populating guidelines:', error);
    }
  }

  // Extract diagnosis IDs from assessment text
  extractDiagnosesFromAssessment(assessment) {
    const diagnosisMap = {
      'atrial fibrillation': 'afib',
      'afib': 'afib',
      'a fib': 'afib',
      'acute coronary syndrome': 'acs',
      'nstemi': 'acs',
      'stemi': 'acs',
      'unstable angina': 'acs',
      'heart failure': 'chf',
      'chf': 'chf',
      'congestive heart failure': 'chf',
      'hfref': 'hfref',
      'heart failure with reduced': 'hfref',
      'hfpef': 'hfpef',
      'heart failure with preserved': 'hfpef',
      'hypertension': 'htn',
      'htn': 'htn',
      'hypertensive': 'htn',
      'coronary artery disease': 'angina',
      'cad': 'angina',
      'chest pain': 'angina',
      'angina': 'angina',
      'aortic stenosis': 'as',
      'mitral regurgitation': 'mr',
      'pulmonary embolism': 'pe',
      'deep vein thrombosis': 'dvt',
      'dvt': 'dvt',
      'syncope': 'syncope',
      'cardiogenic shock': 'cardiogenic_shock',
      'pericarditis': 'pericarditis',
      'myocarditis': 'myocarditis',
      'bradycardia': 'bradyarrhythmia',
      'av block': 'bradyarrhythmia'
    };

    const lowerAssessment = assessment.toLowerCase();
    const detected = new Set();

    for (const [keyword, diagId] of Object.entries(diagnosisMap)) {
      if (lowerAssessment.includes(keyword)) {
        detected.add(diagId);
      }
    }

    return Array.from(detected);
  }

  // Generate ACC/AHA Guidelines HTML
  generateGuidelinesHTML(diagnoses) {
    let html = '';

    diagnoses.forEach(diag => {
      html += `
        <div class="guideline-section">
          <h4>📋 ${diag.name}</h4>
          <div class="guideline-content">
            <h5>Management:</h5>
            <ul>
              ${diag.management.slice(0, 5).map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });

    return html || '<p>No specific guidelines available for detected diagnoses.</p>';
  }

  // Generate Teaching Insights & Safety Alerts HTML
  generateTeachingHTML(diagnoses) {
    let html = '';

    diagnoses.forEach(diag => {
      html += `
        <div class="teaching-section">
          <h4>💡 ${diag.name}</h4>
          <div class="teaching-content">
            <h5>Clinical Pearls:</h5>
            <ul>
              ${diag.pearls.slice(0, 4).map(pearl => `<li>${pearl}</li>`).join('')}
            </ul>
            <h5>Key Features to Monitor:</h5>
            <ul>
              ${diag.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });

    return html || '<p>Complete the assessment to see teaching points.</p>';
  }

  // Process note with existing parseNote function
  async processNote(text) {
    // ========== INSTRUMENTATION START ==========
    window.CallGraph.reset();
    window.CallGraph.start('processNote', text);
    window.trace('INPUT: processNote', text, { showSample: true });
    // ========== INSTRUMENTATION END ==========

    if (!text || typeof text !== 'string') {
      debugWarn('Invalid text provided to processNote');
      window.CallGraph.error(new Error('Invalid text input'));
      return;
    }

    // Show processing indicator
    const parseBtn = document.getElementById('vs-parse');
    const originalBtnText = parseBtn ? parseBtn.innerHTML : '';
    if (parseBtn) {
      parseBtn.disabled = true;
      parseBtn.innerHTML = '⏳ Processing...';
    }

    // Show character count for very large notes
    const charCount = text.length;
    if (charCount > 10000) {
      this.showSuccess(`Processing large note (${Math.round(charCount/1000)}k characters)... Please wait.`);
    } else if (charCount > 5000) {
      this.showSuccess('Processing note... This may take a moment.');
    } else {
      this.showSuccess('Processing note...');
    }

    // Use requestAnimationFrame + Promise to prevent UI blocking
    await new Promise(resolve => requestAnimationFrame(resolve));

    // For very large notes, add an initial substantial delay to let UI update
    const initialDelay = charCount > 20000 ? 300 : charCount > 10000 ? 150 : 50;
    await new Promise(resolve => setTimeout(resolve, initialDelay));

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          debugLog('Starting parse...');

        // STAGE 1: Detect input type
        window.CallGraph.start('detectHPIOnlyInput', text);
        const isHPIOnly = this.detectHPIOnlyInput(text);
        window.CallGraph.end(isHPIOnly);
        window.trace('STAGE 1: Detect HPI-only', isHPIOnly);

        let parsedData = null;

        if (isHPIOnly) {
          // STAGE 2A: Generate full note from HPI
          debugLog('Detected HPI-only input, generating full note...');
          window.CallGraph.start('generateFullNoteFromHPI', text);
          parsedData = this.generateFullNoteFromHPI(text);
          window.CallGraph.end(parsedData);
          window.trace('STAGE 2A: Generated from HPI', parsedData);
        } else {
          // STAGE 2B: Use parser
          window.CallGraph.start('parseNote', text);

          // For very long notes (>5000 chars), yield to UI between stages
          if (text.length > 5000) {
            this.showSuccess('Processing large note... (this may take a moment)');
            await new Promise(resolve => requestAnimationFrame(resolve));
          }

          // For VERY large notes (>20k), use simpler parser to avoid freezing
          const useSimpleParser = text.length > 20000;

          // Wrap parsing in a promise with adaptive delay based on note size
          // Very large notes need significant delay to allow UI updates
          const parseDelay = text.length > 20000 ? 1000 :
                            text.length > 15000 ? 600 :
                            text.length > 10000 ? 400 :
                            text.length > 5000 ? 200 : 100;
          debugLog(`Using parse delay: ${parseDelay}ms for ${text.length} characters`);

          // Update button text with estimated wait time for large notes
          if (parseBtn) {
            if (text.length > 20000) {
              parseBtn.innerHTML = `⏳ Processing large note... Please wait`;
            } else if (text.length > 15000) {
              const estimatedSeconds = Math.ceil(parseDelay / 1000) + 3;
              parseBtn.innerHTML = `⏳ Processing... (~${estimatedSeconds}s)`;
            }
          }

          // Use requestIdleCallback for very large notes if available
          const useIdleCallback = text.length > 20000 && typeof requestIdleCallback !== 'undefined';

          parsedData = await new Promise((resolveParser, rejectParser) => {
            const doParse = () => {
              try {
                let result;

                // For very large notes, use simpler parser
                if (useSimpleParser && window.parseNoteIntoSections) {
                  debugLog('⚠️ Using SIMPLIFIED parser for very large note (>20k chars)');
                  result = window.safeParse('parseNoteIntoSections', window.parseNoteIntoSections, text);
                } else if (window.parseClinicalNoteFull) {
                  debugLog('✅ Using parseClinicalNoteFull...');
                  result = window.safeParse('parseClinicalNoteFull', window.parseClinicalNoteFull, text);
                  debugLog('🔍 Parser function returned, result type:', typeof result);
                  debugLog('🔍 About to resolve parser promise...');
                } else if (window.parseClinicalNote) {
                  debugLog('✅ Using parseClinicalNote...');
                  result = window.safeParse('parseClinicalNote', window.parseClinicalNote, text);
                } else if (window.parseNoteIntoSections) {
                  debugLog('✅ Using parseNoteIntoSections...');
                  result = window.safeParse('parseNoteIntoSections', window.parseNoteIntoSections, text);
                } else {
                  debugError('❌ NO PARSER FOUND!');
                  debugLog('Available parsers:', {
                    parseClinicalNoteFull: typeof window.parseClinicalNoteFull,
                    parseClinicalNote: typeof window.parseClinicalNote,
                    parseNoteIntoSections: typeof window.parseNoteIntoSections
                  });
                  rejectParser(new Error('No parsing function available'));
                  return;
                }
                debugLog('🔍 Calling resolveParser...');
                resolveParser(result);
                debugLog('🔍 resolveParser called');
              } catch (error) {
                debugError('Parser threw error:', error);
                rejectParser(error);
              }
            };

            // For very large notes, wait for browser idle time
            if (useIdleCallback) {
              debugLog('Using requestIdleCallback for large note');
              let fallbackTriggered = false;
              const fallbackTimer = setTimeout(() => {
                fallbackTriggered = true;
                debugWarn('requestIdleCallback fallback triggered; running parse immediately');
                doParse();
              }, parseDelay);

              requestIdleCallback(() => {
                if (fallbackTriggered) {
                  return;
                }
                clearTimeout(fallbackTimer);
                doParse();
              }, { timeout: parseDelay + 500 });
            } else {
              setTimeout(doParse, parseDelay);
            }
          });

          debugLog('🔍 Parser promise resolved, calling CallGraph.end...');
          window.CallGraph.end(parsedData);
          debugLog('🔍 CallGraph.end complete, calling trace...');
          // DISABLED: trace can freeze on large objects with circular refs
          // window.trace('STAGE 2B: Parsed note', parsedData);
          debugLog('🔍 Trace skipped, yielding to UI...');

          // Yield to UI after parsing
          await new Promise(resolve => requestAnimationFrame(resolve));
          debugLog('🔍 UI yielded, continuing...');
        }

        if (!parsedData) {
          throw new Error('Parser returned null/undefined');
        }

        // Debug: quick summary of parsed structure
        try {
          const sectionKeys = parsedData && parsedData.sections ? Object.keys(parsedData.sections) : [];
          debugLog('🧩 Parsed object keys:', Object.keys(parsedData || {}));
          debugLog('🧩 Parsed.sections keys:', sectionKeys);
        } catch {
          // ignore
        }

        // STAGE 2.5: Enrich with AI Analysis (fail-soft)
        if (typeof window.enrichWithAIAnalysis === 'function') {
          debugLog('🤖 Enriching with AI analysis...');
          try {
            // Call AI analyzer to enrich parsed data
            parsedData = await window.enrichWithAIAnalysis(parsedData, text);
            debugLog('✅ AI enrichment complete');
          } catch (aiError) {
            debugWarn('⚠️  AI enrichment failed, continuing with base parse:', aiError);
            // Continue with unenriched data - fail-soft
          }
        }

        // STAGE 3: Validate parsed data schema
        // Note: HPI-only input generates direct sections (no 'sections' wrapper)
        // Full notes have {sections: {...}, fullText: '...'}
        if (isHPIOnly) {
          // HPI-only generates flat structure with section keys
          window.validateSchema('generateFullNoteFromHPI', parsedData, [], { allowNull: false, allowEmpty: false });
        } else {
          // Full notes require sections and fullText
          window.validateSchema('parseClinicalNote', parsedData, ['sections', 'fullText'], { allowNull: false });
        }

        // STAGE 4: Normalize sections
        debugLog('Parse complete, normalizing...');

        // Yield to UI after parsing before normalization
        if (text.length > 10000) {
          this.showSuccess('Parsing complete, normalizing sections...');
          await new Promise(resolve => requestAnimationFrame(resolve));
        }

        window.CallGraph.start('normalizeSections', parsedData);
        this.parsedData = parsedData;

        // For HPI-only input, wrap in sections structure for normalization
        let dataToNormalize = parsedData;
        if (isHPIOnly && !parsedData.sections) {
          // HPI-only data is already flat, just pass it through
          debugLog('Processing HPI-only data (already flat)');
        }

        const { normalized, unmapped } = this.normalizeSections(dataToNormalize);
        window.CallGraph.end({ normalized, unmapped });
        // DISABLED: trace can freeze on large objects
        // window.trace('STAGE 4: Normalized sections', normalized);
        debugLog('🔍 Normalization complete');

        // Ensure core sections exist; if not, regenerate from HPI as a fallback
        const coreSections = ['HPI', 'ASSESSMENT', 'PLAN'];
        const corePresent = coreSections.filter(k => normalized[k] && String(normalized[k]).trim().length > 0);
        if (corePresent.length < 2) {
          debugWarn('⚠️ Normalized output incomplete; regenerating full note from HPI...');
          const regenerated = this.generateFullNoteFromHPI(text);
          const { normalized: regenNormalized, unmapped: regenUnmapped } = this.normalizeSections(regenerated);
          this.normalizedSections = regenNormalized;
          this.unmappedContent = regenUnmapped;
        } else {
          this.normalizedSections = normalized;
          this.unmappedContent = unmapped;
        }

        // STAGE 4.5: Paraphrase HPI if present (fail-soft to original)
        if (this.normalizedSections.HPI && this.normalizedSections.HPI.length > 50) {
          debugLog('🤖 Paraphrasing HPI...');
          this.showSuccess('Paraphrasing HPI...');
          try {
            const paraphrased = await this.paraphraseHPI(this.normalizedSections.HPI);
            if (paraphrased && paraphrased.length > 20) {
              this.normalizedSections.HPI = paraphrased;
              debugLog('✅ HPI paraphrased successfully');
            }
          } catch (error) {
            debugWarn('⚠️  HPI paraphrase failed, using original:', error);
          }
        }

        // STAGE 5: Validate normalized sections
        window.validateSchema('normalizeSections', normalized, [], { allowEmpty: true });

        // STAGE 6: Update UI / Render template
        debugLog('Updating UI...');
        window.CallGraph.start('updateUI', normalized);
        this.updateUI();
        window.CallGraph.end();
        this.saveSettings();

        debugLog('✅ Note processed successfully');
        debugLog('Parsed data:', parsedData);
        debugLog('Normalized sections:', normalized);
        this.showSuccess('Note processed successfully!');

          // Yield before guidelines generation
          await new Promise(resolve => requestAnimationFrame(resolve));

          // STAGE 7: Generate Guidelines & Teaching content
          this.showSuccess('Generating guidelines...');
          await this.populateGuidelinesAndTeaching(this.normalizedSections || normalized);

          // Print call graph
          window.CallGraph.print();

          // Re-enable button
          if (parseBtn) {
            parseBtn.disabled = false;
            parseBtn.innerHTML = originalBtnText;
          }

          // Auto-scroll to the rendered output
          // Increased delay for large notes to ensure rendering is complete
          const scrollDelay = text.length > 15000 ? 500 : 300;
          setTimeout(() => {
            const outputPanel = document.getElementById('template-renderer-panel');
            const outputTextarea = document.getElementById('rendered-output');

            if (outputPanel) {
              // Scroll the panel into view
              outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
              debugLog('📜 Auto-scrolled to output panel');

              // Also focus the output textarea for immediate access
              if (outputTextarea && outputTextarea.value.trim()) {
                setTimeout(() => {
                  outputTextarea.focus();
                  // Scroll to top of textarea content
                  outputTextarea.scrollTop = 0;
                  debugLog('✅ Focused output textarea');
                }, 100);
              }
            } else {
              debugWarn('⚠️ Output panel not found for auto-scroll');
            }
          }, scrollDelay);

          window.CallGraph.end('processNote complete');
          resolve();

        } catch (error) {
          debugError('❌ Error processing note:', error);
          window.CallGraph.error(error);
          window.CallGraph.print();
          this.showError('Error processing note: ' + error.message);

          // Re-enable button on error
          if (parseBtn) {
            parseBtn.disabled = false;
            parseBtn.innerHTML = originalBtnText;
          }
          resolve();
        }
      }, 50);
    });
  }
  

  // Extract structured information from HPI text (duplicate - override for extended functionality)
  // eslint-disable-next-line no-dupe-class-members
  extractHPIInfo(hpiText, parsedData) {
    const info = {
      age: null,
      gender: null,
      provider: null,
      medicalHistory: [],
      presentationDate: null,
      presentationLocation: null,
      transportMethod: null,
      chiefComplaint: null,
      symptomDetails: null,
      diagnosticFindings: [],
      consultReason: null,
      hospitalCourse: null
    };

    // Extract age
    const ageMatch = hpiText.match(/(\d{1,3})[-\s]*year[-\s]*old/i);
    if (ageMatch) info.age = ageMatch[1];

    // Extract gender
    if (/\bfemale\b|\bwoman\b/i.test(hpiText)) {
      info.gender = 'female';
    } else if (/\bmale\b|\bman\b/i.test(hpiText)) {
      info.gender = 'male';
    }

    // Extract provider (skip if "unknown to" or facility names)
    const providerMatch = hpiText.match(/known to\s+(?:Dr\.\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (providerMatch && !/unknown to/i.test(hpiText)) {
      const provider = providerMatch[1].trim();
      // Skip if it's a facility name (contains "cardiology", all caps acronym, etc.)
      if (!/cardiology|^[A-Z]{2,}$|hospital|clinic/i.test(provider)) {
        info.provider = provider.startsWith('Dr.') ? provider : 'Dr. ' + provider;
      }
    }

    // Extract medical history conditions from PMH or HPI
    const fullTextMatch = parsedData.fullText || hpiText;
    const historyPatterns = [
      /PMH:\s*([^\n]+(?:\n(?!PSH)[^\n]+)*)/i,
      /Past Medical History:\s*([^\n]+(?:\n(?!Past Surgical)[^\n]+)*)/i,
      /history of ([^.]+?)(?:\.|She presented|He presented|The patient presented)/i
    ];
    for (const pattern of historyPatterns) {
      const match = fullTextMatch.match(pattern);
      if (match) {
        const conditions = match[1].split(/,|\band\b/).map(c => c.trim()).filter(c => c.length > 2 && c.length < 50);
        info.medicalHistory = conditions.slice(0, 5); // Limit to top 5
        break;
      }
    }

    // Extract presentation date
    const dateMatch = hpiText.match(/(?:presented|started)[^.]*?(?:on|at)\s+(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);
    if (dateMatch) info.presentationDate = dateMatch[1];

    // Extract presentation location
    const locationMatch = hpiText.match(/presented to (?:the\s+)?(\w+)/i);
    if (locationMatch) {
      const loc = locationMatch[1].toLowerCase();
      if (loc === 'er' || loc === 'ed') {
        info.presentationLocation = 'emergency department';
      } else {
        info.presentationLocation = locationMatch[1];
      }
    }

    // Extract transport method
    const transportMatch = hpiText.match(/via\s+(EMS|ambulance|private vehicle)/i);
    if (transportMatch) info.transportMethod = transportMatch[1];

    // Extract chief complaint/symptoms
    const complaintPatterns = [
      /presents?.*?with\s+reports?\s+of\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|\.)/i,
      /presents?.*?with\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /complain(?:s|ing)\s+of\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /stated\s+(?:she|he)\s+had\s+(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|EKG|ECG|\.)/i,
      /chief complaint.*?:\s*(.+?)(?:\.?\s*ED workup|\.?\s*Initial workup|\.)/i
    ];
    for (const pattern of complaintPatterns) {
      const match = hpiText.match(pattern);
      if (match && match[1].length < 150) {
        info.chiefComplaint = match[1].trim().replace(/\.?\s*ED workup.*$/i, '');
        break;
      }
    }

    // Extract diagnostic findings from ED workup
    const workupMatch = hpiText.match(/\.?\s*(?:ED workup|Initial workup)\s+revealed\s+(.+?)(?:\s*\.?\s*CIS\b|\s*cardiology\b|\. CIS|$)/i);
    if (workupMatch) {
      const findings = workupMatch[1].split(/,\s*(?![^()]*\))/).map(f => f.trim()).filter(f => f.length > 3);
      info.diagnosticFindings.push(...findings);
    }

    // Extract diagnostic findings (EKG, labs, imaging)
    if (/EKG|ECG/i.test(hpiText)) {
      const ekgMatch = hpiText.match(/(?:EKG|ECG)\s+(?:revealed|showed)\s+([^.]+)/i);
      if (ekgMatch) {
        info.diagnosticFindings.push('EKG showing ' + ekgMatch[1].trim());
      }
    }

    // Extract troponin if mentioned
    if (/troponin/i.test(hpiText)) {
      const tropMatch = hpiText.match(/(elevated|positive|negative)\s+troponin/i);
      if (tropMatch) {
        info.diagnosticFindings.push(tropMatch[1] + ' troponin');
      }
    }

    // Extract reason for consult
    const consultMatch = hpiText.match(/(?:CIS|cardiology)[^.]*?consulted to (?:evaluate|assess)\s+([^.]+)/i) ||
                         hpiText.match(/consultation\s+(?:has been\s+)?requested for ([^.]+)/i) ||
                         hpiText.match(/Reason for Consult:\s*([^\n]+)/i) ||
                         hpiText.match(/Chief Complaint.*?:\s*([^\n]+)/i);
    if (consultMatch) {
      info.consultReason = consultMatch[1].trim();
    } else if (info.diagnosticFindings.length > 0) {
      info.consultReason = 'further evaluation and management';
    }

    // Extract hospital course if present
    const courseMatch = hpiText.match(/Hospital Course:([\s\S]+?)(?=\n\n|$)/i);
    if (courseMatch) {
      info.hospitalCourse = courseMatch[1].trim();
    }

    return info;
  }

  // Detect if input is just an HPI
  detectHPIOnlyInput(text) {
    const lowerText = text.toLowerCase().trim();

    // Heuristics to determine if this is HPI-only:
    // 1. No clear section headers for other sections
    // 2. Contains HPI-related keywords
    // 3. Doesn't contain multiple section headers

    const otherSectionKeywords = [
      'past medical history', 'pmh:', 'medications:', 'allergies:', 'family history',
      'social history', 'physical exam', 'assessment:', 'plan:', 'vitals:', 'labs:',
      'review of systems', 'ros:', 'past surgical history', 'psh:'
    ];

    const hpiKeywords = [
      'patient', 'presented', 'complaining', 'symptoms', 'onset', 'duration',
      'chest pain', 'shortness of breath', 'palpitations', 'started', 'began',
      'emergency room', 'emergency department', 'er', 'ed', 'admitted'
    ];

    // Count section headers
    let otherSectionCount = 0;
    otherSectionKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) otherSectionCount++;
    });

    // Count HPI keywords
    let hpiKeywordCount = 0;
    hpiKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) hpiKeywordCount++;
    });

    // Decision logic:
    // - If it has 2+ other section headers, it's probably a full note
    // - If it has 3+ HPI keywords and 0-1 other sections, probably HPI-only
    // - If it's < 100 words and has HPI keywords, probably HPI-only
    const wordCount = text.split(/\s+/).length;

    // Additional heuristic: treat short, single-paragraph inputs with no other section headers as HPI-only
    const noSectionShortParagraph = otherSectionCount === 0 && wordCount >= 12 && wordCount <= 400;

    // NEW: If it starts with HPI: but has multiple other sections (like a full note), treat as full note
    const startsWithHPI = lowerText.startsWith('hpi:') || lowerText.startsWith('history of present illness');
    const hasMultipleSections = otherSectionCount >= 3; // Changed from 2 to be more conservative

    const isHPIOnly = (
      (otherSectionCount <= 1 && hpiKeywordCount >= 2) ||
      (wordCount < 120 && hpiKeywordCount >= 1 && otherSectionCount === 0) ||
      (startsWithHPI && !hasMultipleSections) || // Only HPI-only if starts with HPI AND doesn't have multiple sections
      noSectionShortParagraph
    );

    debugLog('HPI Detection:', {
      wordCount,
      otherSectionCount,
      hpiKeywordCount,
      startsWithHPI,
      hasMultipleSections,
      isHPIOnly
    });

    return isHPIOnly;
  }

  // Generate a full note structure from just an HPI
  generateFullNoteFromHPI(hpiText) {
    // Clean up the HPI text
    let cleanHPI = hpiText.trim();

    // Remove HPI header if present
    cleanHPI = cleanHPI.replace(/^(hpi:|history of present illness:?)/i, '').trim();

    // Generate a comprehensive note structure
    const fullNoteData = {
      'HPI': cleanHPI,
      'CC': this.extractChiefComplaintFromHPI(cleanHPI),
      'PMH': this.extractPMHFromHPI(cleanHPI) || 'N/A - Past medical history to be obtained and documented.',
      'PSH': 'N/A - Past surgical history to be obtained and documented.',
      'FH': 'N/A - Family history to be obtained and documented.',
      'SH': this.extractSocialHistoryFromHPI(cleanHPI) || 'N/A - Social history including tobacco, alcohol, and substance use to be obtained and documented.',
      'MEDS': 'N/A - Current medications and dosages to be reconciled and documented.',
      'ALLERGIES': 'N/A - Drug allergies and reactions to be verified and documented.',
      'ROS': this.generateROSFromHPI(cleanHPI),
      'VITALS': this.extractVitalsFromHPI(cleanHPI, this.parsedData?.vitals) || 'N/A - Vital signs to be documented at time of examination.',
      'LABS': this.extractLabsFromHPI(cleanHPI) || 'N/A - Laboratory results pending or to be obtained as clinically indicated.',
      'DIAGNOSTICS': this.extractDiagnosticsFromHPI(cleanHPI),
      'ASSESSMENT': this.generateAssessmentFromHPI(cleanHPI),
      'PLAN': this.generatePlanFromHPI(cleanHPI)
    };

    debugLog('Generated full note from HPI:', fullNoteData);
    return fullNoteData;
  }
 
 

  // Extract chief complaint from HPI
  extractChiefComplaintFromHPI(hpi) {
    // eslint-disable-next-line no-unused-vars
    const lowerHPI = hpi.toLowerCase();

    // Common presenting complaints
    const complaints = {
      'chest pain': /chest pain|cp|chest discomfort|chest pressure/i,
      'shortness of breath': /shortness of breath|sob|dyspnea|breathing difficulty/i,
      'palpitations': /palpitations|heart racing|irregular heartbeat|heart skipping/i,
      'syncope': /syncope|fainting|passed out|lost consciousness/i,
      'dizziness': /dizziness|lightheaded|dizzy spells/i,
      'fatigue': /fatigue|tired|exhaustion|weakness/i,
      'swelling': /swelling|edema|leg swelling|ankle swelling/i
    };

    const foundComplaints = [];
    Object.entries(complaints).forEach(([complaint, regex]) => {
      if (regex.test(hpi)) {
        foundComplaints.push(complaint);
      }
    });

    if (foundComplaints.length > 0) {
      return foundComplaints.join(', ');
    }

    // Fallback - try to extract from first sentence
    const sentences = hpi.split('.')[0];
    if (sentences.length > 10) {
      return sentences.substring(0, 100) + '...';
    }

    return 'Chief complaint to be clarified and documented.';
  }

  // Generate ROS based on HPI content
  generateROSFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const rosItems = [];

    // Cardiovascular
    if (lowerHPI.includes('chest pain') || lowerHPI.includes('palpitations') || lowerHPI.includes('syncope')) {
      rosItems.push('Cardiovascular: As per HPI. Additional symptoms to be reviewed.');
    }

    // Respiratory
    if (lowerHPI.includes('shortness of breath') || lowerHPI.includes('dyspnea') || lowerHPI.includes('cough')) {
      rosItems.push('Respiratory: As per HPI. Additional pulmonary symptoms to be reviewed.');
    }

    // Constitutional
    if (lowerHPI.includes('fatigue') || lowerHPI.includes('weakness') || lowerHPI.includes('fever')) {
      rosItems.push('Constitutional: As per HPI. Additional constitutional symptoms to be reviewed.');
    }

    if (rosItems.length === 0) {
      rosItems.push('Pertinent systems reviewed as per HPI. Complete review of systems to be obtained.');
    }

    return rosItems.join(' ');
  }

  // Suggest diagnostics based on HPI
  suggestDiagnosticsFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const diagnostics = [];

    // Chest pain workup
    if (lowerHPI.includes('chest pain') || lowerHPI.includes('cp')) {
      diagnostics.push('ECG', 'Chest X-ray', 'Cardiac enzymes/Troponin');
    }

    // SOB workup
    if (lowerHPI.includes('shortness of breath') || lowerHPI.includes('dyspnea')) {
      diagnostics.push('Chest X-ray', 'BNP/NT-proBNP', 'Echocardiogram');
    }

    // Palpitations
    if (lowerHPI.includes('palpitations') || lowerHPI.includes('irregular')) {
      diagnostics.push('ECG', 'Holter monitor', 'Event monitor');
    }

    // Syncope
    if (lowerHPI.includes('syncope') || lowerHPI.includes('fainting')) {
      diagnostics.push('ECG', 'Echocardiogram', 'Orthostatic vitals');
    }

    // Basic labs always appropriate
    diagnostics.push('Basic metabolic panel', 'CBC');

    if (diagnostics.length === 0) {
      return 'Diagnostic studies to be obtained as clinically indicated based on presentation and physical examination.';
    }

    return 'Recommended studies: ' + diagnostics.join(', ') + '. Additional testing as clinically indicated.';
  }

  // Generate initial assessment from HPI
  generateAssessmentFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const assessments = [];

    // Extract explicitly mentioned diagnoses and acronyms
    const diagnosisPatterns = [
      { pattern: /afib|atrial fibrillation/i, name: 'Atrial fibrillation' },
      { pattern: /aflutter|atrial flutter/i, name: 'Atrial flutter' },
      { pattern: /rvr|rapid ventricular response/i, name: 'with rapid ventricular response' },
      { pattern: /chf|congestive heart failure|heart failure/i, name: 'Heart failure' },
      { pattern: /hfref|heart failure with reduced ef/i, name: 'Heart failure with reduced ejection fraction (HFrEF)' },
      { pattern: /hfpef|heart failure with preserved ef/i, name: 'Heart failure with preserved ejection fraction (HFpEF)' },
      { pattern: /nstemi|non-st elevation mi/i, name: 'Non-ST elevation myocardial infarction (NSTEMI)' },
      { pattern: /stemi|st elevation mi/i, name: 'ST elevation myocardial infarction (STEMI)' },
      { pattern: /acs|acute coronary syndrome/i, name: 'Acute coronary syndrome' },
      { pattern: /cad|coronary artery disease/i, name: 'Coronary artery disease' },
      { pattern: /htn|hypertension/i, name: 'Hypertension' },
      { pattern: /valvular\s+disease/i, name: 'Valvular heart disease' },
      { pattern: /\baortic\s+stenosis\b/i, name: 'Aortic stenosis' },
      { pattern: /\baortic\s+regurgitation\b/i, name: 'Aortic regurgitation' },
      { pattern: /\bmitral\s+stenosis\b/i, name: 'Mitral stenosis' },
      { pattern: /\bmitral\s+regurgitation\b/i, name: 'Mitral regurgitation' },
      { pattern: /\bpulmonary embolism\b/i, name: 'Pulmonary embolism' },
      { pattern: /dvt|deep vein thrombosis/i, name: 'Deep vein thrombosis' },
      { pattern: /pad|peripheral artery disease/i, name: 'Peripheral arterial disease' },
      { pattern: /cardiomyopathy/i, name: 'Cardiomyopathy' },
      { pattern: /pericarditis/i, name: 'Pericarditis' },
      { pattern: /tamponade/i, name: 'Cardiac tamponade' },
      { pattern: /bradycardia/i, name: 'Bradycardia' },
      { pattern: /tachycardia/i, name: 'Tachycardia' },
      { pattern: /svt|supraventricular tachycardia/i, name: 'Supraventricular tachycardia' },
      { pattern: /vt|ventricular tachycardia/i, name: 'Ventricular tachycardia' }
    ];

    // Check for explicitly mentioned diagnoses
    const foundDiagnoses = [];
    diagnosisPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(hpi)) {
        // Avoid duplicates
        if (!foundDiagnoses.includes(name) && !name.includes('with ')) {
          foundDiagnoses.push(name);
        } else if (name.includes('with ')) {
          // For modifiers like "with RVR", append to last diagnosis
          if (foundDiagnoses.length > 0) {
            foundDiagnoses[foundDiagnoses.length - 1] += ' ' + name;
          }
        }
      }
    });

    // Add found diagnoses as numbered list
    foundDiagnoses.forEach((diagnosis, index) => {
      assessments.push(`${index + 1}. ${diagnosis}`);
    });

    // Add symptom-based assessments if no specific diagnoses found
    if (foundDiagnoses.length === 0) {
      // Common cardiology presentations
      if (lowerHPI.includes('chest pain')) {
        assessments.push('1. Chest pain - rule out acute coronary syndrome, consider non-cardiac etiologies');
      }

      if (lowerHPI.includes('shortness of breath') || lowerHPI.includes('dyspnea')) {
        assessments.push(`${assessments.length + 1}. Dyspnea - consider heart failure, pulmonary pathology, or other cardiac causes`);
      }

      if (lowerHPI.includes('palpitations')) {
        assessments.push(`${assessments.length + 1}. Palpitations - rule out arrhythmia, consider structural heart disease`);
      }

      if (lowerHPI.includes('syncope')) {
        assessments.push(`${assessments.length + 1}. Syncope - rule out cardiac causes, consider orthostatic hypotension`);
      }
    }

    if (assessments.length === 0) {
      assessments.push('1. Clinical presentation requiring cardiology evaluation - differential diagnosis to be refined based on examination and diagnostic studies');
    }

    return assessments.join('\n');
  }

  // Generate management plan from HPI
  generatePlanFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const planItems = [];

    // Always include basics
    planItems.push('Complete history and physical examination');

    // Chest pain
    if (lowerHPI.includes('chest pain')) {
      planItems.push('Serial ECGs and cardiac enzymes');
      planItems.push('Chest X-ray');
      planItems.push('Risk stratification for acute coronary syndrome');
    }

    // SOB
    if (lowerHPI.includes('shortness of breath')) {
      planItems.push('Chest X-ray and BNP');
      planItems.push('Echocardiogram if indicated');
      planItems.push('Evaluate for heart failure vs pulmonary etiology');
    }

    // Palpitations
    if (lowerHPI.includes('palpitations')) {
      planItems.push('12-lead ECG');
      planItems.push('Consider ambulatory cardiac monitoring');
      planItems.push('Evaluate for structural heart disease');
    }

    // General items
    planItems.push('Medication reconciliation');
    planItems.push('Patient education and counseling');
    planItems.push('Follow-up as clinically appropriate');

    return planItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }

  // Extract past medical history if mentioned in HPI
  extractPMHFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const conditions = [];

    // Common cardiovascular conditions
    if (lowerHPI.includes('hypertension') || lowerHPI.includes('htn') || lowerHPI.includes('high blood pressure')) {
      conditions.push('Hypertension');
    }
    if (lowerHPI.includes('diabetes') || lowerHPI.includes('dm') || lowerHPI.includes('diabetic')) {
      conditions.push('Diabetes mellitus');
    }
    if (lowerHPI.includes('high cholesterol') || lowerHPI.includes('hyperlipidemia') || lowerHPI.includes('dyslipidemia')) {
      conditions.push('Hyperlipidemia');
    }
    if (lowerHPI.includes('cad') || lowerHPI.includes('coronary artery disease') || lowerHPI.includes('heart disease')) {
      conditions.push('Coronary artery disease');
    }
    if (lowerHPI.includes('heart failure') || lowerHPI.includes('hf') || lowerHPI.includes('chf')) {
      conditions.push('Heart failure');
    }
    if (lowerHPI.includes('afib') || lowerHPI.includes('atrial fibrillation') || lowerHPI.includes('a-fib')) {
      conditions.push('Atrial fibrillation');
    }

    return conditions.length > 0 ? conditions.join(', ') : null;
  }

  // Extract social history if mentioned in HPI
  extractSocialHistoryFromHPI(hpi) {
    const lowerHPI = hpi.toLowerCase();
    const socialHistory = [];

    // Smoking history
    if (lowerHPI.includes('quit smoking') || lowerHPI.includes('former smoker') || lowerHPI.includes('ex-smoker')) {
      const match = hpi.match(/quit smoking (\d+) years? ago/i) || hpi.match(/former smoker[^.]*(\d+) years?/i);
      if (match) {
        socialHistory.push(`Former smoker, quit ${match[1]} years ago`);
      } else {
        socialHistory.push('Former smoker');
      }
    } else if (lowerHPI.includes('current smoker') || lowerHPI.includes('smokes') || lowerHPI.includes('smoking')) {
      socialHistory.push('Current smoker');
    } else if (lowerHPI.includes('never smoked') || lowerHPI.includes('non-smoker')) {
      socialHistory.push('Never smoker');
    }

    // Alcohol use
    if (lowerHPI.includes('alcohol') || lowerHPI.includes('drinking') || lowerHPI.includes('etoh')) {
      socialHistory.push('Alcohol use per patient report');
    }

    // Occupation
    const occupationMatch = hpi.match(/(teacher|nurse|doctor|engineer|retired [^,\s]+)/i);
    if (occupationMatch) {
      socialHistory.push(`Occupation: ${occupationMatch[1]}`);
    }

    return socialHistory.length > 0 ? socialHistory.join('. ') : null;
  }

  // Extract lab values if mentioned in HPI
  extractLabsFromHPI(hpi) {
    const labs = [];

    // Hemoglobin/Hematocrit - pattern like "H/H 9.2/30.5"
    const hhMatch = hpi.match(/(?:h\/h|hgb\/hct|hemoglobin\/hematocrit)[:\s]+(\d+\.?\d*)\/(\d+\.?\d*)/i);
    if (hhMatch) {
      labs.push(`Hemoglobin: ${hhMatch[1]} g/dL`);
      labs.push(`Hematocrit: ${hhMatch[2]}%`);
    }

    // BUN
    const bunMatch = hpi.match(/(?:bun)[:\s]+(\d+\.?\d*)/i);
    if (bunMatch) {
      labs.push(`BUN: ${bunMatch[1]} mg/dL`);
    }

    // Creatinine
    const crMatch = hpi.match(/(?:creatinine|cr)[:\s]+(\d+\.?\d*)/i);
    if (crMatch) {
      labs.push(`Creatinine: ${crMatch[1]} mg/dL`);
    }

    // Troponin - handles ranges like "4-21" or "HS trop: 4-21"
    const tropMatch = hpi.match(/(?:troponin|trop|hs\s*trop)[:\s]+(\d+\.?\d*(?:-\d+\.?\d*)?)/i);
    if (tropMatch) {
      labs.push(`Troponin: ${tropMatch[1]} ng/mL`);
    }

    // BNP / NT-proBNP
    const bnpMatch = hpi.match(/(?:bnp|nt-probnp)[:\s]+(\d+\.?\d*)/i);
    if (bnpMatch) {
      labs.push(`BNP: ${bnpMatch[1]} pg/mL`);
    }

    // Potassium
    const kMatch = hpi.match(/(?:potassium|k\+?)[:\s]+(\d+\.?\d*)/i);
    if (kMatch) {
      labs.push(`Potassium: ${kMatch[1]} mEq/L`);
    }

    // Sodium
    const naMatch = hpi.match(/(?:sodium|na\+?)[:\s]+(\d+\.?\d*)/i);
    if (naMatch) {
      labs.push(`Sodium: ${naMatch[1]} mEq/L`);
    }

    // Glucose - handles "CBG 198", "glucose 198", "blood sugar 198"
    const glucMatch = hpi.match(/(?:glucose|blood sugar|cbg)[:\s]+(\d+\.?\d*)/i);
    if (glucMatch) {
      const label = /cbg/i.test(glucMatch[0]) ? 'CBG (capillary)' : 'Glucose';
      labs.push(`${label}: ${glucMatch[1]} mg/dL`);
    }

    // WBC
    const wbcMatch = hpi.match(/(?:wbc|white blood cell)[:\s]+(\d+\.?\d*)/i);
    if (wbcMatch) {
      labs.push(`WBC: ${wbcMatch[1]} K/uL`);
    }

    return labs.length > 0 ? labs.join('\n') : null;
  }

  // Extract diagnostic studies mentioned in HPI
  extractDiagnosticsFromHPI(hpi) {
    const diagnostics = [];

    // Extract explicitly mentioned studies
    const studyPatterns = [
      { pattern: /chest x[-\s]?ray|cxr/i, name: 'Chest X-ray' },
      { pattern: /ecg|ekg|electrocardiogram/i, name: 'ECG' },
      { pattern: /echo(?:cardiogram)?/i, name: 'Echocardiogram' },
      { pattern: /ct\s+(?:scan|chest|head)/i, name: 'CT scan' },
      { pattern: /mri/i, name: 'MRI' },
      { pattern: /stress\s+test/i, name: 'Stress test' },
      { pattern: /cardiac\s+cath(?:eterization)?/i, name: 'Cardiac catheterization' },
      { pattern: /holter\s+monitor/i, name: 'Holter monitor' },
      { pattern: /event\s+monitor/i, name: 'Event monitor' }
    ];

    // Check for explicitly mentioned studies
    studyPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(hpi)) {
        diagnostics.push(`${name} - as documented`);
      }
    });

    // Extract findings from mentioned studies
    if (/(?:ekg|ecg|electrocardiogram).*?revealed/i.test(hpi)) {
      const ekgFindings = hpi.match(/(?:ekg|ecg).*?revealed\s+([^.]+)/i);
      if (ekgFindings) {
        diagnostics.push(`ECG findings: ${ekgFindings[1].trim()}`);
      }
    }

    if (/(?:chest x-ray|cxr).*?(?:revealed|showed|demonstrated)/i.test(hpi)) {
      const cxrFindings = hpi.match(/(?:chest x-ray|cxr).*?(?:revealed|showed|demonstrated)\s+([^.]+)/i);
      if (cxrFindings) {
        diagnostics.push(`Chest X-ray findings: ${cxrFindings[1].trim()}`);
      }
    }

    // If no specific studies found, suggest based on presentation
    if (diagnostics.length === 0) {
      const suggested = this.suggestDiagnosticsFromHPI(hpi);
      return suggested;
    }

    // Add suggested studies to already found ones
    const additionalSuggestions = this.suggestDiagnosticsFromHPI(hpi);
    return diagnostics.join('\n') + '\n\nAdditional recommended studies:\n' + additionalSuggestions;
  }

  // Extract vital signs if mentioned in HPI
  extractVitalsFromHPI(hpi, parsedVitals = null) {
    const vitalSigns = [];

    // PRIORITY 1: Use already-parsed vitals from parsedData if available
    if (parsedVitals && typeof parsedVitals === 'object' && Object.keys(parsedVitals).length > 0) {
      if (parsedVitals.bp) vitalSigns.push(`BP: ${parsedVitals.bp} mmHg`);
      if (parsedVitals.hr) vitalSigns.push(`HR: ${parsedVitals.hr} bpm`);
      if (parsedVitals.rr) vitalSigns.push(`RR: ${parsedVitals.rr}/min`);
      if (parsedVitals.temp) vitalSigns.push(`Temp: ${parsedVitals.temp}°F`);
      if (parsedVitals.spo2) vitalSigns.push(`SpO2: ${parsedVitals.spo2}%`);
      
      if (vitalSigns.length > 0) {
        return vitalSigns.join('\n');
      }
    }

    // PRIORITY 2: Extract from HPI text if no parsed vitals available
    // Blood pressure - multiple patterns, handles multiple BP readings
    // Note: bpPattern already has 'gi' flags, so it's safe for matchAll
    const bpMatches = [];
    const bpPattern = /(?:blood pressure|bp|BP)[:\s]+(?:is\s+)?(\d{2,3}\/\d{2,3})|(?:^|[,\s])(\d{2,3}\/\d{2,3})(?:\s*mmhg)?(?:[,\s]|$)/gi;
    for (const bpMatch of hpi.matchAll(bpPattern)) {
      const value = bpMatch[1] || bpMatch[2];
      if (value && !bpMatches.includes(value)) {
        bpMatches.push(value);
      }
    }

    if (bpMatches.length > 0) {
      if (bpMatches.length === 1) {
        vitalSigns.push(`BP: ${bpMatches[0]} mmHg`);
      } else {
        // Multiple readings - label them
        vitalSigns.push(`BP: ${bpMatches[0]} mmHg (initial), ${bpMatches[1]} mmHg (after fluids)`);
      }
    }

    // Heart rate - various formats including "HR 120", "HR greater than 120", "AFIB RVR HR 120"
    const hrMatch = hpi.match(/(?:heart rate|hr)[:\s]+(?:greater than|>)\s*(\d{2,3})/i) ||
                   hpi.match(/(?:heart rate|hr)[:\s]+(?:is\s+)?(\d{2,3})/i) ||
                   hpi.match(/(\d{2,3})\s*bpm/i) ||
                   hpi.match(/(?:hr|heart rate)\s+(\d{2,3})/i);
    if (hrMatch) {
      const hrValue = hrMatch[1];
      const isGreaterThan = /greater than|>/i.test(hrMatch[0]);
      vitalSigns.push(isGreaterThan ? `HR: >${hrValue} bpm` : `HR: ${hrValue} bpm`);
    }

    // Respiratory rate
    const rrMatch = hpi.match(/(?:respiratory rate|rr)[:\s]+(?:is\s+)?(\d{1,2})/i);
    if (rrMatch) {
      vitalSigns.push(`RR: ${rrMatch[1]}/min`);
    }

    // Oxygen saturation - handles "94% on 3L NC" or "SpO2: 94%"
    const o2Match = hpi.match(/(?:oxygen saturation|o2 sat|spo2)[:\s]+(?:is\s+)?(\d{2,3})%/i) ||
                   hpi.match(/(\d{2,3})%\s+on\s+(?:room\s+)?air/i) ||
                   hpi.match(/(\d{2,3})%\s+on\s+(\d+)\s*(?:l|liter|liters?)\s+(?:nc|nasal cannula)/i);
    if (o2Match) {
      if (o2Match[2]) {
        // Has oxygen flow rate
        vitalSigns.push(`SpO2: ${o2Match[1]}% on ${o2Match[2]}L NC`);
      } else if (hpi.match(/room\s+air|ra\b/i)) {
        vitalSigns.push(`SpO2: ${o2Match[1]}% on room air`);
      } else {
        vitalSigns.push(`SpO2: ${o2Match[1]}%`);
      }
    }

    // Temperature
    const tempMatch = hpi.match(/(?:temperature|temp)[:\s]+(?:is\s+)?(\d{2,3}(?:\.\d)?)\s*[°f]/i);
    if (tempMatch) {
      vitalSigns.push(`Temp: ${tempMatch[1]}°F`);
    }

    // GCS (Glasgow Coma Scale)
    const gcsMatch = hpi.match(/(?:gcs|glasgow coma scale)[:\s]+(?:is\s+)?(\d{1,2})/i);
    if (gcsMatch) {
      vitalSigns.push(`GCS: ${gcsMatch[1]}`);
    }

    return vitalSigns.length > 0 ? vitalSigns.join('\n') : null;
  }

  // Create UI elements
  createUI() {
    // Check if template-renderer-panel exists (already in HTML)
    const existingPanel = document.getElementById('template-renderer-panel');
    if (existingPanel) {
      // Panel already exists in HTML, just return - bindEvents() will handle the functionality
      return;
    }

    // Fallback: create new panel if existing one not found
    const panel = document.createElement('div');
    panel.id = 'template-renderer-panel';
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-h">
        <h3>📝 Template Renderer</h3>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 0.9rem;">
            Template:
            <select id="template-select" style="margin-left: 5px;" disabled>
              <option value="progress" selected>Progress Note (locked)</option>
            </select>
          </label>
          <label style="font-size: 0.9rem;">
            <input type="checkbox" id="smartphrase-toggle"> SmartPhrase
          </label>
        </div>
      </div>

      <div id="template-content" style="margin-bottom: 15px;">
        <textarea id="rendered-output" readonly
                  style="width: 100%; height: 400px; font-family: monospace; font-size: 0.9rem;
                         border: 1px solid var(--border-color); border-radius: 4px;
                         padding: 10px; background: var(--bg-secondary); color: var(--text-primary);
                         resize: vertical;"
                  placeholder="Processed note will appear here..."></textarea>
      </div>

      <div class="button-row" style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button id="copy-output-btn" class="btn primary">
          📋 Copy (Ctrl+C)
        </button>
        <button id="download-output-btn" class="btn">
          💾 Download
        </button>
        <button id="clear-output-btn" class="btn ghost">
          🗑️ Clear
        </button>
      </div>

      <div id="renderer-status" style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);"></div>
      <details id="structured-json" style="margin-top: 8px;">
        <summary>Structured vitals/labs JSON</summary>
        <pre id="structured-json-out" style="white-space: pre-wrap; font-size: 0.8rem; background: var(--bg-secondary); padding: 6px; border-radius: 4px; border: 1px solid var(--border-color);"></pre>
      </details>
      <details id="rag-diagnostics" style="margin-top: 8px;">
        <summary>RAG Diagnostics (Evidence Retrieval)</summary>
        <div id="rag-diagnostics-content" style="font-size: 0.85rem; background: var(--bg-secondary); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-secondary);">
          <div id="rag-config-info" style="margin-bottom: 6px;"></div>
          <div id="rag-evidence-info"></div>
        </div>
      </details>
    `;

    // Insert before guidelines section to keep guidelines at the bottom
    const mainElement = document.getElementById('canvas');
    const guidelinesSection = document.getElementById('guidelines-teaching');
    if (guidelinesSection) {
      mainElement.insertBefore(panel, guidelinesSection);
    } else {
      mainElement.appendChild(panel);
    }
  }

  // Bind event handlers
  bindEvents() {
    // Template selection
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        this.currentTemplate = e.target.value;
        this.updateUI();
        this.saveSettings();
      });
    }

    // SmartPhrase toggle
    const smartphraseToggle = document.getElementById('smartphrase-toggle');
    if (smartphraseToggle) {
      smartphraseToggle.addEventListener('change', (e) => {
        this.useSmartPhrase = e.target.checked;
        this.updateUI();
        this.saveSettings();
      });
    }


    // Copy button
    const copyBtn = document.getElementById('copy-output-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Download button
    const downloadBtn = document.getElementById('download-output-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadOutput());
    }

    // Clear button
    const clearBtn = document.getElementById('clear-output-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearOutput());
    }

    // Parse button - triggers processing of vs-paste textarea content
    const parseBtn = document.getElementById('vs-parse');
    debugLog('🔍 Parse button element:', parseBtn);
    if (parseBtn) {
      parseBtn.addEventListener('click', () => {
        debugLog('🖱️ Parse button clicked!');
        const text = document.getElementById('vs-paste')?.value || '';
        debugLog('📝 Text length:', text.length);
        if (text.trim()) {
          debugLog('✅ Processing note...');
          this.processNote(text);
        } else {
          debugLog('⚠️ No text to parse');
          this.showError('Please paste a clinical note to parse.');
        }
      });
      debugLog('✅ Parse button event listener attached');
    } else {
      debugError('❌ Parse button not found in bindEvents');
    }

    // Clear All button - clears the input textarea
    const vsClearBtn = document.getElementById('vs-clear');
    if (vsClearBtn) {
      vsClearBtn.addEventListener('click', () => {
        const textarea = document.getElementById('vs-paste');
        if (textarea) {
          textarea.value = '';
          debugLog('🗑️ Input textarea cleared');
          this.showSuccess('Input cleared');
        }
      });
      debugLog('✅ Clear All button event listener attached');
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter to process
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const text = document.getElementById('vs-paste')?.value || '';
        if (text.trim()) {
          this.processNote(text);
        }
      }

      // Ctrl/Cmd + C when output is focused to copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' &&
          document.activeElement?.id === 'rendered-output') {
        this.copyToClipboard();
      }
    });
  }

  // Update UI with current data
  updateUI() {
    debugLog('📝 updateUI called');
    
    // Check if we have any parsed data to display
    const ready = this.parsedData && (this.parsedData.sections || this.parsedData.vitals || this.parsedData.labs);
    if (!ready) {
      // First load: do nothing quietly (no "Skipping..." logs)
      return;
    }
    
    const output = this.renderTemplate();
    debugLog('📝 Generated output length:', output?.length);
    debugLog('📝 Output preview:', output?.substring(0, 200));

    const textArea = document.getElementById('rendered-output');
    debugLog('📝 TextArea element:', textArea);

    if (textArea) {
      textArea.value = output;
      debugLog('✅ Output written to textarea');
    } else {
      debugError('❌ rendered-output textarea not found!');
    }

    // Update template select
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
      templateSelect.value = this.currentTemplate;
    }

    // Update SmartPhrase toggle
    const smartphraseToggle = document.getElementById('smartphrase-toggle');
    if (smartphraseToggle) {
      smartphraseToggle.checked = this.useSmartPhrase;
    }

    // Populate vitals and labs from parsed data
    this.populateVitalsUI();
    this.populateLabsUI();
    this.populateRAGDiagnostics();
  }

  // Populate vitals inputs from parsed data
  populateVitalsUI() {
    // Silently skip if no data yet (first load)
    if (!this.parsedData || !this.parsedData.sections) {
      return;
    }

    // Try to extract vitals from sections
    const vitalsSection = this.normalizedSections.VITALS || this.parsedData.sections.vitals || this.parsedData.sections.VITALS;
    if (!vitalsSection) {
      return;
    }

    // Parse vitals from text using existing extraction helpers
    let vitals = {};
    if (typeof window.extractVitals === 'function') {
      vitals = window.extractVitals(vitalsSection);
    } else {
      return;
    }

  debugLog('📊 Extracted vitals:', vitals);

    // Map vitals to input fields
    if (vitals.bp) {
      const [sbp, dbp] = vitals.bp.split('/').map(v => v.trim());
      if (sbp) {
        const sbpInput = document.getElementById('vs-sbp');
        if (sbpInput) sbpInput.value = sbp;
      }
      if (dbp) {
        const dbpInput = document.getElementById('vs-dbp');
        if (dbpInput) dbpInput.value = dbp;
      }
    }
    if (vitals.hr) {
      const hrInput = document.getElementById('vs-hr');
      if (hrInput) hrInput.value = vitals.hr;
    }
    if (vitals.rr) {
      const rrInput = document.getElementById('vs-rr');
      if (rrInput) rrInput.value = vitals.rr;
    }
    if (vitals.temp) {
      const tempInput = document.getElementById('vs-temp');
      if (tempInput) tempInput.value = `${vitals.temp} F`;
    }
    if (vitals.spo2) {
      const spo2Input = document.getElementById('vs-spo2');
      if (spo2Input) spo2Input.value = vitals.spo2;
    }
    if (vitals.height) {
      const heightInput = document.getElementById('vs-height');
      if (heightInput) heightInput.value = vitals.height;
    }
    if (vitals.weight) {
      const weightInput = document.getElementById('vs-weight');
      const weightStr = typeof vitals.weight === 'object' 
        ? `${vitals.weight.value} ${vitals.weight.unit}`
        : vitals.weight;
      if (weightInput) weightInput.value = weightStr;
    }

    debugLog('✅ Vitals populated to UI inputs');
  }

  // Populate labs table from parsed data
  populateLabsUI() {
    // Silently skip if no data yet (first load)
    if (!this.parsedData || !this.parsedData.sections) {
      return;
    }

    // Try to extract labs from sections
    const labsSection = this.normalizedSections.LABS || this.parsedData.sections.labs || this.parsedData.sections.LABS;
    if (!labsSection) {
      debugLog('🔬 No LABS section text found in normalized/sections; labs UI not updated');
      return;
    }

    // Parse labs from text using existing extraction helpers
    let labs = [];
    if (typeof window.extractLabs === 'function') {
      labs = window.extractLabs(labsSection);
    } else {
      debugWarn('extractLabs helper not available');
      return;
    }

  debugLog('🔬 Extracted labs:', labs);

    // Get lab table body
    const tbody = document.getElementById('tbl-labs');
    if (!tbody) {
      debugWarn('Lab table body not found');
      return;
    }

    // Map extracted labs to table rows by alias matching
    const rows = tbody.querySelectorAll('tr[data-lab-aliases]');
    let updatedCount = 0;
    rows.forEach(row => {
      const aliases = (row.dataset.labAliases || '').toLowerCase().split('|');
      // labKey available via row.dataset.labKey if needed for future enhancements

      // Find matching lab from parsed data
      const matchedLab = labs.find(lab => {
        const labNameLower = (lab.name || '').toLowerCase();
        return aliases.some(alias => labNameLower.includes(alias) || alias.includes(labNameLower));
      });

      if (matchedLab && matchedLab.value) {
        const valueCell = row.querySelector('.lab-value');
        if (valueCell) {
          const labValue = `${matchedLab.value}${matchedLab.unit ? ' ' + matchedLab.unit : ''}`;
          valueCell.textContent = labValue;
          valueCell.classList.remove('lab-value-empty');
          updatedCount++;

          // Check if value is out of range and add styling
          if (matchedLab.flag === 'H' || matchedLab.flag === 'high') {
            valueCell.style.color = 'var(--error, red)';
            valueCell.style.fontWeight = 'bold';
          } else if (matchedLab.flag === 'L' || matchedLab.flag === 'low') {
            valueCell.style.color = 'var(--warning, orange)';
            valueCell.style.fontWeight = 'bold';
          } else {
            valueCell.style.color = '';
            valueCell.style.fontWeight = '';
          }
        }
      }
    });

    debugLog(`✅ Labs populated to table (updated ${updatedCount} row(s))`);
  }

  // Populate RAG diagnostics panel
  populateRAGDiagnostics() {
    const configInfo = document.getElementById('rag-config-info');
    const evidenceInfo = document.getElementById('rag-evidence-info');
    
    if (!configInfo || !evidenceInfo) {
      return;
    }

    // Get RAG configuration from window globals (mirrored from env)
    const ragTopK = parseInt(
      (typeof window !== 'undefined' && window.__RAG_TOP_K) || '5', 
      10
    );
    const ragIndex = 
      (typeof window !== 'undefined' && window.__AZURE_SEARCH_INDEX) || 
      'cardiology-index';
    const strict = 
      (typeof window !== 'undefined' && !!window.__STRICT_GROUNDING);

    // Display RAG configuration
    configInfo.innerHTML = `
      <div><strong>RAG:</strong> ${ragIndex}, topK=${ragTopK}</div>
      <div><strong>STRICT_GROUNDING:</strong> ${strict ? 'ON' : 'OFF'}</div>
    `;

    // Display evidence documents
    const ev = Array.isArray(this.parsedData?.evidenceDocs) ? this.parsedData.evidenceDocs : [];
    if (ev.length > 0) {
      const titles = ev.slice(0, 3).map(x => x?.title || '(untitled)');
      evidenceInfo.innerHTML = `<div><strong>Evidence (first 3):</strong> ${titles.join(' | ')}</div>`;
    } else {
      evidenceInfo.innerHTML = '<div><strong>Evidence:</strong> none (fallback or no hits)</div>';
    }

    // Also display source if available
    if (this.parsedData?.source) {
      evidenceInfo.innerHTML += `<div style="margin-top: 4px;"><strong>Analysis Source:</strong> ${this.parsedData.source}</div>`;
    }
  }

  // Paraphrase HPI using GPT-4o-mini with fail-soft to rules
  async paraphraseHPI(originalHPI) {
    // Skip if HPI is too short
    if (!originalHPI || originalHPI.length < 50) {
      return originalHPI;
    }

    // Try AI paraphrasing first (fail-soft)
    try {
      const AI_SERVER_URL = 'http://127.0.0.1:8081';
      debugLog('[AI Paraphrase] Calling paraphrase endpoint...');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${AI_SERVER_URL}/api/paraphrase-hpi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hpi: originalHPI }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.paraphrased && result.paraphrased.length > 20) {
          debugLog('[AI Paraphrase] ✅ Success');
          return result.paraphrased;
        }
      } else {
        debugWarn('[AI Paraphrase] Server returned error:', response.status);
      }
    } catch (error) {
      debugWarn('[AI Paraphrase] Failed, falling back to rules:', error?.message || String(error));
    }

    // Fallback: Use existing rule-based rewriteHPI
    debugLog('[AI Paraphrase] Using rule-based fallback');
    return this.rewriteHPI(originalHPI, null);
  }

  // Copy output to clipboard
  async copyToClipboard() {
    const textArea = document.getElementById('rendered-output');
    if (!textArea || !textArea.value.trim()) {
      this.showError('No content to copy.');
      return;
    }
 
 

    try {
      await navigator.clipboard.writeText(textArea.value);
      this.showSuccess('Copied to clipboard!');
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Fallback for older browsers
      textArea.select();
      document.execCommand('copy');
      this.showSuccess('Copied to clipboard!');
    }
  }

  // Download output as text file
  downloadOutput() {
    const textArea = document.getElementById('rendered-output');
    if (!textArea || !textArea.value.trim()) {
      this.showError('No content to download.');
      return;
    }

    const content = textArea.value;
    const templateName = TEMPLATES[this.currentTemplate].name;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `${templateName}_${timestamp}.txt`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showSuccess(`Downloaded as ${filename}`);
  }

  // Clear output
  clearOutput() {
    const textArea = document.getElementById('rendered-output');
    if (textArea) {
      textArea.value = '';
    }

    this.parsedData = null;
    this.normalizedSections = {};
    this.unmappedContent = {};

    this.showSuccess('Output cleared.');
  }

  // Show error message
  showError(message) {
    const status = document.getElementById('renderer-status');
    if (status) {
      status.textContent = message;
      status.style.color = 'var(--error)';
      setTimeout(() => {
        status.textContent = '';
      }, 5000);
    }
  }

  // Show success message
  showSuccess(message) {
    const status = document.getElementById('renderer-status');
    if (status) {
      status.textContent = message;
      status.style.color = 'var(--ok)';
      setTimeout(() => {
        status.textContent = '';
      }, 3000);
    }
  }

  // Save settings to localStorage
  saveSettings() {
    const settings = {
      currentTemplate: this.currentTemplate,
      useSmartPhrase: this.useSmartPhrase
    };

    try {
      localStorage.setItem('templateRenderer_settings', JSON.stringify(settings));
    } catch (error) {
      debugWarn('Could not save settings to localStorage:', error);
    }
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem('templateRenderer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.currentTemplate = settings.currentTemplate || 'cis';
        this.useSmartPhrase = settings.useSmartPhrase || false;
        // Don't call updateUI() on init - wait for actual parse
      }
    } catch (error) {
      debugWarn('Could not load settings from localStorage:', error);
    }
  }
}

// Initialize template renderer when DOM is ready
debugLog('🚀 Template renderer script loaded, document ready state:', document.readyState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    debugLog('📝 Initializing template renderer via DOMContentLoaded...');
    try {
      window.templateRenderer = new TemplateRenderer();
      window.TemplateRendererInitialized = true;
      debugLog('✅ Template renderer initialized:', !!window.templateRenderer);
    } catch (e) {
      debugError('TemplateRenderer init error', e);
    }
  });
} else {
  debugLog('📝 Initializing template renderer immediately...');
  try {
    window.templateRenderer = new TemplateRenderer();
    window.TemplateRendererInitialized = true;
    debugLog('✅ Template renderer initialized:', !!window.templateRenderer);
  } catch (e) {
    debugError('TemplateRenderer init error', e);
  }
}

// Make available globally
// Lightweight function used by features: generate a template string
// from parsed data without requiring feature code to know about the class.
window.renderTemplate = function(parsed, { format } = {}) {
  try {
    const instance = (typeof window !== 'undefined' && window.templateRenderer)
      ? window.templateRenderer
      : (typeof window !== 'undefined' && window.TemplateRenderer)
        ? new window.TemplateRenderer()
        : null;

    // If JSON requested, return stringified parsed data directly
    const fmtMap = { hp: 'cis', consult: 'consult', discharge: 'progress', json: 'json' };
    const mapped = format && fmtMap[format] ? fmtMap[format] : format;
    if (mapped === 'json') {
      return JSON.stringify(parsed, null, 2);
    }

    if (!instance) {
      return 'Renderer not initialized';
    }

    // Normalize sections and render
    instance.parsedData = parsed;
    const { normalized } = instance.normalizeSections(parsed);
    instance.normalizedSections = normalized;
    if (mapped) instance.currentTemplate = mapped;
    return instance.renderTemplate(instance.currentTemplate);
  } catch (e) {
    return `Renderer error: ${e?.message || String(e)}`;
  }
}

// Make TemplateRenderer available globally
if (typeof window !== 'undefined') {
  window.TemplateRenderer = TemplateRenderer;
}

// Browser safety: ensure window.templateRenderer is set with fallbacks
if (typeof window !== 'undefined') {
  window.templateRenderer = window.renderTemplate;
}

