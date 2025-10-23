import os
from typing import Optional, Tuple
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
from azure.storage.filedatalake import DataLakeServiceClient


def get_blob_and_adls_clients(
    connection_string: Optional[str] = None,
    account_url: Optional[str] = None,
) -> Tuple[BlobServiceClient, Optional[DataLakeServiceClient]]:
    """
    Create BlobServiceClient and DataLakeServiceClient (if possible) using either
    a connection string or DefaultAzureCredential with account_url.
    Returns (blob_client, adls_client_or_none)
    """
    if not connection_string and not account_url:
        # Try env var
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

    if connection_string:
        blob_client = BlobServiceClient.from_connection_string(connection_string)
        # ADLS client requires account_url; derive if present in conn string endpoints
        # If not derivable, we'll return None
        adls_client = None
        try:
            # Try to form URL from the blob client
            account_name = blob_client.account_name
            account_url_derived = f"https://{account_name}.dfs.core.windows.net"
            adls_client = DataLakeServiceClient(
                account_url_derived, credential=DefaultAzureCredential()
            )
        except Exception:
            adls_client = None
        return blob_client, adls_client

    # Fallback to DefaultAzureCredential + account_url
    if not account_url:
        raise ValueError(
            "Either connection_string or account_url must be provided or available via env."
        )

    credential = DefaultAzureCredential()
    blob_client = BlobServiceClient(account_url=account_url, credential=credential)

    # Try ADLS (dfs endpoint)
    adls_client = None
    try:
        if account_url.endswith(".blob.core.windows.net"):
            dfs_url = account_url.replace(
                ".blob.core.windows.net", ".dfs.core.windows.net"
            )
        else:
            dfs_url = account_url
        adls_client = DataLakeServiceClient(account_url=dfs_url, credential=credential)
    except Exception:
        adls_client = None

    return blob_client, adls_client


def is_hns_enabled(blob_client: BlobServiceClient) -> bool:
    try:
        props = blob_client.get_account_information()
        # HNS enabled = Hierarchical Namespace
        return bool(props.get("isHierarchicalNamespaceEnabled"))
    except Exception:
        return False
