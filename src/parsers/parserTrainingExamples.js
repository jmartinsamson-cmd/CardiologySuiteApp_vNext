/**
 * parserTrainingExamples.js - File-Based Parser Training
 * ========================================================
 * SIMPLE MODE: Just paste your clinical notes below, one per entry.
 * The parser will automatically learn header patterns from your examples.
 * 
 * HOW TO USE:
 * 1. Paste a clinical note between the backticks (`)
 * 2. That's it! No labels needed.
 * 3. Save this file - the parser will automatically learn the patterns
 * 
 * You can paste notes as strings or as objects with labels (optional).
 * 
 * FILE SIZE MANAGEMENT:
 * - Current size: ~19 KB (check console for exact size)
 * - Recommended max: ~100 KB (browser loading stays fast)
 * - If file gets large: Remove old examples or move them to a separate backup
 * - The parser learns patterns quickly - usually 5-10 diverse examples is enough
 * - Quality > Quantity: Better to have diverse note formats than many similar ones
 */

const TRAINING_EXAMPLES = [
  // Simple format - just paste your note as a string
  `
History of Present Illness:
65 year old male with chest pain for 2 days. Pain is substernal, pressure-like, radiating to left arm. Associated with shortness of breath and diaphoresis.

Vitals:
BP: 145/90
HR: 88 bpm
RR: 18 /min
Temp: 98.6F
SpO2: 96% on room air
Weight: 85 kg

Assessment:
1. Chest pain - rule out ACS
2. Hypertension
3. Possible NSTEMI

Plan:
- Serial troponins q6h
- Continuous EKG monitoring
- Cardiology consult
- ASA 325mg, Heparin drip
- Admit to telemetry
  `,

  // Another example - just paste it
  `
CC: Chest pain

HPI:
72F presents via EMS with sudden onset chest pain while watching TV. Describes as 8/10 crushing substernal pain. + SOB, + nausea. - radiation. Took 3 SL NTG without relief.

VS:
BP 180/95, P 110, RR 24, T 98.2F, SpO2 94% RA

ROS: As per HPI, otherwise negative

PE:
Gen: Diaphoretic, anxious appearing
CV: Tachycardic, regular, no m/r/g
Lungs: Bibasilar crackles
Ext: No edema

A/P:
1. ACS - STEMI likely
   - ASA, Plavix load
   - Heparin gtt
   - Activate cath lab
2. Acute pulmonary edema
   - Lasix 40mg IV
   - NTG gtt
  `,

  // Your comprehensive ED note example
  `
Chief Complaint
Patient presents with
•	Shortness of Breath
 	 	Pt arrives POV via wheelchair with C/O SOB has been getting worse over the past 2 weeks. Decreased appetite. No acute distress in triage. Hx: esophageal CA (currently on immuno therapy). Oncologist: Dr. Prouet. Pt alert. GCS 15. 
 
The patient is a 70 y/o male with a hx of esophageal cancer, CAD, HTN, HLD, PVD, and hypothyroidism who presents to the ED for worsening shortness of breath for the past 2 weeks. Patient states he recently started immunotherapy with Dr. Prouet and notes worsening symptoms since noting dyspnea with minimal exertion. He reports he had an echo done Wednesday which was "abnormal". He also notes recent decreased appetite, generalized weakness, and chills but denies fevers. 
 
Hem/Onc: Dr. Philippe E. Prouet, MD
 
Chart review shows echocardiogram done on 10/15 ordered by Dr. Prouet with the following findings:  
Left Ventricle: The left ventricle is normal in size. Normal wall thickness. There is mildly reduced systolic function with a visually estimated ejection fraction of 45 - 50%.  measuring -15% Grade I diastolic dysfunction.
Right Ventricle: The right ventricle is normal in size.
Aortic Valve: Mildly calcified cusps. There is mild aortic regurgitation.
Mitral Valve: Mildly calcified leaflets. There is trace regurgitation.
Tricuspid Valve: There is trace regurgitation.
IVC/SVC: Normal venous pressure at 3 mmHg.
 

The history is provided by the patient and medical records. No language interpreter was used. 

Review of patient's allergies indicates:
No Known Allergies
Past Medical History:
Diagnosis	Date
•	CAD (coronary artery disease)	 
•	Esophageal cancer	 
•	HLD (hyperlipidemia)	 
•	HTN (hypertension)	 
•	Hypothyroidism, unspecified	 
•	Malignant neoplasm of esophagus, unspecified location	 
•	PVD (peripheral vascular disease)	 
 
Past Surgical History:
Procedure	Laterality	Date
•	BACK SURGERY	N/A	 
•	ESOPHAGOGASTRODUODENOSCOPY	N/A	06/24/2022
 	Procedure: EGD;  Surgeon: John Brent Rhodes, MD;  Location: OLGH BRACC ENDOSCOPY;  Service: Gastroenterology;  Laterality: N/A;
•	INSERTION OF PERCUTANEOUS ENDOSCOPIC GASTROSTOMY (PEG) FEEDING TUBE	 	04/2022
•	JOINT REPLACEMENT	 	2019
•	KNEE SURGERY	Left	 
•	MEDIPORT INSERTION, SINGLE	 	03/2022
•	SHOULDER SURGERY	Left	 
 
Family History
Problem	Relation	Name	Age of Onset
•	Hypertension	Mother	Laura Eaglin	 
•	Diabetes	Mother	Laura Eaglin	 
•	Hyperlipidemia	Mother	Laura Eaglin	 
•	Arthritis	Mother	Laura Eaglin	 
•	Hypertension	Father	Herbert Eaglin Sr.	 
 	    Cancer
•	Prostate cancer	Father	Herbert Eaglin Sr.	 
•	Cancer	Brother	Spencer Eaglin	 
 
[Social History]

[Social History]
Tobacco Use
•	Smoking status:	Former
 	 	Current packs/day:	1.00
 	 	Average packs/day:	1 pack/day for 34.0 years (34.0 ttl pk-yrs)
 	 	Types:	Cigarettes
•	Smokeless tobacco:	Never
•	Tobacco comments:
 	 	patient stated he stopped smoking at 54 years old 
Substance Use Topics
•	Alcohol use:	Yes
 	 	Alcohol/week:	1.0 - 2.0 standard drink of alcohol
 	 	Types:	1 - 2 Cans of beer per week
•	Drug use:	Never

Review of Systems 
Constitutional:  Positive for appetite change, chills and fatigue. Negative for fever. 
Respiratory:  Positive for shortness of breath.  
Allergic/Immunologic: Positive for immunocompromised state. 

 
Physical Exam
 
Initial Vitals [10/17/25 1151]
BP	Pulse	Resp	Temp	SpO2
(!) 146/79	76	20	97.5 °F (36.4 °C)	96 %
 
MAP	 	 	 	 
--	 	 	 	 
 
Physical Exam
 
Constitutional: He appears well-developed and well-nourished. He is not diaphoretic. No distress. 
HENT: 
Head: Normocephalic and atraumatic. 
Right Ear: External ear normal. 
Left Ear: External ear normal. 
Nose: Nose normal. 
Eyes: EOM are normal. Pupils are equal, round, and reactive to light. Right eye exhibits no discharge. Left eye exhibits no discharge. 
Cardiovascular:  Normal rate, regular rhythm and normal heart sounds.     Exam reveals no gallop and no friction rub.     
No murmur heard.
Pulmonary/Chest: Effort normal and breath sounds normal. No respiratory distress. He has no wheezes. He has no rhonchi. He has no rales. He exhibits no tenderness. 
Mediport to the right upper chest wall.  
Abdominal: Abdomen is soft. Bowel sounds are normal. He exhibits no distension and no mass. There is no abdominal tenderness. There is no rebound and no guarding. 
Musculoskeletal:    
   General: No edema. Normal range of motion. 
 
Neurological: He is alert and oriented to person, place, and time. No cranial nerve deficit or sensory deficit. 
Skin: Skin is warm and dry. Capillary refill takes less than 2 seconds. 

 
 
ED Course
Procedures
Labs Reviewed
COMPREHENSIVE METABOLIC PANEL - Abnormal
    Result	Value	
 	Sodium	128 (*)	 
 	Potassium	3.2 (*)	 
 	Chloride	93 (*)	 
 	CO2	28 	 
 	Glucose	102 	 
 	Blood Urea Nitrogen	5.3 (*)	 
 	Creatinine	0.66 (*)	 
 	Calcium	10.1 (*)	 
 	Protein Total	8.8 (*)	 
 	Albumin	3.5 	 
 	Globulin	5.3 (*)	 
 	Albumin/Globulin Ratio	0.7 (*)	 
 	Bilirubin Total	0.9 	 
 	ALP	100 	 
 	ALT	14 	 
 	AST	40 (*)	 
 	eGFR	>60 	 
 	Anion Gap	7.0 	 
 	BUN/Creatinine Ratio	8 	 
CBC WITH DIFFERENTIAL - Abnormal
 	WBC	9.04 	 
 	RBC	4.79 	 
 	Hgb	13.4 (*)	 
 	Hct	39.0 (*)	 
 	MCV	81.4 	 
 	MCH	28.0 	 
 	MCHC	34.4 	 
 	RDW	13.0 	 
 	Platelet	292 	 
 	MPV	9.1 	 
 	Neut %	57.3 	 
 	Lymph %	29.8 	 
 	Mono %	7.1 	 
 	Eos %	4.4 	 
 	Basophil %	1.1 	 
 	Imm Grans %	0.3 	 
 	Neut #	5.18 	 
 	Lymph #	2.69 	 
 	Mono #	0.64 	 
 	Eos #	0.40 	 
 	Baso #	0.10 	 
 	Imm Gran #	0.03 	 
 	NRBC%	0.0 	 
NT-PRO NATRIURETIC PEPTIDE - Normal
 	NT-proBNP	85 	 
 	Narrative: 
 	NOTE:  Access complete set of age - and/or gender-specific reference intervals for this test in the Ochsner Laboratory Collection Manual.
TROPONIN I HIGH SENSITIVITY - Normal
 	Troponin High Sensitive	9 	 
CBC W/ AUTO DIFFERENTIAL
 	Narrative: 
 	The following orders were created for panel order CBC auto differential.
Procedure                               Abnormality         Status                   
---------                               -----------         ------                   
CBC with Differential[1347043280]       Abnormal            Final result             
 
Please view results for these tests on the individual orders.
 
ECG Results 
 
EKG 12-lead (Final result) 
 
 	Collection Time	Result Time	QRS Duration	OHS QTC Calculation
 	10/17/25 11:00:58	10/17/25 16:30:44	100	417
 
Final result by Interface, Lab In Hlseven (10/17/25 16:30:53)
 	
Narrative:
 	
Test Reason : R06.02,
 
Vent. Rate :  54 BPM     Atrial Rate :  54 BPM
   P-R Int : 224 ms          QRS Dur : 100 ms
    QT Int : 440 ms       P-R-T Axes :  63   6  46 degrees
  QTcB Int : 417 ms
 
Sinus bradycardia with 1st degree A-V block
Nonspecific ST abnormality
Abnormal ECG
No previous ECGs available
Confirmed by Daya, Samantapudi (11280) on 10/17/2025 4:30:41 PM
 
Referred By:            Confirmed By: Samantapudi Daya

Imaging Results 
 

CTA Chest Non-Coronary (PE Studies) (Final result) 	Result time 10/17/25 15:16:25
 

Final result by Sachasinh, Rachadip S., MD (10/17/25 15:16:25)
 	
 
Impression:
 	
No pulmonary embolism seen
 
Chronic interstitial lung changes seen bilaterally as outlined above with an area of nodularity developing in the right middle lobe.  Short-term six-month follow-up is recommended.
 
 
Electronically signed by:Raj Sachasinh
Date:                                        10/17/2025
Time:                                                15:16

Narrative:
 	
EXAMINATION:
CTA CHEST NON CORONARY (PE STUDIES)
 
CLINICAL HISTORY:
Pulmonary embolism (PE) suspected, high prob;Hx of malignancy, shortness of breath;
 
TECHNIQUE:
Low dose axial images, sagittal and coronal reformations were obtained from the thoracic inlet to the lung bases following the IV administration of contrast..  Contrast timing was optimized to evaluate the pulmonary arteries.  MIP images were performed.  Automated exposure control was utilized
 
COMPARISON:
08/15/2025
 
FINDINGS:
There is some areas of interstitial scarring and infiltrates in the lungs bilaterally involving the upper and lower lobes.  Some interstitial fibrosis is seen in the lungs bilaterally mainly in the lower lobes.  There is bronchiectasis seen bilaterally.  Some areas of honeycombing are seen in the lower lobes.  There is a nodular opacity that is seen developing in the right middle lobe.  Is sub solid and measures 9 mm.  It is seen on image 77 series 12.  This appears slightly more prominent than the prior examination.
 
No pleural effusion is seen.
 
No pulmonary embolism is seen.
 
The thoracic aorta appears normal.  No mediastinal lymphadenopathy is seen.  The heart appears normal.
 
Upper abdomen shows no acute abnormality.
 
X-Ray Chest AP Portable (Final result) 	Result time 10/17/25 13:36:20
 

 	
Final result by Yoselevitz, Moises, MD (10/17/25 13:36:20)
 	
Impression:
 	
 
Persistent interstitial lung changes throughout both lung fields to the slightly more confluent in the left retrocardiac region and right upper lobe exact nature of these abnormality difficult to be ascertained by this exam.
 
No other focal consolidative changes.
 
Right-sided pleural effusion
 
 
Electronically signed by:Moises Yoselevitz
Date:                                        10/17/2025
Time:                                                13:36

Narrative:
 	
EXAMINATION:
XR CHEST AP PORTABLE
 
CLINICAL HISTORY:
Shortness of breath
 
TECHNIQUE:
Single frontal view of the chest was performed.
 
COMPARISON:
March 24, 2025
 
FINDINGS:
Examination reveals mediastinal silhouette to be within normal limits cardiac silhouette is not enlarged some increase interstitial markings are identified throughout both lung fields with slightly more confluent opacities in the left retrocardiac region and slightly more confluent patchy opacities in the right upper lobe.
 
No other focal consolidative changes
 
There is blunting of the right costophrenic angle indicating the presence of a right-sided pleural effusion
 
Medications
sodium chloride 0.9% flush 10 mL (has no administration in time range)
melatonin tablet 6 mg (has no administration in time range)
0.9% NaCl infusion (1,000 mLs Intravenous New Bag 10/17/25 1719)
mupirocin 2 % ointment (has no administration in time range)
sodium chloride 0.9% bolus 1,000 mL 1,000 mL (0 mLs Intravenous Stopped 10/17/25 1511)
iohexoL (OMNIPAQUE 350) injection 100 mL (100 mLs Intravenous Given 10/17/25 1445)
 
Medical Decision Making
Differential diagnosis includes but is not limited to:  Electrolyte abnormality, renal dysfunction, generalized weakness, deconditioning, side effect of chemotherapy.
 
See ED course for MDM
 

Amount and/or Complexity of Data Reviewed
External Data Reviewed: radiology.
   Details: Chart review shows echocardiogram done on 10/15 ordered by Dr. Prouet with the following findings:  
Left Ventricle: The left ventricle is normal in size. Normal wall thickness. There is mildly reduced systolic function with a visually estimated ejection fraction of 45 - 50%.  measuring -15% Grade I diastolic dysfunction.
Right Ventricle: The right ventricle is normal in size.
Aortic Valve: Mildly calcified cusps. There is mild aortic regurgitation.
Mitral Valve: Mildly calcified leaflets. There is trace regurgitation.
Tricuspid Valve: There is trace regurgitation.
IVC/SVC: Normal venous pressure at 3 mmHg.
 
Labs: ordered. Decision-making details documented in ED Course.
Radiology: ordered and independent interpretation performed. Decision-making details documented in ED Course.
ECG/medicine tests: ordered and independent interpretation performed. Decision-making details documented in ED Course.

Risk
OTC drugs.
Prescription drug management.
Decision regarding hospitalization.

Scribe Attestation: 
Scribe #1: I performed the above scribed service and the documentation accurately describes the services I performed. I attest to the accuracy of the note.
 
Attending Attestation: 
 
Physician Attestation for Scribe:
Physician Attestation Statement for Scribe #1: I, McManus, Martin R, MD, reviewed documentation, as scribed by Logan Hebert in my presence, and it is both accurate and complete. 
 
Plan
 
ED Course as of 10/17/25 1934
Fri Oct 17, 2025
1348	Comprehensive metabolic panel(!)
Worsening hyponatremia [MM]
1348	Troponin I High Sensitivity: 9 [MM]
1348	NT-proBNP: 85 [MM]
1348	WBC: 9.04 [MM]
1348	Hemoglobin(!): 13.4 [MM]
1348	Hematocrit(!): 39.0 [MM]
1348	X-Ray Chest AP Portable
Patchy infiltrates bilaterally no obvious pneumothorax.  Port in place [MM]
1352	EKG done at 11:52 a.m. shows sinus rhythm rate of 72 QTC 459.  Normal axis.  No ST-elevation or depression [MM]
1626	Paged Dr. Sai Chennamsetty [LH]
1645	Patient is awake alert somewhat uncomfortable.  Reports feeling generally weak, short of breath.  Not eating or drinking well.  Hyponatremia that has worsening.  Given history of malignancy in shortness of breath CT PE study was ordered which was negative for any acute process.  Discussed findings with the patient, family room.  They are okay with the admission for further evaluation monitoring of the patient's hyponatremia.  Discussed with Dr. Sai, comfortable with the plan. [MM]
  `,

  // Add your own notes here - just paste between backticks!
  // `
  // 86 y.o. male who  has a past medical history of Anemia, Anxiety, Arthritis, BPH (benign prostatic hyperplasia), Cancer, Chronic kidney disease, stage IV (severe), CKD (chronic kidney disease), stage IV, CVA (cerebral vascular accident) (10/2020), Diverticulitis, GERD (gastroesophageal reflux disease), HLD (hyperlipidemia), HTN (hypertension), and OSA (obstructive sleep apnea).. The patient presented to OLGMC on 10/20/2025 with a primary complaint of generalized weakness, nausea, vomiting, dizziness, and poor appetite for the past 4-5 days.  Patient states 2 weeks ago he had a left arm AV fistula place due to possibility of dialysis.  He was seen at Ocshner in Crowley and was noted to have an elevated troponin.  He had a chest x-ray completed which showed an enlarged heart and clear lungs.  His electrolytes were within normal limits but his GFR was 12.  Patient stated 3 weeks ago his GFR was at 15.  He denies headache, fever, fatigue, chest pain, cough, shortness of breath, diarrhea, dysuria, or myalgias.  Patient is stayed about 2 weeks ago he had an episode of diarrhea and he took Imodium that he had problems with constipation.  His lab work was significant for elevated BUN and creatinine of 72.8 and 4.42, leukocytosis with a WBC of 13.9, elevated liver enzymes with AST of 125 and ALT of 164.  Troponin high sensitivity was elevated at 185 and trended down to 181.  He had ultrasound of the abdomen pending.  Chest x-ray pending.  UA was negative for UTI.  He was given NS 1 L bolus in ER and started on maintenance IV fluids for dehydration.  He will be admitted to hospital medicine services for further management.  Nephrology and Cardiology is consulted and will follow recommendations.  He denies use of tobacco products, alcohol, or illicit drugs.  He is awake and alert and oriented to person, place, time, situation.  Spouse at bedside.
 
`
PAST MEDICAL HISTORY:
 
Past Medical History:
Diagnosis	Date
•	Anemia	 
•	Anxiety	 
•	Arthritis	 
•	BPH (benign prostatic hyperplasia)	 
•	Cancer	 
 	hx of kidney cancer
•	Chronic kidney disease, stage IV (severe)	 
•	CKD (chronic kidney disease), stage IV	 
•	CVA (cerebral vascular accident)	10/2020
•	Diverticulitis	 
•	GERD (gastroesophageal reflux disease)	 
•	HLD (hyperlipidemia)	 
•	HTN (hypertension)	 
•	OSA (obstructive sleep apnea)	 
 	uses auto PAP
 
 
PAST SURGICAL HISTORY:
 
Past Surgical History:
Procedure	Laterality	Date
•	AV FISTULA PLACEMENT	Left	10/6/2025
 	Procedure: CREATION, AV FISTULA;  Surgeon: Ghanami, Racheed J., MD;  Location: OLGH OR;  Service: Peripheral Vascular;  Laterality: Left;  supraclavicular block, left brachiocephalic fistula creation
•	BACK SURGERY	 	1999
•	CARPAL TUNNEL RELEASE	Bilateral	 
 	hands
•	COLECTOMY, SIGMOID	 	2015
•	COLONOSCOPY	 	 
•	EYE SURGERY	Bilateral	 
 	cataract w/lens implant
•	INGUINAL HERNIA REPAIR	Left	 
•	LUMBAR SPINE SURGERY	 	 
•	PARTIAL NEPHRECTOMY	Left	2016
•	TOTAL KNEE ARTHROPLASTY	Right	 
•	TOTAL SHOULDER ARTHROPLASTY	Right	2017
•	VENTRAL HERNIA REPAIR	 	2025
 
 
ALLERGIES:
Oxycodone-acetaminophen
 
FAMILY HISTORY:
Reviewed and negative
 
SOCIAL HISTORY:
 
Social History
 
Tobacco Use
•	Smoking status:	Never
•	Smokeless tobacco:	Never
Substance Use Topics
•	Alcohol use:	Not Currently
 
 
HOME MEDICATIONS:
 
Prior to Admission medications
Medication	Sig	Start Date	End Date	Taking?	Authorizing Provider
acetaminophen (TYLENOL) 325 MG tablet	Take 325 mg by mouth every 6 (six) hours as needed for Pain.	 	 	 	Provider, Historical
aspirin (ECOTRIN) 81 MG EC tablet	Take 81 mg by mouth once daily.	 	 	 	Provider, Historical
benazepriL (LOTENSIN) 40 MG tablet	Take 40 mg by mouth once daily.	6/25/25	 	 	Provider, Historical
calcitRIOL (ROCALTROL) 0.25 MCG Cap	Take 0.25 mcg by mouth once daily.	9/24/25	 	 	Provider, Historical
carvediloL (COREG) 12.5 MG tablet	Take 12.5 mg by mouth Daily.	7/5/25	 	 	Provider, Historical
clopidogreL (PLAVIX) 75 mg tablet	Take 75 mg by mouth once daily.	6/2/25	 	 	Provider, Historical
dapagliflozin propanediol (FARXIGA) 10 mg tablet	Take 10 mg by mouth Daily.	 	 	 	Provider, Historical
furosemide (LASIX) 40 MG tablet	Take 40 mg by mouth once daily.	5/31/25	 	 	Provider, Historical
gabapentin (NEURONTIN) 300 MG capsule	Take 300 mg by mouth every evening.	4/28/25	 	 	Provider, Historical
ondansetron (ZOFRAN) 4 MG tablet	Take 1 tablet (4 mg total) by mouth every 6 (six) hours.	10/17/25	 	 	Henagan, Tara, MD
pantoprazole (PROTONIX) 40 MG tablet	Take 40 mg by mouth once daily.	8/6/25	 	 	Provider, Historical
rOPINIRole (REQUIP) 1 MG tablet	Take 2 mg by mouth every evening.	8/6/25	 	 	Provider, Historical
tamsulosin (FLOMAX) 0.4 mg Cap	Take 1 capsule by mouth 2 (two) times daily.	7/5/25	 	 	Provider, Historical
traMADoL (ULTRAM) 50 mg tablet	Take 50 mg by mouth 2 (two) times a day.	7/9/25	 	 	Provider, Historical
 
 
REVIEW OF SYSTEMS:
Except as documented, all other systems reviewed and negative 
 
PHYSICAL EXAM:
 
VITAL SIGNS: 24 HRS MIN & MAX	LAST
Temp  Min: 97.4 °F (36.3 °C)  Max: 97.4 °F (36.3 °C)	97.4 °F (36.3 °C)
BP  Min: 159/90  Max: 180/109	(!) 180/109
Pulse  Min: 72  Max: 87 	84
Resp  Min: 16  Max: 22	16
SpO2  Min: 93 %  Max: 98 %	98 %
 
 
General appearance:  Well-developed male in no apparent distress.
HENT: Atraumatic head. Moist mucous membranes of oral cavity.
Eyes: Normal extraocular movements. 
Neck: Supple. 
Lungs: Clear to auscultation bilaterally. No wheezing present. 
Heart: Regular rate and rhythm. S1 and S2 present with no murmurs/gallop/rub. No pedal edema. No JVD present. 
Abdomen: Soft, non-distended, non-tender. No rebound tenderness/guarding. Bowel sounds are normal. 
Extremities: No cyanosis, clubbing, or edema.
Skin:  Left upper arm fistula with positive thrill and bruit
Neuro: Motor and sensory exams grossly intact. Good tone. Muscle strength 5/5 in all 4 extremities
Psych/mental status: Appropriate mood and affect. Responds appropriately to questions. 
 
LABS AND IMAGING:
 
Recent Labs
Lab	10/17/25
1748	10/20/25
1349
WBC	10.56	13.90*
RBC	3.88*	4.29*
HGB	11.6*	12.9*
HCT	37.0*	40.7*
MCV	95.4*	94.9*
MCH	29.9	30.1
MCHC	31.4*	31.7*
RDW	14.6	14.8
PLT	245	279
MPV	9.4	10.0
 
 
Recent Labs
Lab	10/17/25
1748	10/20/25
1349
NA	140	137
K	4.4	4.4
CL	105	102
CO2	22*	23
BUN	65.0*	72.8*
CREATININE	4.61*	4.42*
GLU	121*	102
CALCIUM	9.4	9.1
ALBUMIN	3.1*	3.2*
PROT	6.9	7.2
ALKPHOS	77	95
ALT	63*	164*
AST	56*	125*
BILITOT	0.5	0.7
 
 
Microbiology Results (last 7 days) 
 
 	** No results found for the last 168 hours. **
 
 
 
 
X-Ray Chest AP Portable
Narrative: EXAMINATION:
XR CHEST AP PORTABLE
 
CLINICAL HISTORY:
Other specified abnormal findings of blood chemistry
 
TECHNIQUE:
Single frontal view of the chest was performed.
 
COMPARISON:
September 18, 2025
 
FINDINGS:
The heart size remains enlarged.  Pulmonary vasculature appears unremarkable.  Basilar hypoaeration is identified, accentuated by shallow inspiration.  No pleural effusion or pneumothorax are noted.  Postoperative changes are identified in the right shoulder.
Impression: Cardiomegaly without evidence of cardiac decompensation is seen.
 
Basilar hypoaeration is seen, accentuated by shallow inspiration.
 
Electronically signed by:Guillermo Tanaka
Date:                                        10/18/2025
Time:                                       08:28
 
 
 
ASSESSMENT & PLAN:
ASSESSMENT:
1. Dehydration 
2. Chronic kidney disease stage 5
3. Transaminitis
4. Leukocytosis
5. Elevated troponin 
6. BPH
7. Hypertensive disorder 
8. Hyperlipidemia 
 
PLAN:
Consult nephrology and follow recommendations
Consult cardiology and follow recommendations
Monitor BUN and creatinine 72.8 and 4.42 
AST 125.  ALT 164.
Troponin high sensitivity 185, 181
Denies chest pain
Monitor WBC 13.9
Echo pending
EKGs that p.r.n. chest pain
Ultrasound of the abdomen and hepatitis p.m.
UA negative for UTI
Chest x-ray pending
NS 1 L bolus given in ER.  NS at 125 mL/hour.
Strict intake and output.  Daily weight.
Avoid nephrotoxic medications 
Telemetry monitoring 
Continue home medication once reconciled and appropriate
Fall precautions
Labs in a.m.
 
 
Patient has past medical history including CVA, GERD, mild carotid artery disease, renal cell carcinoma, restless legs syndrome, sleep apnea, and osteoarthritis
 
VTE Prophylaxis: will be placed on Lovenox and SCD for DVT prophylaxis and will be advised to be as mobile as possible and sit in a chair as tolerated
 
Patient condition: Guarded
 
__________________________________________________________________________
INPATIENT LIST OF MEDICATIONS
 
Scheduled Meds:
•	enoxparin	 30 mg	Subcutaneous	Daily
 
Continuous Infusions:
PRN Meds:.
Current Facility-Administered Medications: 
•  dextrose 50%, 12.5 g, Intravenous, PRN
•  dextrose 50%, 25 g, Intravenous, PRN
•  glucagon (human recombinant), 1 mg, Intramuscular, PRN
•  glucose, 16 g, Oral, PRN
•  glucose, 24 g, Oral, PRN
•  naloxone, 0.02 mg, Intravenous, PRN
•  ondansetron, 4 mg, Intravenous, Q8H PRN
•  prochlorperazine, 5 mg, Intravenous, Q6H PRN
•  sodium chloride 0.9%, 10 mL, Intravenous, PRN
 
 
I, Elizabeth Savoy, FNP have reviewed and discussed the case with Dr. LANDRY, CHRISTOPHER C _ Please see the following addendum for further assessment and plan from their attending MD.
This note was created with a assistance of electronic voice recognition software.  There may be transcription errors as a result of using this technology however minimal; and effort has been made to assure accuracy of the transcription but any obvious areas or admissions should be clarified with the author of the document. 
Elizabeth Savoy, FNP 
10/21/2025
 
________________________________________________________________
 
MD Addendum:
For the patient encounter, I performed the substantive portion of the visit, I reviewed the NP/PA documentation, treatment plan, and medical decision making.  I had face to face time with this patient 
 
A. History:  86-year-old male with nausea and dizziness.  Workup shows that his chronic kidney disease seems to be progressing though his nephrologist seems to be well aware as he recently had a left upper extremity AV shunt placed in the ER tentatively planning possible peritoneal dialysis.
 
B. Physical exam:  Lungs clear anteriorly, cardiovascular regular rate and rhythm, abdomen soft and benign, trace edema in legs
 
C. Medical decision making:  We will see what IV fluids overnight and holding renal sensitive medication does to his creatinine, consultation to Nephrology.  NSTEMI noted will trend cardiac enzymes.  Likely type 2 demand from uncontrolled hypertension.  Obtain echo.
 
All diagnosis and differential diagnosis have been reviewed; assessment and plan has been documented; I have personally reviewed the labs and test results that are presently available; I have reviewed the patients medication list; I have reviewed the consulting providers response and recommendations. I have reviewed or attempted to review medical records based upon their availability.

All of the patient and family questions have been addressed and answered. Patient's is agreeable to the above stated plan. I will continue to monitor closely and make adjustments to medical management as needed.
 
`,

  /* Imported from tests/fixtures/real/example-note-001.json */
  `
HISTORY OF PRESENT ILLNESS:
68yo M h/o CAD s/p PCI 2020, DM2, HTN presents with 3 days progressive DOE and LE edema. Denies CP, palpitations. Reports med compliance. Last echo 2024 showed EF 35%.

PHYSICAL EXAMINATION:
Vitals: BP 145/88, HR 92, RR 18, O2sat 94% RA, Temp 98.2F
Gen: NAD, comfortable at rest
CV: RRR, 2/6 systolic murmur at apex, JVP elevated to 10cm
Resp: Bibasilar crackles, no wheeze
Ext: 2+ pitting edema bilateral LE to knees

LABS:
BNP 1250 (prev 450)
Troponin <0.01
Cr 1.3 (baseline 1.1)
Hgb 11.2

ASSESSMENT:
1. Acute decompensated heart failure (HFrEF) - volume overload
2. CAD - stable, no ACS
3. CKD stage 3 - worsening, likely prerenal
4. Diabetes - well controlled

PLAN:
1. Increase furosemide to 40mg BID
2. Daily weights, strict I/O
3. Repeat BMP tomorrow
4. Hold lisinopril until Cr improves
5. Cardiology f/u 1 week
6. Consider IV diuresis if no response to PO
  `,


  /* Imported from tests/fixtures/real/note-cabg-icu.json */
  `
70 year old male, with significant past medical history of hypertension, type 2 diabetes mellitus, HFrEF, ESRD s/p transplant now on HD, Enterococcus infective endocarditis, CAD s/p two-vessel CABG with aortic valve replacement and ligation of left atrial appendage, and prostate cancer s/p prostatectomy, who was admitted to the ICU post CABG on 9/11/2025. Stepped down on 9/18/25. Worsening respiratory distress noted on 9/23/25 and imaging demonstrated worsening volume overload. Pulmonology was consulted for further evaluation. Transferred back to ICU 9/25/25 for close monitoring. 
 

9/11/25: admitted to ICU post CABG, AVR, and left atrial appendage ligation
9/15/25: HD initiated
9/18/25: stepped down from ICU
9/24/25: Pulm consulted for right pleural effusion and increased work of breathing
 
 
Interval History:
Currently intubated RR18, TV 450, PEEP 5, FIO@ 30%.  Occ opens eyes on command and moves all 4 extremities.  Receiving dialysis today.  Left chest tube remains in place with limited output.
 
Scheduled Medications: 
•	album human 25%	 12.5 g	Intravenous	Once
•	albumin human 25%	 12.5 g	Intravenous	Once
•	albumin human 25%	 25 g	Intravenous	Once
•	albuterol-ipratropium	 3 mL	Nebulization	Q6H
•	amiodarone	 200 mg	Per NG tube	Daily
•	amLODIPine	 10 mg	Per OG tube	Daily
•	ampicillin IV (PEDS and ADULTS)	 2 g	Intravenous	Q12H
•	aspirin	 81 mg	Per OG tube	Daily
•	atorvastatin	 40 mg	Per OG tube	QHS
•	calcitRIOL	 0.5 mcg	Per OG tube	Daily
•	cefTRIAXone (Rocephin) IV (PEDS and ADULTS)	 2 g	Intravenous	Q12H
•	docusate	 100 mg	Per G Tube	BID
•	enoxparin	 30 mg	Subcutaneous	Q24H (prophylaxis, 1700)
•	famotidine (PF)	 20 mg	Intravenous	Daily
•	folic acid	 1 mg	Per OG tube	Daily
•	insulin glargine U-100	 20 Units	Subcutaneous	BID
•	metoprolol tartrate	 25 mg	Per OG tube	BID
•	predniSONE	 7 mg	Per OG tube	Daily
•	sodium chloride 3%	 4 mL	Nebulization	Q6H
•	tacrolimus	 3 mg	Per OG tube	BID
 
 
PRN Medications: 
 
Current Facility-Administered Medications: 
•  0.9%  NaCl infusion (for blood administration), , Intravenous, Q24H PRN
•  acetaminophen, 650 mg, Per OG tube, Q6H PRN
•  albumin human 25%, 25 g, Intravenous, Q20 Min PRN
•  albumin human 5%, 12.5 g, Intravenous, PRN
•  calcium carbonate, 500 mg, Per OG tube, TID PRN
•  calcium gluconate IVPB, 1 g, Intravenous, PRN
•  calcium gluconate IVPB, 2 g, Intravenous, PRN
•  calcium gluconate IVPB, 3 g, Intravenous, PRN
•  dextrose 50%, 12.5 g, Intravenous, PRN
•  dextrose 50%, 25 g, Intravenous, PRN
•  glucagon (human recombinant), 1 mg, Intramuscular, PRN
•  glucose, 16 g, Per OG tube, PRN
•  glucose, 24 g, Per OG tube, PRN
•  guaiFENesin 100 mg/5 ml, 200 mg, Per OG tube, Q4H PRN
•  hydrALAZINE, 10 mg, Intravenous, Q6H PRN
•  insulin aspart U-100, 0-10 Units, Subcutaneous, Q6H PRN
•  lactulose 10 gram/15 ml, 20 g, Per OG tube, Q6H PRN
•  loperamide, 2 mg, Per OG tube, Continuous PRN
•  magnesium sulfate 2 g IVPB, 2 g, Intravenous, PRN
•  magnesium sulfate 2 g IVPB, 2 g, Intravenous, PRN
•  metoclopramide, 5 mg, Intravenous, Q12H PRN
•  naloxone, 0.02 mg, Intravenous, PRN
•  ondansetron, 4 mg, Intravenous, Q4H PRN
•  potassium chloride in water, 20 mEq, Intravenous, PRN
•  potassium chloride in water, 40 mEq, Intravenous, PRN
•  potassium chloride in water, 60 mEq, Intravenous, PRN
•  [COMPLETED] CTA Chest Non-Coronary (PE Studies), , , Once **AND** sodium chloride 0.9%, 1,000 mL, Intravenous, Daily PRN
•  sodium chloride 0.9%, 10 mL, Intravenous, PRN
•  sodium phosphate 15 mmol in D5W 250 mL IVPB, 15 mmol, Intravenous, PRN
•  sodium phosphate 20.1 mmol in D5W 250 mL IVPB, 20.1 mmol, Intravenous, PRN
•  sodium phosphate 30 mmol in D5W 250 mL IVPB, 30 mmol, Intravenous, PRN
 
 
Infusions:  
•	loperamide	 2 mg	Per OG tube	Continuous PRN	 	 
•	NORepinephrine bitartrate-D5W	 0-3 mcg/kg/min	Intravenous	Continuous	 	Stopped at 09/29/25 1238
•	propofoL	 0-50 mcg/kg/min	Intravenous	Continuous	4.6 mL/hr at 09/27/25 0600	10 mcg/kg/min at 09/27/25 0600
 
 
 
Fluid Balance: 
 
Intake/Output Summary (Last 24 hours) at 10/1/2025 0905
Last data filed at 10/1/2025 0530
Gross per 24 hour
Intake	1961 ml
Output	2500 ml
Net	-539 ml
 
 
 
Vital Signs: 
Vitals:
 	10/01/25 0824
BP:	 
Pulse:	74
Resp:	(!) 22
Temp:	 
 
 
 
Physical Exam
Vitals and nursing note reviewed. 
Constitutional:  
   General: He is not in acute distress.
   Appearance: Normal appearance. He is ill-appearing. He is not toxic-appearing. 
HENT: 
   Head: Normocephalic and atraumatic. 
   Right Ear: External ear normal. 
   Left Ear: External ear normal. 
   Nose: Nose normal. 
   Mouth/Throat: 
   Pharynx: No posterior oropharyngeal erythema. 
   Comments: Unable to visualize posterior oropharynx secondary to endotracheal tube
Eyes: 
   General: No scleral icterus.
   Conjunctiva/sclera: Conjunctivae normal. 
   Pupils: Pupils are equal, round, and reactive to light. 
Neck: 
   Vascular: No carotid bruit. 
Cardiovascular: 
   Rate and Rhythm: Normal rate and regular rhythm. 
   Pulses: Normal pulses. 
   Heart sounds: Normal heart sounds. No murmur heard.
   No friction rub. No gallop. 
Pulmonary: 
   Effort: Pulmonary effort is normal. No respiratory distress. 
   Breath sounds: Normal breath sounds. No wheezing, rhonchi or rales. 
   Comments: Intubated, on mechanical ventilation
Abdominal: 
   General: Abdomen is flat. Bowel sounds are normal. There is no distension. 
   Palpations: Abdomen is soft. 
   Tenderness: There is no abdominal tenderness. There is no guarding or rebound. 
Musculoskeletal:    
   General: No swelling or deformity. 
   Cervical back: Neck supple. No rigidity or tenderness. 
Skin:
   General: Skin is warm and dry. 
   Capillary Refill: Capillary refill takes less than 2 seconds. 
   Findings: No erythema or rash. 
Neurological: 
   Comments: Unable to fully assess neurologic status and orientation.  Does  follow commands and is currently not sedated.  Withdraws to pain at lower extremities and minimally to command.  Occ opens eyes 
Psychiatric: 
   Comments: Unable to fully assess as patient is intubated and nonverbal 

 
 
 
Ventilator Settings
Vent Mode: A/C (10/01/25 0523)
Ventilator Initiated: Yes (09/25/25 2300)
Set Rate: 18 BPM (10/01/25 0523)
Vt Set: 450 mL (10/01/25 0523)
Pressure Support: 8 cmH20 (09/27/25 0803)
PEEP/CPAP: 5 cmH20 (10/01/25 0523)
Oxygen Concentration (%): 30 (10/01/25 0523)
Peak Airway Pressure: 20 cmH20 (10/01/25 0523)
Plateau Pressure: 21 cmH20 (09/29/25 1809)
Total Ve: 8.9 L/m (10/01/25 0523)
F/VT Ratio<105 (RSBI): (!) 45.05 (10/01/25 0523)
 
 
Laboratory Studies: 
Recent Labs
Lab	10/01/25
0508
PH	7.490*
PCO2	40.0
PO2	116.0*
HCO3	30.5*
 
Recent Labs
Lab	10/01/25
0351
WBC	12.09*
RBC	3.89*
HGB	10.6*
HCT	35.8*
PLT	184
MCV	92.0
MCH	27.2
MCHC	29.6*
 
Recent Labs
Lab	10/01/25
0351
NA	136
K	5.0
CL	98
CO2	25
BUN	45.2*
CREATININE	3.89*
CALCIUM	8.5*
MG	2.20
 
 
 
Microbiology Data: 
Microbiology Results (last 7 days) 
 
 	Procedure	Component	Value	Units	Date/Time
 	Blood Culture [1336834478]  (Normal)	Collected: 09/26/25 1240
 	Order Status: Completed	Specimen: Blood, Venous	Updated: 09/30/25 1601
 	 	Blood Culture	No Growth At 96 Hours
 	Blood Culture [1336834479]  (Normal)	Collected: 09/26/25 1240
 	Order Status: Completed	Specimen: Blood, Venous	Updated: 09/30/25 1601
 	 	Blood Culture	No Growth At 96 Hours
 	Respiratory Culture [1336829459]	Collected: 09/26/25 1018
 	Order Status: Completed	Specimen: Respiratory from Endotracheal Aspirate	Updated: 09/28/25 0813
 	 	Respiratory Culture	Rare normal respiratory flora
 	 	GRAM STAIN	Quality 1+
 	 	 	No bacteria seen
 	Fungal Culture [1329582542]  (Normal)	Collected: 09/11/25 0816
 	Order Status: Completed	Specimen: Tissue from Heart Valve	Updated: 09/25/25 0900
 	 	Fungal Culture	No Fungus Isolated at 2 Weeks
 
 
 
 
Imaging: 
X-Ray Chest 1 View
Narrative: EXAMINATION:
XR CHEST 1 VIEW
 
CLINICAL HISTORY:
CT maintenance;
 
TECHNIQUE:
One view
 
COMPARISON:
September 27, 2025.
 
FINDINGS:
Cardiopericardial silhouette appearance similar.  Sternotomy changes.  Supporting tubes and lines in similar location.  Bilateral pleural effusions and lower lung zones atelectasis.  No overt pulmonary edema.  No pneumothorax.
Impression: No significant interval change.
 
Electronically signed by:Mian Ibrahim
Date:                                        09/28/2025
Time:                                       08:22
  `,


  /* Imported from tests/fixtures/real/note-gerd-diabetes.json */
  `
Chief Complaint
Patient presents with
•	Vomiting
 	 	Pt had 1 episode of vomiting around 5 pm and states he feels like his chest is burning. Denies nausea/pain at this time
 
43-year-old black male presents emergency department complaining of 1 episode of vomiting and since then he has had some midepigastric burning going up the middle of his chest the back of his throat

 
Review of patient's allergies indicates:
No Known Allergies
Past Medical History:
Diagnosis	Date
•	Known health problems: none	 
 
Past Surgical History:
Procedure	Laterality	Date
•	none 	N/A	 
•	REPAIR, TENDON, BICEPS, DISTAL	Right	9/14/2023
 
Family History
Problem	Relation	Name	Age of Onset
•	Diabetes	Mother	 	 
•	Hypertension	Father	 	 
•	Diabetes	Father	 	 
 
[Social History]

[Social History]
Tobacco Use
•	Smoking status:	Every Day
 	 	Current packs/day:	0.50
 	 	Average packs/day:	0.5 packs/day for 17.0 years (8.5 ttl pk-yrs)
•	Smokeless tobacco:	Never
Substance Use Topics
•	Alcohol use:	Yes
 	 	Comment: occ
•	Drug use:	Never

Review of Systems 
Constitutional: Negative.  Negative for activity change, appetite change, chills, diaphoresis, fatigue, fever and unexpected weight change. 
HENT: Negative.  Negative for congestion, dental problem, drooling, ear discharge, ear pain, facial swelling, hearing loss, mouth sores, nosebleeds, postnasal drip, rhinorrhea, sinus pressure, sinus pain, sneezing, sore throat, tinnitus, trouble swallowing and voice change.  
Eyes: Negative.  Negative for photophobia, pain, discharge, redness, itching and visual disturbance. 
Respiratory: Negative.  Negative for apnea, cough, choking, chest tightness, shortness of breath, wheezing and stridor.  
Cardiovascular: Negative.  Negative for chest pain, palpitations and leg swelling. 
Gastrointestinal:  Positive for abdominal pain. Negative for abdominal distention, anal bleeding, blood in stool, constipation, diarrhea, nausea, rectal pain and vomiting. 
Endocrine: Negative.  Negative for cold intolerance, heat intolerance, polydipsia, polyphagia and polyuria. 
Genitourinary: Negative.  Negative for decreased urine volume, difficulty urinating, dysuria, enuresis, flank pain, frequency, genital sores, hematuria, penile discharge, penile pain, penile swelling, scrotal swelling, testicular pain and urgency. 
Musculoskeletal: Negative.  Negative for arthralgias, back pain, gait problem, joint swelling, myalgias, neck pain and neck stiffness. 
Skin: Negative.  Negative for color change, pallor, rash and wound. 
Allergic/Immunologic: Negative.  Negative for environmental allergies, food allergies and immunocompromised state. 
Neurological: Negative.  Negative for dizziness, tremors, seizures, syncope, facial asymmetry, speech difficulty, weakness, light-headedness, numbness and headaches. 
Hematological: Negative.  Negative for adenopathy. Does not bruise/bleed easily. 
Psychiatric/Behavioral: Negative.  Negative for agitation, behavioral problems, confusion, decreased concentration, dysphoric mood, hallucinations, self-injury, sleep disturbance and suicidal ideas. The patient is not nervous/anxious and is not hyperactive.  
All other systems reviewed and are negative.

 
Physical Exam
 
Initial Vitals [10/01/25 2218]
BP	Pulse	Resp	Temp	SpO2
(!) 163/85	89	18	97.7 °F (36.5 °C)	98 %
 
Physical Exam
 
Nursing note and vitals reviewed.
Constitutional: He appears well-developed and well-nourished. 
HENT: 
Head: Normocephalic and atraumatic. 
Eyes: Conjunctivae and EOM are normal. Pupils are equal, round, and reactive to light. 
Neck: Neck supple. 
Normal range of motion.
Cardiovascular:  Normal rate and regular rhythm.         
Pulmonary/Chest: Breath sounds normal. 
Abdominal: Abdomen is soft. Bowel sounds are normal. There is abdominal tenderness in the epigastric area. 
Musculoskeletal:    
   General: Normal range of motion. 
   Cervical back: Normal range of motion and neck supple. 
 
Neurological: He is alert and oriented to person, place, and time. 
Skin: Skin is warm and dry. Capillary refill takes less than 2 seconds. 
Psychiatric: He has a normal mood and affect. His behavior is normal. Judgment and thought content normal. 

 
 
ED Course
Procedures
Labs Reviewed
COMPREHENSIVE METABOLIC PANEL - Abnormal
    Result	Value	
 	Sodium	138 	 
 	Potassium	3.9 	 
 	Chloride	105 	 
 	CO2	19 (*)	 
 	Glucose	240 (*)	 
 	Blood Urea Nitrogen	11.0 	 
 	Creatinine	1.11 	 
 	Calcium	9.9 	 
 	Protein Total	7.5 	 
 	Albumin	3.4 (*)	 
 	Globulin	4.1 (*)	 
 	Albumin/Globulin Ratio	0.8 (*)	 
 	Bilirubin Total	0.4 	 
 	ALP	40 	 
 	ALT	17 	 
 	AST	14 	 
 	eGFR	>60 	 
 	Anion Gap	14.0 	 
 	BUN/Creatinine Ratio	10 	 
CBC WITH DIFFERENTIAL - Abnormal
 	WBC	5.93 	 
 	RBC	5.15 	 
 	Hgb	14.7 	 
 	Hct	43.9 	 
 	MCV	85.2 	 
 	MCH	28.5 	 
 	MCHC	33.5 	 
 	RDW	14.6 	 
 	Platelet	149 	 
 	MPV	11.9 (*)	 
 	Neut %	43.5 	 
 	Lymph %	41.0 	 
 	Mono %	10.5 	 
 	Eos %	3.2 	 
 	Basophil %	0.8 	 
 	Imm Grans %	1.0 	 
 	Neut #	2.58 	 
 	Lymph #	2.43 	 
 	Mono #	0.62 	 
 	Eos #	0.19 	 
 	Baso #	0.05 	 
 	Imm Gran #	0.06 (*)	 
 	NRBC%	0.0 	 
AMYLASE - Normal
 	Amylase Level	44 	 
LIPASE - Normal
 	Lipase Level	29 	 
 
 
 
Imaging Results 
None
 
 
 
Medications
aluminum-magnesium hydroxide-simethicone 200-200-20 mg/5 mL suspension 30 mL (30 mLs Oral Given 10/1/25 2223)
  And
LIDOcaine viscous HCl 2% oral solution 15 mL (15 mLs Oral Given 10/1/25 2223)
 
Medical Decision Making
43-year-old black gentleman with midepigastric tenderness and burning up his chest after vomiting.  Differential diagnosis includes not limited to reflux with esophagitis, peptic ulcer disease, pancreatitis, gastritis.  Was given a GI cocktail phone arrival and this greatly reduced his symptoms and he feels markedly improved for completeness sake a CBC CMP amylase and lipase were done his blood work is relatively benign with the exception of having a blood sugar over 200.  Discussed this with him and he is unaware that he has ever had a high blood sugar.  The fact that his blood sugars greater than 200 meets criteria for diabetes I will print him on some information discussed at length find a primary care physician and I will begin metformin twice a day and discussed with him the importance of following up and having blood work done and a full workup
 
Problems Addressed:
Gastroesophageal reflux disease with esophagitis without hemorrhage: acute illness or injury
New onset type 2 diabetes mellitus: acute illness or injury that poses a threat to life or bodily functions
 
Amount and/or Complexity of Data Reviewed
Labs: ordered. Decision-making details documented in ED Course.

Risk
OTC drugs.
Prescription drug management.
Diagnosis or treatment significantly limited by social determinants of health.
  `,


  /* Imported from tests/fixtures/real/note-hf-decompensated.json */
  `
HPI: 
53 year old man with history of HFrEF, NIDDM, CKD stage 3B, morbid obesity and hypertension presents for 2 week history of progressively worsening SOB and abdominal swelling. Endorses weight gain but unable to quantify. Denies fever, CP, vomiting or diarrhea. ECHO done 6/26/25 showed LVEF 35-40%. Admits to running out of most of his medications several months ago, including Entresto and synthroid. Compliant with Lasix. Endorses not following cardiac or diabetic diet. Diastolic reading are high but overall VS stable. Requiring 2L/NC to keep sats > 95%. Initial labs include BUN 22.5, creatinine 2.45 (baseline around 2.0). BNP 6,231. Troponin normal. Chest x-ray shows cardiac enlargement with central vascular congestion.  Admitted to hospital medicine service for further evaluation and management of acute on chronic heart failure.  
 
Cardiology was consulted.  IV diuresis was continued. Will consult nephrology also. 
 
Interval Hx: 
Seen and examined. LE edema improving. Still complaining of abdominal distension. Continues on room air. Reportedly had 3.9 sec pause on telemetry today. 
 
Case was discussed with patient's nurse and case manager on the floor.
 
Objective/physical exam:
General: In no acute distress, afebrile
Chest: Clear to auscultation bilaterally
Heart: RRR, +S1, S2, no appreciable murmur
Abdomen: Soft, nontender, BS +
MSK: Warm, no lower extremity edema, no clubbing or cyanosis
Neurologic: Alert and oriented x4, Cranial nerve II-XII intact, Strength 5/5 in all 4 extremities
 
VITAL SIGNS: 24 HRS MIN & MAX	LAST
Temp  Min: 97.5 °F (36.4 °C)  Max: 115.9 °F (46.6 °C)	97.5 °F (36.4 °C)
BP  Min: 112/75  Max: 191/108	(!) 148/109
Pulse  Min: 76  Max: 98 	76
Resp  Min: 17  Max: 17	17
SpO2  Min: 90 %  Max: 100 %	(!) 93 %
 
I have reviewed the following labs:
Recent Labs
Lab	10/01/25
0807	10/02/25
0712	10/03/25
0447
WBC	7.04	6.77	6.99
RBC	5.33	5.57	5.53
HGB	16.1	16.6	16.6
HCT	52.7*	54.1*	53.5*
MCV	98.9*	97.1*	96.7*
MCH	30.2	29.8	30.0
MCHC	30.6*	30.7*	31.0*
RDW	15.0	14.6	14.4
PLT	233	230	235
MPV	9.7	9.1	9.5
 
Recent Labs
Lab	10/01/25
0822	10/01/25
2133	10/02/25
0712	10/03/25
0448
NA	143	141	140	138
K	5.1	4.3	4.1	4.4
CL	99	96*	97*	95*
CO2	37*	37*	37*	33*
BUN	33.0*	37.7*	33.5*	37.3*
CREATININE	2.35*	2.84*	2.41*	2.30*
GLU	295*	296*	311*	297*
CALCIUM	9.4	9.1	9.3	8.9
MG	 -- 	1.70	1.80	1.90
ALBUMIN	2.2*	 -- 	2.2*	2.4*
PROT	7.1	 -- 	6.7	7.0
ALKPHOS	75	 -- 	83	85
ALT	14	 -- 	11	13
AST	21	 -- 	19	24
BILITOT	0.4	 -- 	0.5	0.5
 
Microbiology Results (last 7 days) 
 
 	** No results found for the last 168 hours. **
 
 
 
 
See below for Radiology
 
Assessment/Plan:
# Acute on chronic decompensated systolic and diastolic heart failure
# Acute hypoxemic respiratory failure due to above - resolved
# AKI on CKD stage IIIB - improving
# Morbid obesity
# HTN urgency
# Likely OSA
# Poorly controlled T2DM (A1c 12.1)
# Hypothyroidism
 
- continue IV lasix 40 mg BID. Cardiology following. Monitor I's and o's electrolytes. Appreciate input 
               - given low albumin maybe bumex better than lasix but will defer to cardiology
- Dr. Daya informed regarding his 4 sec pause on tele
- will consult nephrology as patient has not followed up with one outpatient
- increase glargine 25 units at night, lispro 6 units TIDAC with ISS
- switched metoprolol to coreg 6.25 mg BID
- continue nifedipine
- other GDMT limited due to CKD
- will need outpatient sleep study; patient unable to have that scheduled after last discharge
- labs in AM
- telemetry monitoring
- Strict I&Os and daily weight
- Monitor and replete lytes, keep K+ >4.0 and Mg >2.0
- continue to hold entresto
 
 
VTE prophylaxis: lovenox
 
Patient condition:  Fair
 
Anticipated discharge and Disposition:   
 
 
All diagnosis and differential diagnosis have been reviewed; assessment and plan has been documented; I have personally reviewed the labs and test results that are presently available; I have reviewed the patients medication list; I have reviewed the consulting providers response and recommendations. I have reviewed or attempted to review medical records based upon their availability
 
All of the patient's questions have been  addressed and answered. Patient's is agreeable to the above stated plan. I will continue to monitor closely and make adjustments to medical management as needed.
 
_____________________________________________________________________
 
Malnutrition Status:
Nutrition consulted. Most recent weight and BMI monitored- 
 
Measurements:
Wt Readings from Last 1 Encounters:
10/03/25	115.9 kg (255 lb 8.2 oz)
Body mass index is 41.24 kg/m².
 
Patient has been screened and assessed by RD.
 
Malnutrition Type:
Context:  
Level: other (see comments) (Does not meet criteria)
 
Malnutrition Characteristic Summary:
Weight Loss (Malnutrition): other (see comments) (Does not meet criteria)
Energy Intake (Malnutrition): other (see comments) (Does not meet criteria)
Fluid Accumulation (Malnutrition): moderate
 
Interventions/Recommendations (treatment strategy):
 
Scheduled Med:
•	atorvastatin	 80 mg	Oral	QHS
•	carvediloL	 6.25 mg	Oral	BID
•	enoxparin	 40 mg	Subcutaneous	Daily
•	insulin glargine U-100	 10 Units	Subcutaneous	QHS
•	levothyroxine	 88 mcg	Oral	Before breakfast
•	NIFEdipine	 30 mg	Oral	Daily
•	polyethylene glycol	 17 g	Oral	Daily
•	senna-docusate	 2 tablet	Oral	BID
 
Continuous Infusions:
 
PRN Meds:
 
Current Facility-Administered Medications: 
•  acetaminophen, 1,000 mg, Oral, Q6H PRN
•  aluminum-magnesium hydroxide-simethicone, 30 mL, Oral, QID PRN
•  bisacodyL, 10 mg, Rectal, Daily PRN
•  dextrose 50%, 12.5 g, Intravenous, PRN
•  dextrose 50%, 25 g, Intravenous, PRN
•  glucagon (human recombinant), 1 mg, Intramuscular, PRN
•  glucose, 16 g, Oral, PRN
•  glucose, 24 g, Oral, PRN
•  hydrALAZINE, 10 mg, Intravenous, Q6H PRN
•  insulin aspart U-100, 0-10 Units, Subcutaneous, QID (AC + HS) PRN
•  melatonin, 6 mg, Oral, Nightly PRN
•  naloxone, 0.02 mg, Intravenous, PRN
•  ondansetron, 4 mg, Intravenous, Q4H PRN
•  prochlorperazine, 5 mg, Intravenous, Q6H PRN
•  senna-docusate, 1 tablet, Oral, BID PRN
•  sodium chloride 0.9%, 10 mL, Intravenous, PRN 
 
Radiology:
I have personally reviewed the following imaging and agree with the radiologist. 
 
X-Ray Chest AP Portable
Narrative: EXAMINATION:
Chest one view
 
CLINICAL HISTORY:
Shortness of breath
 
COMPARISON:
06/28/2025
 
FINDINGS:
There is stable cardiac enlargement.  There is central vascular congestion noted.  No consolidation or confluent airspace disease.  No visible pneumothorax or pleural effusion
Impression: Cardiac enlargement with central vascular congestion.
  `,

  `64 year old male with history of Paroxysmal AFib and Orthostatic hypotension who presents from Allentown CC

Interval History:
Patient seen and examined; chart, nursing notes, and telemetry reviewed.

Mr. Doe is a pleasant 64M with a history of paroxysmal afib managed on Eliquis and Metoprolol, who initially presented to PMC 2 days ago after experiencing 2 syncopal episodes while sitting. These episodes, which lasted only a few seconds, were associated with lightheadedness and occurred without diaphoresis or prior chest pain. Notably, the patient has a history of orthostatic hypotension and has experienced similar episodes in the past.

Yesterday, patient successfully underwent a repeat DCCV for atrial fibrillation and the patient converted to normal sinus rhythm. patient has been monitored on telemetry, showing no further episodes of atrial fibrillation or atrial flutter. A carotid doppler was conducted and showed significant stenosis in left internal carotid artery necessitating vascular consultation. patient was evaluated by Dr. Miller from the Vascular Surgery service who recommends carotid stenting, which patient is scheduled for next week.
 
Yesterday evening he had no anginal chest pain, no dyspnea on exertion, no orthopnea, and no pnd. He was tolerating oral intake without difficulty, and he was in no respiratory distress. Vital signs and hemodynamics as documented in the EMR have been stable and reassuring and his physical exam has been unremarkable. Telemetry has revealed NSR. No acute labs were drawn overnight. Imaging includes Echocardiogram (2025-01-13), CT head (2025-01-11), and CXR (2025-01-11).

Vitals - 
|Vital Sign | 01/13/25 0600| 01/13/25 1030| 01/13/25 1300| 01/13/25 1600|
|------------|----------|---------|---------|----------|
|BP | 117/73 | 119/75 | 123/72 | 121/71 |
|HR | 68 | 62 | 71 | 69 |
|RR | 17 | 17 | 17 | 18 |
|SpO2 | 96% on RA | 98% on RA | 96% on RA | 98% on RA |
|Temp |97.9 F |98.1 F |97.8 F |97.7 F |

Laboratory Data
|Labs (units) |01/11 | 01/12| 01/13|
|------|---------|-------|----------|
|WBC (K/uL) |6.8 |7.1 |6.9 |
|Hgb (g/dL) |13.2 |13.5 |13.4 |
|Hct (%) |39.6 |40.4 |40.1 |
|Platelet (K/uL) |178 |185 |181 |
|Sodium (mEq/L) |139 |140 |139 |
|Potassium (mEq/L) |4.1 |4.0 |4.2 |
|Chloride (mEq/L) |103 |104 |103 |
|Bicarb (mEq/L) |24 |25 |24 |
|BUN (mg/dL) |18 |17 |18 |
|Creatinine (mg/dL) |1.0 |1.0 |1.0 |
|Glucose (mg/dL) |102 |98 |105 |
|Calcium (mg/dL) |9.2 |9.4 |9.3 |
|Magnesium (mg/dL) |2.1 |2.0 |2.1 |
|TSH (mIU/L) |2.34 | | |
|Free T4 (ng/dL) |1.12 | | |
|Troponin (ng/mL) |<0.01 |<0.01 |<0.01 |
|BNP (pg/mL) |52 | | |

Imaging/Results:

CT head without contrast (01/11/2025): No acute intracranial abnormality. No evidence of hemorrhage, mass effect, or midline shift. Age-appropriate cerebral volume loss.

Echocardiogram (01/13/2025): Normal left ventricular systolic function with LVEF 55-60%. Mild left atrial enlargement. No significant valvular abnormalities. No pericardial effusion.

Carotid Doppler (01/12/2025): 
- Right ICA: <50% stenosis
- Left ICA: 70-79% stenosis
- Right vertebral artery: Antegrade flow
- Left vertebral artery: Antegrade flow

CXR (01/11/2025): Clear lungs. Normal cardiac silhouette. No acute cardiopulmonary process.

Home Medications (confirmed with patient and pharmacy):
1. Eliquis 5mg PO BID
2. Metoprolol succinate 50mg PO daily
3. Atorvastatin 40mg PO daily
4. Aspirin 81mg PO daily (patient takes in addition to Eliquis)
5. Lisinopril 10mg PO daily
6. Omeprazole 20mg PO daily

Active Medications:
1. Eliquis 5mg PO BID
2. Metoprolol succinate 50mg PO daily
3. Atorvastatin 40mg PO daily
4. Aspirin 81mg PO daily
5. Lisinopril 10mg PO daily (held this AM due to concern for orthostatic hypotension)
6. Omeprazole 20mg PO daily
7. Heparin 5000 units SQ Q8H (DVT prophylaxis while hospitalized)

Assessment/Plan:

64M with paroxysmal AFib s/p successful DCCV now in NSR, syncopal episodes likely secondary to orthostatic hypotension, found to have significant left ICA stenosis.

1. Syncope: Most likely secondary to orthostatic hypotension given patient's history and presentation. Alternative considerations included arrhythmia (less likely given afib rate controlled and patient now in NSR post-DCCV), structural cardiac disease (ruled out by echo), and carotid stenosis (may contribute but less likely primary cause). 
   - Continue current beta blocker dosing
   - Holding lisinopril for now given orthostatic concerns
   - Encourage adequate hydration
   - Patient educated on slow positional changes
   - Physical therapy consult for gait/transfer assessment

2. Paroxysmal Atrial Fibrillation: Patient underwent successful DCCV yesterday and has maintained NSR on telemetry.
   - Continue Eliquis 5mg BID for stroke prevention (CHA2DS2-VASc = 2)
   - Continue Metoprolol succinate 50mg daily for rate control
   - Telemetry monitoring - will discontinue if remains in NSR today
   - Patient counseled on importance of medication compliance

3. Carotid Stenosis: Left ICA with 70-79% stenosis, asymptomatic.
   - Vascular surgery evaluated - plan for left carotid artery stenting as outpatient next week
   - Continue aspirin 81mg and atorvastatin 40mg
   - Patient will follow up with Dr. Miller in vascular surgery clinic

4. Prophylaxis:
   - DVT: Therapeutic anticoagulation with Eliquis
   - GI: Omeprazole 20mg daily
   - Fall precautions given syncope history

Anticipated discharge and Disposition:
Planning discharge to home today if patient remains stable. Patient lives with wife who is able to assist. Home health services not needed at this time. Patient has follow-up arranged with:
- Primary care physician Dr. Johnson in 1 week
- Cardiology Dr. Smith in 2 weeks
- Vascular surgery Dr. Miller in 1 week for pre-procedure evaluation

Discharge instructions provided regarding medication changes (holding lisinopril), importance of slow positional changes, hydration, and warning signs requiring immediate medical attention.
  `,

  `Brief HPI/Hospital Course: 
Patient is a 39 yo male, unknown to CIS, who presented to the ED today with c/o SOB x1 month. Patient reports he was told around the time symptoms began, during a health screening, that he was in afib, however due to insurance issues he has not followed up with PCP or cardiology. Additionally patient reports being prescribed Metoprolol and ASA when he was seen in an outlying facility in July following involvement in MVC. States he has been noncompliant with these medications. On arrival patient was found to be in Afib w/ RVR rate of 196. Adenosine 6mg-->12mg given with no effect on rate, IV lopressor x 4 doses reduced heart rate to 120s, he was started on Cardizem gtt at that time. ED workup revealed ProBNP 7,149, HS troponin 36, Cr 1.31. Patient admitted to cardiology service for further care. 
 
Hospital Course: 
10.21.25 Due to his condition the patient was admitted to the ICU for management of possible cardiogenic shock in AFib with RVR this AM. Reportedly worsening SOB overnight with hypotension. Dobutamine, Levophed, and Heparin gtts infusing. Afib w/ RVR persists with rate in 130s. Will give dose of IV digoxin. Will undergo R/LHC today. 
 
PMH: denies 
PSH: denies 
Family History: unknown 
Social History: Current everyday smoker, denies ETOH use; reports previous use of Mojo as recently has July, denies current use. 
 
Previous Cardiac Diagnostics: 
TTE 10.20.25
Left Ventricle: The left ventricle is severely dilated. Increased wall thickness. Severe global hypokinesis is present. There is severely reduced systolic function with a visually estimated ejection fraction of 15 - 20%.
Right Ventricle: The right ventricle is dilated measuring 3.6 cm. Systolic function is severely reduced.
Left Atrium: The left atrium is severely dilated.
Right Atrium: The right atrium is severely dilated.
Mitral Valve: Mildly thickened leaflets. There is moderate regurgitation.
Tricuspid Valve: There is moderate regurgitation.
Pulmonic Valve: There is mild regurgitation.
IVC/SVC: Elevated venous pressure at 15 mmHg.
 
Review of Systems 
Constitutional: Positive for malaise/fatigue. 
Cardiovascular:  Positive for dyspnea on exertion, irregular heartbeat and palpitations. Negative for chest pain. 
Respiratory:  Positive for shortness of breath.  

Objective:
 
Vital Signs (Most Recent):
Temp: 97.5 °F (36.4 °C) (10/21/25 0715)
Pulse: (!) 129 (10/21/25 0854)
Resp: 19 (10/21/25 0745)
BP: (!) 123/59 (10/21/25 0854)
SpO2: 99 % (10/21/25 0745)	Vital Signs (24h Range):
Temp:  [97.5 °F (36.4 °C)-97.9 °F (36.6 °C)] 97.5 °F (36.4 °C)
Pulse:  [75-226] 129
Resp:  [13-46] 19
SpO2:  [63 %-100 %] 99 %
BP: (90-176)/(59-119) 123/59
Arterial Line BP: (83-131)/(51-78) 130/61
Weight: 106.4 kg (234 lb 9.1 oz)
Body mass index is 30.95 kg/m².
SpO2: 99 %
 
Intake/Output Summary (Last 24 hours) at 10/21/2025 0901
Last data filed at 10/21/2025 0730
Gross per 24 hour
Intake	2260.38 ml
Output	650 ml
Net	1610.38 ml
 
Lines/Drains/Airways 
 
 	
Arterial Line 	Duration
  
 	Arterial Line 10/21/25 0230 Left Brachial	<1 day
 
Peripheral Intravenous Line 	Duration
 
 	Peripheral IV 10/20/25 0948 18 G Right Antecubital	<1 day
 	Peripheral IV Single Lumen 10/20/25 1950 20 G Anterior;Distal;Left Upper Arm	<1 day
 	Peripheral IV Single Lumen 10/21/25 0000 20 G Long PIVC Anterior;Left Forearm	<1 day
 
Significant Labs: 
Chemistries:
Recent Labs
Lab	10/20/25
1006	10/21/25
0203	10/21/25
0533
NA	136	135*	132*
K	3.9	4.2	4.2
CL	101	102	101
CO2	23	7*	9*
BUN	13.7	19.7	22.9*
CREATININE	1.31*	1.96*	2.04*
CALCIUM	9.0	8.3*	7.6*
PROT	7.8	6.8	5.7*
BILITOT	1.7*	3.0*	2.5*
ALKPHOS	133	125	111
ALT	19	210*	860*
AST	65*	391*	1,801*
MG	 -- 	2.60	 -- 

 
CBC/Anemia Labs:	Coags: 
Recent Labs
Lab	10/20/25
1006	10/21/25
0107
WBC	11.96*	17.74*
HGB	16.9	18.1*
HCT	48.7	59.4*
PLT	289	213
MCV	94.9*	105.7*
RDW	16.3	17.3*
	
Recent Labs
Lab	10/20/25
1006	10/21/25
0108
INR	1.1	1.6*
APTT	26.4	20.1*

 
Telemetry:  Afib w/ RVR
 
Physical Exam
Vitals and nursing note reviewed. 
Constitutional:  
   Appearance: He is ill-appearing. 
HENT: 
   Head: Atraumatic. 
Cardiovascular: 
   Rate and Rhythm: Tachycardia present. Rhythm irregular. 
   Pulses: Normal pulses. 
Pulmonary: 
   Effort: Respiratory distress present. 
Musculoskeletal: 
   Cervical back: Neck supple. 
   Right lower leg: No edema. 
   Left lower leg: No edema. 
Skin:
   General: Skin is warm and dry. 
Neurological: 
   General: No focal deficit present. 
   Mental Status: He is alert and oriented to person, place, and time. Mental status is at baseline. 

Current Schedule Inpatient Medications:
•	aspirin	 81 mg	Oral	Daily
•	digoxin	 250 mcg	Intravenous	Once
•	folic acid	 1 mg	Oral	Daily
•	metoprolol tartrate	 25 mg	Oral	BID
•	piperacillin-tazobactam (Zosyn) IV (PEDS and ADULTS) (extended infusion is not appropriate)	 4.5 g	Intravenous	Q8H
•	thiamine (B-1) injection	 100 mg	Intravenous	Daily
•	vancomycin (VANCOCIN) 1,000 mg in D5W 250 mL IVPB (admixture device)	 1,000 mg	Intravenous	Once
 	Followed by
•	vancomycin (VANCOCIN) 1,000 mg in D5W 250 mL IVPB (admixture device)	 1,000 mg	Intravenous	Once
 
Continuous Infusions:
•	dilTIAZem	 0-15 mg/hr	Intravenous	Continuous	 	Stopped at 10/20/25 2254
•	DOBUTamine IV infusion (titrating)	 0-20 mcg/kg/min (Dosing Weight)	Intravenous	Continuous	16.3 mL/hr at 10/21/25 0700	10 mcg/kg/min at 10/21/25 0700
•	heparin (porcine) in D5W	 0-40 Units/kg/hr	Intravenous	Continuous	19.6 mL/hr at 10/21/25 0700	18 Units/kg/hr at 10/21/25 0700
•	NORepinephrine bitartrate-D5W	 0-3 mcg/kg/min (Dosing Weight)	Intravenous	Continuous	20.4 mL/hr at 10/21/25 0700	0.1 mcg/kg/min at 10/21/25 0700
•	sodium bicarbonate 150 mEq in D5W 1,000 mL infusion	 	Intravenous	Continuous	75 mL/hr at 10/21/25 0700	Rate Verify at 10/21/25 0700
 
 
Assessment:
 
Atrial fibrillation, unspecified, w/ RVR
  -CHADsVASc - 1 Points - 0.6% Stroke Risk per Year
Suspected cardiogenic vs septic shock
  -R/LHC 10.21.25
  -Lactic acid 13.3
  -TTE 10.20.25 EF 15-20%
  -Dobutamine and Levophed 
Cardiomyopathy
SOB
Elevated Troponin, d/t afib w/ RVR
  -HS troponin 36->30->32->35->74->95
Elevated BNP
  -NT-ProBNP 7,149
  -TTE 10.20.25 EF 15-20%
AKI 
Ischemic hepatitis congestive hepatopathy 
Metabolic acidosis 
 
Plan:
 
Cardizem gtt discontinued
Continue Heparin gtt per protocol
Give digoxin 250mcg IV once 
Will plan for R/LHC today
Risk, benefits and alternatives reviewed and discussed with the patient and their family and they wish to proceed with above procedure. 
Consent obtained and placed on chart
NPO since midnight
Will consider possible TEE w/ DCCV pending heart cath findings
  `,

  `HPI: Mr. Hebert is a 68 y/o male who is known to CIS, Dr. Lindsey, with the past medical history hypertension, hyperlipidemia, MI, CVA, BPH, PAF, BPH, coronary artery disease, cardiac arrest, renal cyst, CAD.  Who presented to the emergency room on 10/09/2025 from Magnolia Estates nursing home due to oral bleeding which began in the morning.  Patient also had bloody sputum.  Patient's neurological baseline is a GCS of 3 with a trach and vent dependent.  Patient was found to be in AFib RVR in the emergency room.  ER workup revealed elevated BNP of 5423, initial high sensitivity troponin 5, UA suggestive of UTI, EKG showed atrial fibrillation with a rate of 130, no ST segment elevations normal T-waves, normal axis.  Chest x-ray suggestive of pneumonia versus infiltrate.  There is blunting of the right costophrenic angle.  Patient started on Cardizem drip.  Patient admitted to the ICU for acquiring mg dose Cardizem as well as chronic trach and vent if patient.  CIS was been consulted for further evaluation and management of atrial fibrillation with RVR.
 
 10.13.25: Re-consulted for possible TTE/TEE  at the request of Infectious Disease
 
PMH: Arthritis, AF, BPH, Cardiac Arrest, CAD, Renal Cyst, Diverticulosis, Hyperlipidemia, Hypertension, MI, Obesity, Lever Steatosis, Stroke
PSH: Pacemaker, LHC, Colonoscopy, EGD, Colon Excision, Tracheostomy
Family History: Mother - HTN; Sister - HTN; Brother - HTN 
Social History: Tobacco - Negative, Alcohol - Negative, Substance Abuse - Negative

Previous Cardiac Diagnostics: 
Echocardiogram (10.22.24):
Left Ventricle: The left ventricle is normal in size. Mildly increased wall thickness. There is normal systolic function with a visually estimated ejection fraction of 65%. Grade I diastolic dysfunction.
Right Ventricle: Normal right ventricular cavity size. Systolic function is normal.
Aortic Valve: There is mild aortic valve sclerosis.
Mitral Valve: There is mild (1+) regurgitation.
Tricuspid Valve: There is mild (1+) regurgitation.
The estimated pulmonary artery systolic pressure is 21 mmHg.
AICD/pacemaker lead noted.  No evidence of vegetation noted.
No evidence of valvular endocarditis noted.  If clinical suspicion is high would recommend transesophageal echocardiogram.
 
Echocardiogram (5.3.24):
EF 65%
RV with Normal RV Function.
MR- Mild. TR- Mild. 
Pericardial Effusion- None. Anterior Fat Pad Noted. 
 
ECHO (1.15.24):
TDS. No Definity contrast available for use. Left Ventricle: The left ventricle is normal in size. Moderately increased wall thickness. Normal wall motion. There is normal systolic function. Ejection fraction by visual approximation is 55%. Right Ventricle: Normal right ventricular cavity size. Systolic function is borderline low. Left Atrium: Left atrium is severely dilated. Right Atrium: Right atrium is mildly dilated. Mitral Valve: There is bileaflet sclerosis. There is mild regurgitation. IVC/SVC: Normal venous pressure at 3 mmHg.
 
Venous US LUE (12.26.23):
There was no evidence of deep vein thrombosis in the left upper extremity. 
A superficial thrombosis was identified in the left cephalic vein. 
 
Carotid US (12.19.23):
The right internal carotid artery demonstrated less than 50% stenosis.
The left internal carotid artery demonstrated less than 50% stenosis.
The bilateral vertebral arteries were patent with antegrade flow.
Bilateral internal carotid arteries demonstrated decreased velocities starting from the common carotid arteries. 
 
LHC (5.25.18): 
LM: Normal. Normal size and bifurcation. LAD: Abnormal. Large, mild atherosclerotic plaque, moderately large diagonals. Mid LAD 30% stenosis. The lesion was tubular and eccentric. LCX: abnormal and Large, mild atherosclerotic plaque, large OM with mild narrowing.OM 1 35% stenosis. RCA: normal. Large and no significant disease. 
 
 
Review of Systems 
Reason unable to perform ROS: acquity of illness. 

Objective:
 
Vital Signs (Most Recent):
Temp: 98.5 °F (36.9 °C) (10/13/25 0800)
Pulse: 75 (10/13/25 1145)
Resp: 20 (10/13/25 1145)
BP: (!) 170/106 (10/13/25 1130)
SpO2: 100 % (10/13/25 1145)	Vital Signs (24h Range):
Temp:  [97.9 °F (36.6 °C)-99.3 °F (37.4 °C)] 98.5 °F (36.9 °C)
Pulse:  [67-147] 75
Resp:  [10-38] 20
SpO2:  [93 %-100 %] 100 %
BP: (119-170)/(83-117) 170/106
Weight: 66.8 kg (147 lb 4.3 oz)
Body mass index is 23.07 kg/m².
SpO2: 100 %
 
Intake/Output Summary (Last 24 hours) at 10/13/2025 1231
Last data filed at 10/13/2025 1000
Gross per 24 hour
Intake	2153.42 ml
Output	1345 ml
Net	808.42 ml
 
Lines/Drains/Airways 
 
 	
Peripherally Inserted Central Catheter Line 	Duration
 
 	PICC Triple Lumen 10/13/25 1109 right brachial	<1 day
 
Drain 	Duration
 
 	     Gastrostomy/Enterostomy 10/30/24 1200 Gastrostomy-jejunostomy feeding	348 days
 	     Urethral Catheter 10/09/25 1330 Non-latex	3 days
 
Airway 	Duration
 
 	Adult Surgical Airway 10/01/25 1110 Shiley Cuffed 6.0/ 75mm	12 days
 
Peripheral Intravenous Line 	Duration
 
 	Peripheral IV Single Lumen 10/09/25 0755 20 G 2 1/4 in Left;Posterior Wrist	4 days
 	Peripheral IV Single Lumen 10/12/25 2300 20 G Right Other	<1 day
 
Significant Labs: 
Chemistries:
Recent Labs
Lab	10/10/25
1319	10/11/25
0317	10/12/25
0444	10/13/25
0301	10/13/25
0528
NA	141	141	141	141	140
K	3.0*	3.0*	3.0*	2.4*	3.5
CL	108*	111*	111*	122*	112*
CO2	22*	19*	21*	11*	19*
BUN	14.2	14.5	10.7	7.1*	9.6
CREATININE	0.53*	0.55*	0.52*	0.32*	0.46*
CALCIUM	8.2*	8.6*	8.5*	5.0*	8.3*
PROT	7.1	7.3	7.2	4.0*	6.9
BILITOT	1.2	1.1	1.3	0.7	1.1
ALKPHOS	70	69	66	36*	61
ALT	8	7	7	<5	6
AST	16	18	15	10*	21
MG	2.10	2.20	2.00	1.20*	2.00
PHOS	2.9	3.2	2.6	1.6*	2.8

 
CBC/Anemia Labs:	Coags: 
Recent Labs
Lab	10/11/25
0317	10/12/25
0444	10/13/25
0427
WBC	5.70	7.24	4.56
HGB	8.7*	8.3*	8.2*
HCT	28.7*	28.8*	27.2*
PLT	250	245	239
MCV	82.0	85.5	83.2
RDW	17.2*	17.2*	16.9
	
Recent Labs
Lab	10/09/25
0804
INR	1.4*

 
Telemetry:  Persistent A-fib, rate controlled
 
Physical Exam
Vitals and nursing note reviewed. 
Cardiovascular: 
   Rate and Rhythm: Normal rate. Rhythm irregular. 
   Pulses: Normal pulses. 
   Heart sounds: Normal heart sounds. 
Pulmonary: 
   Effort: Pulmonary effort is normal. 
   Breath sounds: Normal breath sounds. 
   Comments: Trach, on ventilator
Neurological: 
   Mental Status: Mental status is at baseline. 
   Comments: GCS 3 

 
 
Current Schedule Inpatient Medications:
•	apixaban	 5 mg	Per G Tube	BID
•	famotidine (PF)	 20 mg	Intravenous	Daily
•	meropenem IV (PEDS and ADULTS)	 1 g	Intravenous	Q8H
•	metoprolol tartrate	 50 mg	Per G Tube	BID
•	mupirocin	 	Nasal	BID
 
Continuous Infusions:
•	0.9% NaCl	 	Intravenous	Continuous	50 mL/hr at 10/13/25 1000	Rate Verify at 10/13/25 1000
 
 
Assessment:
Sepsis
-- Positive Respiratory Culture for Pseudomonas (resistant to all antibiotics), Serratia, Proteus and Klebsiella (ESBL) 
--History of positive blood cultures for Staph Epi and Enterococcus
--Latest blood cultures negative
Pneumonia 
-- Positive Respiratory Culture for Pseudomonas (resistant to all antibiotics), Serratia, Proteus and Klebsiella (ESBL) 
-- On Cefepime and Merrem
Chronic Hypoxemic Respiratory Failure requiring Tracheostomy/Ventilation
Persistent AF (controlled)
  - CHA2DS2VASC Score 4 (4.8% Stroke Risk per Year) 
  - BNP 5423
  - Initial HS Troponin 5
  -  On Eliquis
UTI (Chronic)
CAD
  - LHC (5.25.18): LM: Normal. Normal size and bifurcation. LAD: Abnormal. Large, mild atherosclerotic plaque, moderately large diagonals. Mid LAD 30% stenosis. The lesion was tubular and eccentric. LCX: abnormal and Large, mild atherosclerotic plaque, large OM with mild narrowing.OM 1 35% stenosis. RCA: normal. Large and no significant disease.  
  - ECHO (10.22.24) - LVEF 65%; DD I
SSS
  - Dual Chamber ICD
HTN 
Hyperlipidemia
Anemia - Stable 
History of Hemorrhagic CVA (12/2023)
  - Residual Left Sided Deficits
  - S/P Peg Tube and Trach 
Arthritis
Dysphagia
  - s/p PEG 
History of Seizure Disorder
Liver Steatosis
Diverticulosis
BPH
Depression
Obesity 
Severe PCM 
No Known History of GIB
 
 
Plan:
Obtain TTE today
Will evaluate for TEE tomorrow
Antibiotics per Infectious disease
Vent management per Pulmonary/Critical Care
  `,

  `HPI: 64 year old, unknown to CIS, who presented to UHC on 10.7.25 with c/o of SOB and sharp chest pain. He stated that he has been coughing up black sputum for the past few days. He has a hx of HTN, tobacco dependence, chronic cough, headaches, GERD and hx of gastric ulcer. Upon workup, his HS troponin was 19,413, pro BNP was 12,028. EKG revealed NSR with ST wave abnormalities in the inferolateral leads, CTA of the chest/abd revealed AAA of 5.4 cm with extension to the common iliac arteries bilaterally with a large ulcerating plaque in the common iliac artery on the left. Echo revealed an EF of 24%. CIS was consulted for ACS.
 
Hospital Course:
10/9/25: LHC done yesterday- seen by CVSx and turned down but family spoke with Dr. Allam and asked for 2nd opinion and he will evaluate today. Reports an episode of CP this am. Case discussed with Dr. Ruiz; if turned down for surgery may consider high risk PCI.
10.10.25: NAD, AFVSS. Denies CP/SOB/palps. Heparin gtt continues. 
10.11.25: NAD. VSS. Denies CP, SOB and Palps. Heparin Drip per Protocol.
10.12.25: NAD. VSS. Denies CP, SOB and Palps. Remains on Heparin Drip per Protocol. Plans for CABG/Impella Tomorrow with CV Surgery.
10.13.25: NAD, AFVSS. S/p 2v CABG/impella today. CT x2 in place. Bicarb gtt infusing. SR in 70s monitor. Nurse at bedside. 
10.14.25: POD #1 s/p 2v CABG/impella. NAD, marginal hypotension, not requiring pressors, otherwise VSS. Patient extubated yesterday afternoon, tolerating well. +CT x2. Heparin gtt and insulin gtt infusing. 
10.15.25: POD #2, WBC elevated, H&H stable, PLTs stable. Impella remains in place.
10.16.25: POD #3: Had AF with RVR yesterday afternoon. Overnight he had what appeared to be VT. Patient performed Vagal maneuvers and converted with no further intervention required.
10.17.25: POD #4: Patient had VT arrest yesterday, received multiple shocks. Also had recurrence of VT overnight that required defibrillation. Impella at P6 for support. Still on Amiodarone, Epi, and Lasix drips.
10.18.25: NAD. POD #5. Impella Axillary Right/P6. Amiodarone 0.5mcg/kg/min, Hep per Protocol
10.19.25: NAD. POD #6. Axillary Impella P6, Amiodarone 0.5mg/min. Heparin per Protocol. PLT 141, H&H 8.4/25.4. Na 135, K 3.4, BUN/Crea 58.9/2.83
10.20.25:POD #7. Axillary Impella remains at P6. Remains on Amio and Heparin. Renal indices stable but elevated. Having some ectopy and NSVT overnight.
10.21.25: Having runs of SVT this AM, initially resolved spontaneously but had repeat event that terminated after 6 and 12mg of Adenosine. Dr. Allam removed Impella at Bedside. Patient had to be placed on BiPAP this AM. 
 
PMH: Acute systolic HF, HTN, Tobacco dependence, chronic cough, headaches, GERD and hx of gastric ulcer. 
PSH: Unknown
Family History: Unknown
Social History: Tobacco dependence
 
Previous Cardiac Diagnostics:
CABG 10.13.25
Right axillary artery cutdown with placement of graft and Impella 5.5 catheter under fluoroscopy and echo guidance.
Coronary artery bypass grafting x2, left internal mammary artery to the LAD, saphenous venous graft to OM2.
Endoscopic venous harvesting left greater saphenous vein.
Ligation of left atrial appendage.
Placement of right common femoral artery line.
 
Limited TTE 10.13.25
Limited study to assess Impella placement. Impella inflow cannula appears to measure at least 5.4cm from the aortic annulus.
Left Ventricle: There is severely reduced systolic function with a visually estimated ejection fraction of 20 - 25%.
 
Limited TTE 10.12.25
Limited echo for LVEF.
Left Ventricle: The left ventricle is severely dilated. Increased wall thickness. Regional wall motion abnormalities and Global hypokinesis is present. There is severely reduced systolic function with a visually estimated ejection fraction of 20 - 25%.
 
Carotid US 10.9.25
The right internal carotid artery is patent with less than 50% stenosis.
The left internal carotid artery is patent with no evidence of stenosis.
Bilateral vertebral arteries are patent with antegrade flow.
 
LHC 10.8.25
Findings
Left main normal
LAD 100% occluded with rest of the vessel filling from left-to-left collaterals
Right coronary artery 100% occluded with left-to-right collaterals filling the rest of the artery
Circumflex has got a 80% stenosis in the mid section before the OM2.  It gives rise to a robust OM1
 
TTE 10.8.25
Left Ventricle: The left ventricle is moderately dilated. Severely increased ventricular mass. Mildly increased wall thickness. There is severe eccentric hypertrophy. Regional wall motion abnormalities is present. See diagram for wall motion findings.  Anteroseptal, inferoseptal and apical akinesis. There is severely reduced systolic function. Quantitated ejection fraction is 24%. Light spontaneous echo contrast visualized. Grade II diastolic dysfunction.
Right Ventricle: The right ventricle is normal in size. Systolic function is normal.
Left Atrium: The left atrium is severely dilated measuring 67 mL/m2.
Right Atrium: The right atrium is mildly dilated.
Aortic Valve: The aortic valve is a trileaflet valve. There is no stenosis. There is no significant regurgitation.
Mitral Valve: The mitral valve is structurally normal. There is no stenosis. There is mild regurgitation.
Tricuspid Valve: There is trace regurgitation.
Pulmonic Valve: There is mild regurgitation.
Aorta: The aortic root is normal in size measuring 3.1 cm.
Pulmonary Artery: No pulmonary hypertension. The estimated pulmonary artery systolic pressure is 27 mmHg.
IVC/SVC: Intermediate venous pressure at 8 mmHg.
 
Review of Systems 
Constitutional: Positive for malaise/fatigue. Negative for fever. 
Cardiovascular:  Positive for chest pain (Compression/Incisional). Negative for irregular heartbeat and palpitations. 
Respiratory:  Negative for shortness of breath.  

Objective:
 
Vital Signs (Most Recent):
Temp: 97.7 °F (36.5 °C) (10/21/25 0800)
Pulse: (!) 137 (10/21/25 1023)
Resp: (!) 23 (10/21/25 1023)
BP: 100/78 (10/21/25 1023)
SpO2: 98 % (10/21/25 1023)	Vital Signs (24h Range):
Temp:  [97.6 °F (36.4 °C)-98.2 °F (36.8 °C)] 97.7 °F (36.5 °C)
Pulse:  [67-279] 137
Resp:  [16-34] 23
SpO2:  [84 %-100 %] 98 %
BP: (84-139)/(64-94) 100/78
Arterial Line BP: (70-175)/(44-83) 129/66
Weight: 66.1 kg (145 lb 12.8 oz)
Body mass index is 21.53 kg/m².
SpO2: 98 %
 
Intake/Output Summary (Last 24 hours) at 10/21/2025 1100
Last data filed at 10/21/2025 1052
Gross per 24 hour
Intake	3072.03 ml
Output	1585 ml
Net	1487.03 ml
 
Lines/Drains/Airways 
 
Central Venous Catheter Line 	Duration
  	 
 	 Introducer with Double Lumen 10/13/25 Internal Jugular Right	8 days
 
Drain 	Duration
 
 	     Chest Tube 10/13/25 Left Pericardial 24 Fr.	8 days
 	     Chest Tube 10/13/25 Mediastinal 28 Fr.	8 days
 	     Urethral Catheter 10/17/25 1625	3 days
 
Arterial Line 	Duration
 
 	Arterial Line 10/16/25 2245 Left Radial	4 days
 
Line 	Duration
 
 	     Pacer Wires 10/13/25	8 days
 	     VAD 10/13/25 Left ventricular assist device Impella	8 days

Peripheral Intravenous Line 	Duration
 
 	Peripheral IV Single Lumen 10/13/25 1500 18 G Left Forearm	7 days
 	     Sheath 10/17/25 1549 Right proximal;anterior	3 days
 
 
Significant Labs: 
Chemistries:
Recent Labs
Lab	10/17/25
0305	10/17/25
1734	10/18/25
0102	10/19/25
0220	10/20/25
0252	10/20/25
1846	10/21/25
0305
NA	135*	  < >	134*	135*	134*	135*	135*
K	4.1	  < >	4.0	3.4*	3.9	3.8	3.8
CL	101	  < >	103	101	102	103	102
CO2	24	  < >	24	23	23	22*	22*
BUN	55.8*	  < >	57.8*	58.9*	57.5*	49.9*	44.0*
CREATININE	2.28*	  < >	2.79*	2.83*	2.71*	2.58*	2.37*
CALCIUM	8.0*	  < >	8.4*	8.4*	8.6*	8.6*	8.4*
PROT	 -- 	 -- 	 -- 	5.2*	5.6*	5.4*	5.4*
BILITOT	 -- 	 -- 	 -- 	0.9	0.9	0.8	0.9
ALKPHOS	 -- 	 -- 	 -- 	90	103	96	109
ALT	 -- 	 -- 	 -- 	34	48*	41	41
AST	 -- 	 -- 	 -- 	49*	60*	49*	47*
MG	2.70*	  < >	2.80*	2.40	2.10	1.90	2.20
PHOS	4.5	 -- 	3.1	3.5	 -- 	 -- 	 -- 
 < > = values in this interval not displayed.

 
CBC/Anemia Labs:	Coags: 
Recent Labs
Lab	10/19/25
0220	10/20/25
0252	10/21/25
0305
WBC	13.40*	15.99*	17.73*
HGB	8.4*	9.1*	9.0*
HCT	25.4*	27.7*	27.1*
PLT	141	161	163
MCV	86.7	86.0	85.8
RDW	15.4	14.9	15.0
	No results for input(s): "PT", "INR", "APTT" in the last 168 hours.
 
 
PAP: (28-36)/(12-14) 28/12
PAP (Mean):  [19 mmHg-23 mmHg] 19 mmHg
CO:  [4 L/min-8 L/min] 8 L/min
CI:  [2.2 L/min/m2-4.5 L/min/m2] 4.5 L/min/m2
 
Telemetry: SR
 
Physical Exam
Constitutional:  
   General: He is not in acute distress.
   Appearance: He is ill-appearing. 
HENT: 
   Head: Normocephalic. 
Eyes: 
   Extraocular Movements: Extraocular movements intact. 
Cardiovascular: 
   Rate and Rhythm: Regular rhythm. Bradycardia present. 
Pulmonary: 
   Effort: Pulmonary effort is normal. No respiratory distress. 
   Breath sounds: Normal breath sounds. 
   Comments: NC O2
Skin:
   General: Skin is warm. 
   Coloration: Skin is pale. 
   Comments: Midline Sternotomy Dressing C/D/I. + CTs 
Neurological: 
   Mental Status: He is alert. 
   Comments: Generalized Weakness 
Psychiatric:    
   Mood and Affect: Mood normal. 


Current Schedule Inpatient Medications:
•	fentaNYL	 	 	 
•	NORepinephrine 8 mg	 	 	 
•	adenosine	 	 	 
•	adenosine	 	 	 
•	aspirin	 81 mg	Oral	Daily
•	atorvastatin	 80 mg	Oral	QHS
•	budesonide	 0.25 mg	Nebulization	Daily
•	ceFEPime IV (PEDS and ADULTS)	 1 g	Intravenous	Q12H
•	docusate sodium	 100 mg	Oral	BID
•	famotidine (PF)	 20 mg	Intravenous	Daily
•	fentaNYL	 50 mcg	Intravenous	Once
•	folic acid	 1 mg	Oral	Daily
•	heparin (porcine) 4,000 Units in 0.9% NaCl 1,000 mL	 	Intra-arterial	Once
•	levalbuterol	 0.31 mg	Nebulization	Q8H
•	magnesium sulfate 2 g IVPB	 2 g	Intravenous	Once
•	sucralfate	 1 g	Oral	QID (AC & HS)
•	vancomycin (VANCOCIN) IV (PEDS and ADULTS)	 20 mg/kg	Intravenous	Once
 
Continuous Infusions:
•	amiodarone in dextrose 5%	 0.5 mg/min	Intravenous	Continuous	16.7 mL/hr at 10/21/25 0632	0.5 mg/min at 10/21/25 0632
•	EPINEPHrine	 0-2 mcg/kg/min	Intravenous	Continuous	 	Stopped at 10/18/25 0546
•	heparin (porcine) in 5 % dex	 7 Units/kg/hr (Adjusted)	Intravenous	Continuous	17 mL/hr at 10/21/25 0829	1,700 Units/hr at 10/21/25 0829
•	LIDOcaine	 1 mg/min	Intravenous	Continuous	 	Stopped at 10/17/25 2357
•	loperamide	 2 mg	Oral	Continuous PRN	 	 
•	milrinone	 0.5 mcg/kg/min	Intravenous	Continuous	9.9 mL/hr at 10/21/25 1052	0.5 mcg/kg/min at 10/21/25 1052
•	sodium bicarbonate 25 mEq in D5W 1,000 mL infusion	 	Intravenous	Continuous	10 mL/hr at 10/21/25 0632	Rate Verify at 10/21/25 0632
 
Assessment:
Cardiogenic Shock (Post Cardiotomy)
  - Requiring Chemical and Mechanical Support (Impella)
  - Hx of HTN
VT recurrent requiring multiple Defibrillations and Amiodarone Infusion
  - Off Lidocaine
NSTEMI Type I
  - LHC 10.8.25 MVCAD
MVCAD
  - 2v CABG (LIMA to LAD, SVG to OM2)/Impella 5.5 (10.13.25) 
  - LHC 10.8.25 LAD 100% occluded with rest of the vessel filling from left-to-left collaterals; Right coronary artery 100% occluded with left-to-right collaterals filling the rest of the artery; Circumflex has got a 80% stenosis in the mid section before the OM2.  It gives rise to a robust OM1
Post-op AF - Now in and Out of AF/CVR/SVR and SB
  - CHADsVASc - 3 Points - 3.2% Stroke Risk per Year
ICMO/EF 24%
Acute Systolic HF/EF 24% - Improving 
  - ECHO (10.8.25) - LVEF 24%
PAD
AAA 5.1 cm
  - CTA Chest/Abd (10.7.25) - Large ulcerating plaque noted in the common iliac artery on the left
Tobacco Dependence
Chronic Cough
GERD
Hx of Gastric Ulcer
Leukocytosis 
Anemia 
AKI - BUN/Crea 57.8/2.79
 
Plan:
Continue IV Amiodarone 0.5mg/min
Start Primacor 
Continue TVP for now, will tentatively plan for removal tomorrow
Prognosis remains Guarded
Keep Hgb > 9.0; 
Will Continue to Follow
Labs in AM: CBC, CMP and Mg
 
Brandt J Sanders, AGACNP-BC
Cardiology
OCHSNER LAFAYETTE GENERAL MEDICAL HOSPITAL
 
Physician addendum:
 
Patient is having SVT episodes with PVC's. Started Esmolol GTT.
CV surg has explanted Impella to decrease risk of vent arrhythmias.
Start Primacor for LV dysfunction.
Will need Levophed if BP decreases. Will follow
  `,

  `Shortness of breath
 
History of Present Illness
Angela F Celestain is a 63-year-old female with a PMH including chronic systolic heart failure, COPD on home oxygen (4–6 L/min), interstitial lung disease with bronchiectasis, CKD, hypertension, hyperlipidemia, type 2 diabetes mellitus, obesity, prior myocardial infarction, cerebrovascular accident with residual right-sided deficits, and anxiety/depression presented to OLGMC on 10/20/2025 with worsening shortness of breath. She reports the onset of a non-productive cough approximately two weeks ago, for which she was evaluated by Dr. Keys and prescribed a course of steroids and a Z-Pak for presumed walking pneumonia. Despite this, her symptoms gradually worsened, with marked shortness of breath worsening significantly the morning of presentation. She reports using up to three nebulizer treatments daily for relief.
 
The patient recently traveled to Texas and notes symptom progression upon her return. On arrival to the ED, she was on 4 L/min nasal cannula and exhibited diffuse wheezing. She denied fever or chills. She received a prolonged nebulizer treatment and IV Solu-Medrol in the ED, with moderate improvement in symptoms. BNP and troponin were negative. Chest X-ray showed interstitial changes at the bases, consistent with prior imaging, though comparison was limited due to technical issues.
 
Initial labs were notable for RBC 3.80, Hgb 11.7, Hct 36.8, Cr 1.99 (baseline CKD), and glucose 249. UA revealed findings consistent with a possible urinary tract infection: turbid appearance, 4+ glucose, positive leukocyte esterase, 6–10 RBCs, many bacteria, and hyaline casts. Vitals on arrival: T 97.8°F, HR 104, RR 20, BP 100/65, SpO₂ 97% on 4 L nasal cannula. Patient is admitted to hospital medicine services for further management.  
 

ROS
Except as documented, all other systems reviewed and negative 
 

Past Medical History
 

Past Medical History:
Diagnosis	Date
•	Arteriosclerosis of coronary artery	07/12/2022
•	CHF (congestive heart failure)	07/12/2022
 	Formatting of this note might be different from the original. Last echo in 4/2021 with LVEF 75%, severe pulmonary hypertension due to interstitial lung disease  Last Assessment & Plan:  Formatting of this note might be different from the original. Last echo in 4/2021 with LVEF 75%, severe pulmonary hypertension due to interstitial lung disease · Will coordinate with cardiologist with optimization 
•	Chronic respiratory failure with hypoxia	07/12/2022
•	COPD, severity to be determined	07/12/2022
•	Disorder of kidney and ureter	 
•	Gastroesophageal reflux disease	07/12/2022
•	Herpes simplex virus (HSV) infection	07/12/2022
•	Hyperlipidemia	07/12/2022
•	Hypertension	 
•	Interstitial lung disease	10/22/2021
 	Last Assessment & Plan:  Formatting of this note might be different from the original. On baseline home O2, 3L · Will contact pulmonologist to determine safety for surgery.
•	Migraine headache	07/12/2022
•	Myocardial infarction	07/12/2022
•	NSIP (nonspecific interstitial pneumonia)	 
•	Obstructive sleep apnea syndrome	07/12/2022
•	Postmenopausal bleeding	10/22/2021
 	Last Assessment & Plan:  Formatting of this note might be different from the original. EMB attempted in clinic today, scant tissue collected. Given risk factors for hyperplasia and malignancy further sampling warranted, however pt poor surgical candidate. Malignancy is high on DDx. Discussed hysteroscopy D&C with spinal anesthesia as to avoid intubation in s/o severe lung disease.  · For long term
•	Sciatica	07/12/2022
•	Spondylosis of lumbosacral region	07/12/2022
•	Status post CVA	09/25/2022
•	Tension type headache	07/12/2022
•	Type 2 diabetes mellitus	07/12/2022
•	Uses continuous positive airway pressure (CPAP) ventilation at home	07/12/2022
•	Venous insufficiency of lower extremity	07/12/2022
 
 
Past Surgical History
 
Past Surgical History:
Procedure	Laterality	Date
•	CESAREAN SECTION	 	 
•	COLONOSCOPY	 	02/28/2014
 	Dr. Steuben
•	COLONOSCOPY	 	10/18/2017
 	Dr. J.P. Herrington
•	DILATION AND CURETTAGE OF UTERUS	 	 
•	ESOPHAGOGASTRODUODENOSCOPY	N/A	05/22/2023
 	Procedure: EGD;  Surgeon: John Brent Rhodes, MD;  Location: OLGH BRACC ENDOSCOPY;  Service: Gastroenterology;  Laterality: N/A;
 
 
Social History
	Denies alcohol, tobacco or illicit drug use. 
 
Screening for Social Drivers for health:
Patient screened for food insecurity, housing instability, transportation needs, utility difficulties, and interpersonal safety (select all that apply as identified as concern)
‌Housing or Food
‌Transportation Needs
‌Utility Difficulties
‌Interpersonal safety
‌None
  
 

Family History
	Reviewed and negative
 

Home Medications
As documented. 

Prior to Admission medications
Medication	Sig	Start Date	End Date	Taking?	Authorizing Provider
albuterol (VENTOLIN HFA) 90 mcg/actuation inhaler	Inhale 2 puffs into the lungs every 6 (six) hours as needed for Wheezing. Rescue	6/16/25	6/16/26	 	Choudhary, Shalini, MD
azithromycin (Z-PAK) 250 MG tablet	Take 2 tablets by mouth on day 1; Take 1 tablet by mouth on days 2-5	10/2/25	 	 	Darouse, Sarah B, FNP
blood sugar diagnostic Strp	To check BG 3 times daily, to use with insurance preferred meter	10/31/23	 	 	Choudhary, Shalini, MD
blood-glucose meter kit	To check BG 3 times daily, to use with insurance preferred meter	10/31/23	 	 	Choudhary, Shalini, MD
busPIRone (BUSPAR) 15 MG tablet	Take 1 tablet (15 mg total) by mouth 2 (two) times daily.	9/3/25	9/3/26	 	Choudhary, Shalini, MD
empagliflozin (JARDIANCE) 25 mg tablet	Take 1 tablet (25 mg total) by mouth once daily.	9/8/25	 	 	Choudhary, Shalini, MD
fluticasone propionate (FLONASE) 50 mcg/actuation nasal spray	1 spray (50 mcg total) by Each Nostril route once daily.	4/24/25	 	 	Choudhary, Shalini, MD
glimepiride (AMARYL) 1 MG tablet	Take 1 tablet (1 mg total) by mouth 2 (two) times a day.	8/27/25	11/25/25	 	Choudhary, Shalini, MD
insulin aspart U-100 (NOVOLOG) 100 unit/mL injection	Inject 10 Units into the skin 3 (three) times daily.	6/14/25	6/14/26	 	Nagendran, Manikandan, MD
lancets Misc	To check BG 3 times daily, to use with insurance preferred meter	10/31/23	 	 	Choudhary, Shalini, MD
levonorgestreL (MIRENA) 20 mcg/24 hours (7 yrs) 52 mg IUD	52 mg by Intrauterine route.	12/3/21	 	 	Provider, Historical
linaCLOtide (LINZESS) 72 mcg Cap capsule	Take 1 capsule (72 mcg total) by mouth before breakfast.	4/22/25	 	 	Choudhary, Shalini, MD
mycophenolate (CELLCEPT) 250 mg Cap	Take 4 capsules (1,000 mg total) by mouth 2 (two) times daily.	4/29/25	 	 	Keys, Timothy C, MD
pantoprazole (PROTONIX) 40 MG tablet	Take 1 tablet (40 mg total) by mouth Daily.	1/6/25	 	 	Choudhary, Shalini, MD
potassium chloride (K-TAB) 20 mEq	Take 20 mEq by mouth.	6/19/24	 	 	Provider, Historical
predniSONE (DELTASONE) 20 MG tablet	Take 1 tablet (20 mg total) by mouth once daily.	9/4/25	7/1/26	 	Keys, Timothy C, MD
rosuvastatin (CRESTOR) 20 MG tablet	Take 1 tablet (20 mg total) by mouth nightly.	8/19/24	 	 	Choudhary, Shalini, MD
sacubitriL-valsartan (ENTRESTO) 24-26 mg per tablet	Take 1 tablet by mouth 2 (two) times daily.	 	 	 	Provider, Historical
spironolactone (ALDACTONE) 25 MG tablet	Take 1 tablet (25 mg total) by mouth once daily.	9/8/25	 	 	Choudhary, Shalini, MD
torsemide (DEMADEX) 20 MG Tab	Take 1 tablet (20 mg total) by mouth once daily.	6/14/25	9/12/25	 	Nagendran, Manikandan, MD
ULTICARE PEN NEEDLE 31 gauge x 5/16" Ndle	Inject 1 each into the skin once daily.	5/7/25	 	 	Choudhary, Shalini, MD
valACYclovir (VALTREX) 500 MG tablet	Take 1 tablet (500 mg total) by mouth 2 (two) times daily.	9/8/25	 	 	Choudhary, Shalini, MD
verapamiL (CALAN-SR) 120 MG CR tablet	Take 120 mg by mouth once daily.	5/1/23	 	 	Provider, Historical
vilazodone (VIIBRYD) 20 mg Tab	Take 1 tablet (20 mg total) by mouth once daily.	9/3/25	9/3/26	 	Choudhary, Shalini, MD
 
 

Physical Exam
Vital Signs
Temp:  [97.8 °F (36.6 °C)] 
Pulse:  [72-104] 
Resp:  [18-24] 
BP: (100-106)/(65-81) 
SpO2:  [97 %-100 %]  
 
PHYSICAL EXAM PER MD
 

Labs
 

Recent Labs
 	10/20/25
1223
WBC	9.34
RBC	3.80*
HGB	11.7*
HCT	36.8*
MCV	96.8*
MCH	30.8
MCHC	31.8*
RDW	15.2
PLT	191
 
No results for input(s): "PROTIME", "INR", "PTT", "D-DIMER", "FERRITIN", "IRON", "TRANS", "TIBC", "LABIRON", "VITAMINB12", "FOLATE", "LDH", "HAPTOGLOBIN", "RETICCNTAUTO", "RETABS", "PERIPSMEAREV" in the last 72 hours.	 	
Recent Labs
 	10/20/25
1223
NA	139
K	4.0
CO2	20*
BUN	13.7
CREATININE	1.99*
EGFRNORACEVR	28
CALCIUM	8.6
ALBUMIN	3.4
GLOBULIN	3.3
ALKPHOS	75
ALT	50*
AST	32
BILITOT	0.8
BNP	83
 
No results for input(s): "LACTIC" in the last 72 hours.
No results for input(s): "CPK", "TROPONINI" in the last 72 hours.
 

Microbiology Results (last 7 days) 
 

 	Procedure	Component	Value	Units	Date/Time
 	Blood Culture [1348113481]	 
 	Order Status: Sent	Specimen: Blood	 
 	Blood Culture [1348113482]	 
 	Order Status: Sent	Specimen: Blood	 
 

Imaging
Mammo Digital Screening Bilat w/ Tomo (XPD)
 - MAMMO DIGITAL SCREENING BILAT WITH TOMO (XPD)
 
BILATERAL DIGITAL SCREENING MAMMOGRAM 3D/2D WITH CAD: 9/24/2025
 
HISTORY: Routine screening. Patient has no complaints. No family history of breast cancer.  
 
COMPARISONS: Comparison is made to exams dated:  4/19/2024 mammogram, 3/28/2023 mammogram, 1/15/2021 mammogram, 2/14/2018 mammogram, 1/10/2018 mammogram - Ochsner Lafayette General Breast Center, and 5/31/2012 mammogram - University Hospital.  
 
TECHNIQUE: Digital mammography views were performed with tomosynthesis. Current study was evaluated with a Computer Aided Detection (CAD) system. 
 
BREAST COMPOSITION: There are scattered areas of fibroglandular density.  
 
FINDINGS: 
No significant masses, calcifications, or other findings are seen in either breast.  
There has been no significant interval change.
 
IMPRESSION: NEGATIVE
 
There is no mammographic evidence of malignancy. 
 
RECOMMENDATIONS: 
A routine screening mammogram in one year in the absence of significant clinical findings in the interval is recommended (September 2026).  
 
Megan Daigle M.D.          
md/penrad:9/25/2025 06:41:39  
 
letter sent: Mammography Normal  
Mammogram BI-RADS: 1 Negative
 

Assessment & Plan
ASSESSMENT
Acute on chronic respiratory failure 
NSIP with suspected exacerbation 
Acute cystitis with hematuria 
Congestive heart failure, chronic systolic 
Type 2 diabetes mellitus without complications 
Chronic kidney disease
Hypertension
Hyperlipidemia
Obesity
 
History of CVA with right-sided residual deficits, myocardial infarction, COPD on home oxygen (4–6 L/min),
 
PLAN
Pulmonology has been consulted. Appreciate their assistance and recommendations. 
	Continue doxycycline for atypical coverage
	IV steroid
	Supplemental oxygen p.r.n. to maintain an oxygen saturations greater than or equal to 90%
	Sputum culture ordered
	CT scan of chest without contrast when system functioning appropriately
Blood cultures ordered and pending-follow results
Accu-Cheks a.c./HS with sliding scale insulin coverage
Resume home medications as deemed necessary 
Repeat labs in a.m. 
Fall precautions
 
VTE Prophylaxis: SCDs
Patient condition:  Stable
 
I, Nicole White, FNP-C have reviewed and discussed the case with Reshma Bhanushali, MD. Please see the following addendum for further assessment and plan from their attending MD.
 
This note was created with assistance of electronic voice recognition software.  There may be transcription errors as a result of using this technology however minimal; and effort has been made to assure accuracy of the transcription but any obvious areas or admissions should be clarified with the author of the document. 
 
Nicole J White, FNP-C
Hospital Medicine Team
10/20/2025
 
 
MD Addendum:
I, Dr. Reshma Bhanushali assumed care of this patient today at 4:00 p.m. 
For the patient encounter, I performed the substantive portion of the visit, I reviewed the NP Nicole documentation, treatment plan, and medical decision making.  I had face to face time with this patient 
 
A. History:
Reviewed and noted in detail.  
Ms. Celestone is a 63-year-old female with systolic heart failure, COPD on home oxygen, interstitial lung disease with bronchiectasis, CKD, hypertension, diabetes mellitus type 2, obesity, prior MI, CVA with residual right-sided deficits and anxiety and depression that presented with worsening shortness a breath and worsening sputum production from her baseline which she describes as yellow green in color.  She recently completed a course of Z-Pak per her pulmonologist however despite this had worsening of her symptoms with marked shortness a breath.  Patient received prolonged nebulizer treatment in the ED and IV Solu-Medrol with some improvement in her symptoms.  BNP and troponin were negative.  Chest x-ray showed interstitial changes at the bases consistent with poor imaging.  Was consistent with possible UTI.  Patient was admitted to hospital medicine service and pulmonology was consulted 
At the time of my visit she is still boarding in the ED and continues to remain uncomfortable with her shortness a breath 
 
B. Physical exam:
General: Alert and oriented, no acute distress however does appear uncomfortable 
Respiratory: Scattered inspiratory crackles bilaterally, slightly increased work of breathing and uncontrolled coughing with oxygen via nasal cannula 
Musculoskeletal: Generalized weakness
Neuro: Nonfocal 
Cardiovascular:  Regular rate and rhythm
Psych:  Appropriate 
 
C. Medical decision making:
Acute on chronic hypoxic respiratory failure 
NSIP with suspected exacerbation 
Acute cystitis with hematuria 
Chronic systolic heart failure 
Diabetes mellitus type 2 
CKD, hypertension and hyperlipidemia as well as obesity 
 
Patient has been evaluated by pulmonology
Recommendation to start with doxycycline for atypical coverage, continue 
-continue with IV steroids 
Supplemental oxygen to maintain sats over 90% 
Sputum culture, follow-up on results 
CT scan of the chest, currently pending since system is down and follow-up on results when available 
Accu-Cheks AC and HS with sliding scale coverage 
PRN cough suppressant
 
Discharge Planning and Disposition: No mobility needs. Ambulating well. Good social support system. 
Anticipated discharge
 
All diagnosis and differential diagnosis have been reviewed; assessment and plan has been documented; I have personally reviewed the labs and test results that are presently available; I have reviewed the patients medication list; I have reviewed the consulting providers response and recommendations. I have reviewed or attempted to review medical records based upon their availability.

All of the patient and family questions have been addressed and answered. Patient's is agreeable to the above stated plan. I will continue to monitor closely and make adjustments to medical management as needed.
  `,

];

/**
 * Normalize whitespace in clinical notes
 * - Removes excessive blank lines (more than 1 consecutive blank line)
 * - Trims trailing whitespace from each line
 * - Preserves single blank lines for readability
 * - Removes leading/trailing blank lines
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
function normalizeWhitespace(text) {
  if (!text) return text;
  
  return text
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing spaces from each line
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with 2 (one blank line between content)
    .trim(); // Remove leading/trailing blank lines
}

/**
 * Auto-detect section headers from training examples
 * Learns patterns by finding lines that look like headers (end with : or are short)
 * Accepts both plain strings and objects with {label, note, enabled} format
 * @param {Array<string|object>} examples - Training examples (strings or objects)
 * @returns {object} - Learned patterns with aliases and regex for each category
 */
function learnPatternsFromExamples(examples) {
  /** @type {{ vitals: Set<string>, hpi: Set<string>, assessment: Set<string>, plan: Set<string> }} */
  const learned = {
    vitals: new Set(),
    hpi: new Set(),
    assessment: new Set(),
    plan: new Set()
  };

  // Keywords that help identify section types
  const sectionKeywords = {
    vitals: ['vital', 'vs', 'v/s', 'sign'],
    hpi: ['history', 'hpi', 'present', 'illness', 'complaint'],
    assessment: ['assessment', 'impression', 'imp', 'diagnosis', 'dx'],
    plan: ['plan', 'recommendation', 'management', 'disposition']
  };

  for (const example of examples) {
    // Handle both plain strings and objects
    let noteText;
    if (typeof example === 'string') {
      noteText = normalizeWhitespace(example);
    } else if (example && typeof example === 'object') {
      /** @type {any} */
      const exampleObj = example;
      if (exampleObj.enabled === false) continue; // Skip if explicitly disabled
      noteText = normalizeWhitespace(exampleObj.note);
    } else {
      continue;
    }

    if (!noteText) continue;

    const lines = noteText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines or very long lines (likely content, not headers)
      if (!trimmed || trimmed.length > 50) continue;
      
      // Check if line looks like a header (ends with : or is short and title-cased)
      const looksLikeHeader = trimmed.endsWith(':') || 
                               (trimmed.length < 40 && /^[A-Z]/.test(trimmed));
      
      if (!looksLikeHeader) continue;

      // Clean the header
      const cleaned = trimmed.replace(/:$/, '').trim().toLowerCase();
      
      // Categorize by keywords
      for (const [category, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(kw => cleaned.includes(kw))) {
          if (category === 'vitals' || category === 'hpi' || category === 'assessment' || category === 'plan') {
            learned[category].add(trimmed);
          }
          break;
        }
      }
    }
  }

  // Convert Sets to sorted arrays
  /** @type {Record<string, any>} */
  const patterns = {};
  for (const [category, headers] of Object.entries(learned)) {
    patterns[category] = {
      aliases: Array.from(headers).sort(),
      regex: buildRegexFromAliases(Array.from(headers))
    };
  }

  return patterns;
}

/**
 * Build a regex pattern from header aliases
 * @param {string[]} aliases - Array of header aliases
 * @returns {RegExp|null} - Regex pattern or null if no aliases
 */
function buildRegexFromAliases(aliases) {
  if (!aliases || aliases.length === 0) return null;
  
  // Escape special regex characters and remove trailing colons
  const escaped = aliases.map((alias) => {
    const cleaned = alias.replace(/:$/, '').trim();
    return cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  
  // Build pattern that matches any alias (case-insensitive, optional colon)
  // Security: Pattern is safely escaped above - all regex special chars are sanitized
  // codacy-disable-next-line
  const pattern = `^(?:${escaped.join('|')})\\s*:?`;
  return new RegExp(pattern, 'i');
}

/**
 * Get learned patterns (cached)
 * @returns {object} - Learned patterns
 */
/** @type {any} */
let cachedPatterns = null;
function getLearnedPatterns() {
  if (!cachedPatterns) {
    cachedPatterns = learnPatternsFromExamples(TRAINING_EXAMPLES);
    console.log('📚 Learned patterns from training examples:', cachedPatterns);
  }
  return cachedPatterns;
}

/**
 * Reset cache (call this after modifying TRAINING_EXAMPLES)
 */
function resetLearnedPatterns() {
  cachedPatterns = null;
}

/**
 * Check training examples file size and warn if getting large
 */
function checkFileSize() {
  const examplesJSON = JSON.stringify(TRAINING_EXAMPLES);
  const sizeKB = (examplesJSON.length / 1024).toFixed(2);
  const numExamples = TRAINING_EXAMPLES.length;
  
  console.log(`📊 Parser Training Stats:
  - ${numExamples} training examples loaded
  - ~${sizeKB} KB in memory
  `);
  
  if (examplesJSON.length > 200000) { // ~200 KB
    console.error(`🚨 Training file is very large (${sizeKB} KB)!
    This may slow down page loading. Please reduce the number of examples.`);
  } else if (examplesJSON.length > 100000) { // ~100 KB
    console.warn(`⚠️ Training file is getting large (${sizeKB} KB).
    Consider:
    - Removing old/redundant examples
    - The parser learns quickly - 5-10 diverse examples is usually enough
    - Focus on quality (diverse formats) over quantity`);
  }
  
  return { numExamples, sizeKB };
}

// Expose to window for global access
if (typeof window !== 'undefined') {
  // @ts-ignore - Extending window object for browser console access
  window.TRAINING_EXAMPLES = TRAINING_EXAMPLES;
  // @ts-ignore - Extending window object for browser console access
  window.getLearnedPatterns = getLearnedPatterns;
  // @ts-ignore - Extending window object for browser console access
  window.resetLearnedPatterns = resetLearnedPatterns;
  // @ts-ignore - Extending window object for browser console access
  window.learnPatternsFromExamples = learnPatternsFromExamples;
  // @ts-ignore - Extending window object for browser console access
  window.normalizeWhitespace = normalizeWhitespace;
  // @ts-ignore - Extending window object for browser console access
  window.checkParserFileSize = checkFileSize;
  
  // Automatically check size on load
  checkFileSize();
}

// ES module export
export { TRAINING_EXAMPLES, getLearnedPatterns, resetLearnedPatterns, learnPatternsFromExamples, normalizeWhitespace, checkFileSize };
