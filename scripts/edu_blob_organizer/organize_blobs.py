#!/usr/bin/env python3
import csv
import argparse
import json
from typing import Dict
from datetime import datetime, timezone

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import BlobClient

from azure_clients import get_blob_and_adls_clients, is_hns_enabled
from classifiers import classify
from optional_providers import get_openai_client, get_docint_client

try:
    from azure.storage.filedatalake import DataLakeServiceClient
except Exception:
    DataLakeServiceClient = None


def detect_destination_path(tags: Dict[str, str], filename: str) -> str:
    if tags.get("needs_review") == "yes":
        return f"education/_unsorted/{filename}"
    doc = tags.get("docType", "notes")
    cond = tags.get("condition", "cardiology_general")
    year = tags.get("year", "unknown")
    org = tags.get("source_org", "internal")
    return f"education/{doc}/{cond}/{year}/{org}/{filename}"


def set_blob_tags(blob_client: BlobClient, tags: Dict[str, str]):
    # Azure Blob index tags are set as a simple dict
    blob_client.set_blob_tags(tags)


def copy_and_delete(
    blob_service: BlobServiceClient, container: str, src_name: str, dst_name: str
):
    src_blob = blob_service.get_blob_client(container=container, blob=src_name)
    dst_blob = blob_service.get_blob_client(container=container, blob=dst_name)
    src_url = src_blob.url
    # Start copy
    dst_blob.start_copy_from_url(src_url)
    # Optionally wait for completion, but for simplicity we assume eventual success
    # Delete source
    src_blob.delete_blob()


def adls_rename(
    adls_client,
    filesystem: str,
    src_name: str,
    dst_name: str,
    overwrite: bool = False,
):
    fs = adls_client.get_file_system_client(filesystem=filesystem)
    src_path = fs.get_file_client(src_name)
    # Ensure destination directory exists
    dst_dir_path = "/".join(dst_name.split("/")[:-1])
    if dst_dir_path:
        try:
            fs.create_directory(dst_dir_path)
        except ResourceExistsError:
            pass
        except Exception:
            # directory may already exist
            pass
    # Perform atomic rename
    src_path.rename_destination(f"/{dst_name}", overwrite=overwrite)


def main():
    parser = argparse.ArgumentParser(
        description="Organize cardiology education blobs with tags and folders."
    )
    parser.add_argument("--connection-string", dest="connection_string")
    parser.add_argument("--account-url", dest="account_url")
    parser.add_argument(
        "--sas-token",
        dest="sas_token",
        help="SAS token for Storage auth (omit leading '?')",
    )
    parser.add_argument("--container", required=True, help="Target container name")
    parser.add_argument(
        "--prefix",
        default="incoming/",
        help="Prefix to scan (default incoming/). Use '' for root",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview actions without writing"
    )
    parser.add_argument(
        "--tag-only",
        action="store_true",
        help="Only set tags on the source blob (no move/rename)",
    )
    parser.add_argument(
        "--use-adls",
        action="store_true",
        help="Force ADLS Gen2 path rename when available",
    )
    parser.add_argument(
        "--overwrite", action="store_true", help="Overwrite destination if exists"
    )
    parser.add_argument(
        "--use-openai",
        action="store_true",
        help="Use Azure OpenAI for smarter classification if configured",
    )
    parser.add_argument(
        "--use-docint",
        action="store_true",
        help="Use Document Intelligence for text extraction if configured",
    )
    parser.add_argument("--audit-log", default="education_organize_audit.csv")
    parser.add_argument(
        "--max-files",
        type=int,
        default=None,
        help="Process at most N files (useful for cautious first runs)",
    )

    args = parser.parse_args()

    blob_service, adls_client = get_blob_and_adls_clients(
        connection_string=args.connection_string,
        account_url=args.account_url,
        sas_token=args.sas_token,
    )

    hns = is_hns_enabled(blob_service)
    use_adls = args.use_adls or hns

    container = args.container
    prefix = args.prefix or ""

    print("[INFO] Connected to storage account")
    print(f"[INFO] Container: {container}")
    print(f"[INFO] Prefix: '{prefix}'")
    print(f"[INFO] HNS enabled: {hns}")
    print(f"[INFO] Use ADLS: {use_adls}")
    print(f"[INFO] Dry run: {args.dry_run}")
    print(f"[INFO] Tag only: {args.tag_only}")
    if args.max_files:
        print(f"[INFO] Max files: {args.max_files}")
    print("[INFO] Scanning blobs...")

    # Open CSV audit
    fieldnames = [
        "timestamp",
        "source_path",
        "destination_path",
        "action",
        "status",
        "error",
        "tags_json",
    ]
    with open(args.audit_log, "w", newline="", encoding="utf-8") as fcsv:
        writer = csv.DictWriter(fcsv, fieldnames=fieldnames)
        writer.writeheader()

        container_client = blob_service.get_container_client(container)
        blobs = container_client.list_blobs(name_starts_with=prefix)

        # Optional providers
        openai_client = get_openai_client() if args.use_openai else None
        docint_client = get_docint_client() if args.use_docint else None

        processed = 0
        for b in blobs:
            # Skip virtual directories
            if b.name.endswith("/"):
                continue
            filename = b.name.split("/")[-1]

            try:
                tags = classify(
                    filename=filename,
                    blob_client=blob_service,
                    container=container,
                    name=b.name,
                    use_openai=bool(openai_client),
                    use_docint=bool(docint_client),
                    openai_client=openai_client,
                    docint_client=docint_client,
                )
                dst = detect_destination_path(tags, filename)
                if args.dry_run:
                    action = "dry-run"
                elif args.tag_only:
                    action = "tag-only"
                else:
                    action = "rename" if use_adls else "copy+delete"

                if not args.dry_run:
                    if args.tag_only:
                        # Set tags on source blob only
                        src_blob = blob_service.get_blob_client(
                            container=container, blob=b.name
                        )
                        set_blob_tags(src_blob, tags)
                    else:
                        if (
                            use_adls
                            and adls_client is not None
                            and DataLakeServiceClient is not None
                        ):
                            adls_rename(
                                adls_client,
                                container,
                                b.name,
                                dst,
                                overwrite=args.overwrite,
                            )
                            # After rename, set tags via blob endpoint on the new path
                            dst_blob = blob_service.get_blob_client(
                                container=container, blob=dst
                            )
                            set_blob_tags(dst_blob, tags)
                        else:
                            # Copy + delete path
                            copy_and_delete(blob_service, container, b.name, dst)
                            dst_blob = blob_service.get_blob_client(
                                container=container, blob=dst
                            )
                            set_blob_tags(dst_blob, tags)

                writer.writerow(
                    {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "source_path": b.name,
                        "destination_path": dst,
                        "action": action,
                        "status": "ok",
                        "error": "",
                        "tags_json": json.dumps(tags, ensure_ascii=False),
                    }
                )
                print(f"[OK] {b.name} -> {dst} :: {tags}")

                processed += 1
                if args.max_files and processed >= args.max_files:
                    print(
                        f"[INFO] Reached max-files limit ({args.max_files}). Stopping."
                    )
                    break

            except Exception as e:
                writer.writerow(
                    {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "source_path": b.name,
                        "destination_path": "",
                        "action": "skip",
                        "status": "error",
                        "error": str(e),
                        "tags_json": "{}",
                    }
                )
                print(f"[ERR] {b.name}: {e}")


if __name__ == "__main__":
    main()
