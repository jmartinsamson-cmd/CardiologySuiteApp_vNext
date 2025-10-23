import os
from typing import Optional

# Optional providers for smarter classification

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

try:
    from azure.ai.formrecognizer import DocumentAnalysisClient
    from azure.core.credentials import AzureKeyCredential
except Exception:
    DocumentAnalysisClient = None
    AzureKeyCredential = None


def get_openai_client() -> Optional[object]:
    if OpenAI is None:
        return None
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or os.getenv("OPENAI_API_BASE")
    api_key = os.getenv("AZURE_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not (endpoint and api_key):
        return None
    # The OpenAI SDK can be pointed to Azure via base_url
    return OpenAI(base_url=endpoint, api_key=api_key)


def get_docint_client() -> Optional[object]:
    if DocumentAnalysisClient is None or AzureKeyCredential is None:
        return None
    endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
    if not (endpoint and key):
        return None
    return DocumentAnalysisClient(endpoint=endpoint, credential=AzureKeyCredential(key))
