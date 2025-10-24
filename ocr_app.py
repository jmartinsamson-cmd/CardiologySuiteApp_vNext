#!/usr/bin/env python3
"""
OCR Service for Cardiology Suite
Provides document text extraction and medical form processing
"""

import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
import pytesseract
from PIL import Image
import cv2
import numpy as np
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Cardiology Suite OCR Service", version="1.0.0")

# Azure Form Recognizer configuration
FORM_RECOGNIZER_ENDPOINT = os.getenv(
    "FORM_RECOGNIZER_ENDPOINT",
    "https://cardiologysuite-ocr.cognitiveservices.azure.com/",
)
FORM_RECOGNIZER_KEY = os.getenv("FORM_RECOGNIZER_KEY", "")

# Initialize Azure clients
form_recognizer_client = None
if FORM_RECOGNIZER_KEY:
    try:
        form_recognizer_client = DocumentAnalysisClient(
            endpoint=FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(FORM_RECOGNIZER_KEY),
        )
        logger.info("Azure Form Recognizer client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Azure Form Recognizer: {e}")


def preprocess_image(image_bytes: bytes) -> Image.Image:
    """Preprocess image for better OCR results"""
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply threshold to get binary image
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Convert back to PIL Image
    pil_image = Image.fromarray(thresh)

    return pil_image


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ocr"}


@app.post("/ocr/tesseract")
async def ocr_tesseract(file: UploadFile = File(...)):
    """Extract text using Tesseract OCR"""
    try:
        # Read file
        contents = await file.read()

        # Preprocess image
        processed_image = preprocess_image(contents)

        # Extract text
        text = pytesseract.image_to_string(processed_image)

        return {"text": text, "method": "tesseract", "filename": file.filename}

    except Exception as e:
        logger.error(f"Tesseract OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@app.post("/ocr/azure")
async def ocr_azure(file: UploadFile = File(...)):
    """Extract text using Azure Form Recognizer"""
    if not form_recognizer_client:
        raise HTTPException(
            status_code=503, detail="Azure Form Recognizer not configured"
        )

    try:
        # Read file
        contents = await file.read()

        # Analyze document
        poller = form_recognizer_client.begin_analyze_document(
            "prebuilt-read", document=contents
        )
        result = poller.result()

        # Extract text
        extracted_text = ""
        for page in result.pages:
            for line in page.lines:
                extracted_text += line.content + "\n"

        return {
            "text": extracted_text,
            "method": "azure_form_recognizer",
            "filename": file.filename,
            "pages": len(result.pages),
        }

    except Exception as e:
        logger.error(f"Azure OCR error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Azure OCR processing failed: {str(e)}"
        )


@app.post("/ocr/medical-form")
async def ocr_medical_form(file: UploadFile = File(...)):
    """Extract structured data from medical forms using Azure"""
    if not form_recognizer_client:
        raise HTTPException(
            status_code=503, detail="Azure Form Recognizer not configured"
        )

    try:
        # Read file
        contents = await file.read()

        # Analyze document with layout model
        poller = form_recognizer_client.begin_analyze_document(
            "prebuilt-layout", document=contents
        )
        result = poller.result()

        # Extract structured data
        pages_data = []
        for page in result.pages:
            page_data = {
                "page_number": page.page_number,
                "width": page.width,
                "height": page.height,
                "lines": [line.content for line in page.lines],
                "tables": [],
            }

            # Extract tables if present
            if hasattr(result, "tables"):
                for table in result.tables:
                    if table.bounding_regions and any(
                        region.page_number == page.page_number
                        for region in table.bounding_regions
                    ):
                        table_data = []
                        for cell in table.cells:
                            table_data.append(
                                {
                                    "row_index": cell.row_index,
                                    "column_index": cell.column_index,
                                    "content": cell.content,
                                    "is_header": cell.kind == "columnHeader",
                                }
                            )
                        page_data["tables"].append(table_data)

            pages_data.append(page_data)

        return {
            "method": "azure_medical_form",
            "filename": file.filename,
            "pages": pages_data,
        }

    except Exception as e:
        logger.error(f"Medical form OCR error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Medical form processing failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
