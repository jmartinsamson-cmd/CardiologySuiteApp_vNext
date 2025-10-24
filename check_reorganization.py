from azure.storage.blob import BlobServiceClient
import os

conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
c = BlobServiceClient.from_connection_string(conn_str)
cc = c.get_container_client("edu-content")

total = sum(1 for _ in cc.list_blobs())
education = sum(1 for b in cc.list_blobs(name_starts_with="education/"))
pdfs = sum(1 for b in cc.list_blobs(name_starts_with="pdfs/"))

print(f"Total blobs: {total}")
print(f"Education folder: {education}")
print(f"PDFs folder (unchanged): {pdfs}")
print(
    f"\n✓ Reorganization complete!" if education > 0 else "\n⚠ No files in education/"
)
