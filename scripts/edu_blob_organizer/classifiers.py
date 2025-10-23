import re
from typing import Dict, Optional

DOC_TYPES = [
    "guideline",
    "slide_deck",
    "textbook_chapter",
    "article_RCT",
    "review",
    "protocol_handout",
    "calculator",
    "image_figure",
    "notes",
    "dataset",
    "website_snapshot",
]

CONDITIONS = [
    "ACS",
    "STEMI",
    "NSTEMI",
    "OMI",
    "AF",
    "HF",
    "HCM",
    "valvular",
    "pericarditis",
    "syncope",
    "hypertension",
    "PAD",
    "EP",
    "congenital",
    "cardiology_general",
]

SOURCE_ORGS = [
    "ACC",
    "AHA",
    "ESC",
    "NEJM",
    "JAMA",
    "Lancet",
    "Goldman-Cecil",
    "CIS",
    "internal",
]

FILENAME_YEAR_RE = re.compile(r"(?P<year>20\d{2}|19\d{2})")


def _safe_text_preview(
    blob_client, container: str, name: str, max_bytes: int = 200_000
) -> str:
    try:
        downloader = blob_client.get_blob_client(
            container=container, blob=name
        ).download_blob(max_bytes=max_bytes)
        data = downloader.readall()
        # Very naive: if looks like text, decode; else empty
        if data.startswith(b"%PDF"):
            return ""  # we'll prefer optional OCR/Doc Intelligence
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception:
            return ""
    except Exception:
        return ""


def classify(
    filename: str,
    blob_client=None,
    container: Optional[str] = None,
    name: Optional[str] = None,
    use_openai: bool = False,
    use_docint: bool = False,
    openai_client=None,
    docint_client=None,
) -> Dict[str, str]:
    """
    Heuristic classification using filename and (optionally) light content.
    Conservative defaults + needs_review when confidence is low.
    """
    base = filename.lower()
    doc_type = ""
    condition = ""
    source_org = ""
    year = ""
    evidence_level = ""
    needs_review = "no"

    # docType heuristics
    if any(k in base for k in ["guideline", "guidelines"]):
        doc_type = "guideline"
        evidence_level = "guideline"
    elif any(k in base for k in ["slide", "deck", "ppt", "keynote"]):
        doc_type = "slide_deck"
    elif any(k in base for k in ["textbook", "chapter", "goldman", "cecil"]):
        doc_type = "textbook_chapter"
        source_org = "Goldman-Cecil"
    elif any(k in base for k in ["rct", "randomized", "randomised", "trial"]):
        doc_type = "article_RCT"
        evidence_level = "RCT"
    elif any(
        k in base for k in ["review", "meta-analysis", "metaanalysis", "systematic"]
    ):
        doc_type = "review"
        evidence_level = "review"
    elif any(k in base for k in ["protocol", "handout", "workflow", "pathway"]):
        doc_type = "protocol_handout"
    elif any(k in base for k in ["calc", "calculator", "score"]):
        doc_type = "calculator"
    elif any(k in base for k in ["figure", "image", "jpg", "jpeg", "png", "svg"]):
        doc_type = "image_figure"
    elif any(k in base for k in ["notes", "note", "md", "txt"]):
        doc_type = "notes"
    elif any(k in base for k in ["dataset", "csv", "xlsx", "jsonl", "parquet"]):
        doc_type = "dataset"
    elif any(k in base for k in ["snapshot", "website", "web", "archive", "mhtml"]):
        doc_type = "website_snapshot"

    # condition heuristics
    for cond in CONDITIONS:
        if cond.lower() in base:
            condition = cond
            break
    if not condition:
        if any(k in base for k in ["stemi", "st elevation"]):
            condition = "STEMI"
        elif any(k in base for k in ["nstemi"]):
            condition = "NSTEMI"
        elif any(k in base for k in ["omi"]):
            condition = "OMI"
        elif any(k in base for k in ["acs", "acute coronary"]):
            condition = "ACS"
        elif any(k in base for k in ["af", "atrial fibrillation"]):
            condition = "AF"
        elif any(k in base for k in ["hf", "heart failure"]):
            condition = "HF"
        elif any(k in base for k in ["hcm"]):
            condition = "HCM"
        elif any(k in base for k in ["valv", "valve"]):
            condition = "valvular"
        elif any(k in base for k in ["pericard"]):
            condition = "pericarditis"
        elif any(k in base for k in ["syncope"]):
            condition = "syncope"
        elif any(k in base for k in ["hypertension", "htn"]):
            condition = "hypertension"
        elif any(k in base for k in ["pad", "peripheral artery"]):
            condition = "PAD"
        elif any(k in base for k in ["ep", "electrophysiol"]):
            condition = "EP"
        elif any(k in base for k in ["congenital"]):
            condition = "congenital"
        else:
            condition = "cardiology_general"

    # source_org
    for org in SOURCE_ORGS:
        if org.lower().replace("-", "") in base.replace("-", ""):
            source_org = org
            break
    if not source_org:
        if any(k in base for k in ["acc", "american college of cardiology"]):
            source_org = "ACC"
        elif any(k in base for k in ["aha", "american heart association"]):
            source_org = "AHA"
        elif any(k in base for k in ["esc", "european society of cardiology"]):
            source_org = "ESC"
        elif any(k in base for k in ["nejm"]):
            source_org = "NEJM"
        elif any(k in base for k in ["jama"]):
            source_org = "JAMA"
        elif any(k in base for k in ["lancet"]):
            source_org = "Lancet"
        elif any(k in base for k in ["cis", "clinical information system"]):
            source_org = "CIS"
        else:
            source_org = "internal"

    # year
    m = FILENAME_YEAR_RE.search(filename)
    if m:
        year = m.group("year")

    # Optional lightweight content peek
    if not year and blob_client and container and name:
        preview = _safe_text_preview(blob_client, container, name)
        m2 = FILENAME_YEAR_RE.search(preview)
        if m2:
            year = m2.group("year")

    # sanity defaults
    if not doc_type:
        needs_review = "yes"
        doc_type = "notes"  # conservative bucket
    if not year:
        year = "unknown"

    return {
        "docType": doc_type,
        "condition": condition,
        "source_org": source_org,
        "year": year,
        "audience": "clinician",
        "evidence_level": evidence_level,
        "retention_class": "refresh_annual",
        "phi": "no",
        "needs_review": needs_review,
    }
