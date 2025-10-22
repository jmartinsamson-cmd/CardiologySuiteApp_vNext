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
];

/**
 * Normalize whitespace in clinical notes
 * - Removes excessive blank lines (more than 1 consecutive blank line)
 * - Trims trailing whitespace from each line
 * - Preserves single blank lines for readability
 * - Removes leading/trailing blank lines
 */
function normalizeWhitespace(text) {
  if (!text) return text;
  
  return text
    .split('\n')
    .map(line => line.trimEnd()) // Remove trailing spaces from each line
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ blank lines with just 2 (one blank line)
    .trim(); // Remove leading/trailing blank lines
}

/**
 * Auto-detect section headers from training examples
 * Learns patterns by finding lines that look like headers (end with : or are short)
 * Accepts both plain strings and objects with {label, note, enabled} format
 */
function learnPatternsFromExamples(examples) {
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
      if (example.enabled === false) continue; // Skip if explicitly disabled
      noteText = normalizeWhitespace(example.note);
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
          learned[category].add(trimmed);
          break;
        }
      }
    }
  }

  // Convert Sets to sorted arrays
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
 */
function buildRegexFromAliases(aliases) {
  if (!aliases || aliases.length === 0) return null;
  
  // Escape special regex characters and remove trailing colons
  const escaped = aliases.map(alias => {
    const cleaned = alias.replace(/:$/, '').trim();
    return cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  
  // Build pattern that matches any alias (case-insensitive, optional colon)
  const pattern = `^(?:${escaped.join('|')})\\s*:?`;
  return new RegExp(pattern, 'i');
}

/**
 * Get learned patterns (cached)
 */
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
  
  if (examplesJSON.length > 100000) { // ~100 KB
    console.warn(`⚠️ Training file is getting large (${sizeKB} KB).
    Consider:
    - Removing old/redundant examples
    - The parser learns quickly - 5-10 diverse examples is usually enough
    - Focus on quality (diverse formats) over quantity`);
  } else if (examplesJSON.length > 200000) { // ~200 KB
    console.error(`🚨 Training file is very large (${sizeKB} KB)!
    This may slow down page loading. Please reduce the number of examples.`);
  }
  
  return { numExamples, sizeKB };
}

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.TRAINING_EXAMPLES = TRAINING_EXAMPLES;
  window.getLearnedPatterns = getLearnedPatterns;
  window.resetLearnedPatterns = resetLearnedPatterns;
  window.learnPatternsFromExamples = learnPatternsFromExamples;
  window.normalizeWhitespace = normalizeWhitespace;
  window.checkParserFileSize = checkFileSize;
  
  // Automatically check size on load
  checkFileSize();
}

// ES module export
export { TRAINING_EXAMPLES, getLearnedPatterns, resetLearnedPatterns, learnPatternsFromExamples, normalizeWhitespace, checkFileSize };
