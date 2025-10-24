#!/usr/bin/env python3

"""
Azure Blob Storage Filename Normalization Tool
Safely renames blobs based on their index tags with format: {year}-{source_org}-{original_name}
Includes checksum verification and dry-run support
"""

import argparse
import hashlib
import os
import sys
from typing import Dict, List, Optional, Any

try:
    from azure.storage.blob import BlobServiceClient
    from azure.identity import DefaultAzureCredential
except ImportError:
    print(
        "Error: Missing required packages. Install with: pip install azure-storage-blob azure-identity"
    )
    sys.exit(1)


class BlobFilenameNormalizer:
    """Safe blob filename normalization based on tags"""

    def __init__(
        self, connection_string: Optional[str] = None, account_url: Optional[str] = None
    ):
        """Initialize with connection string or account URL + credentials"""
        if connection_string:
            self.blob_client = BlobServiceClient.from_connection_string(
                connection_string
            )
        elif account_url:
            credential = DefaultAzureCredential()
            self.blob_client = BlobServiceClient(
                account_url=account_url, credential=credential
            )
        else:
            raise ValueError("Either connection_string or account_url must be provided")

    def get_blob_with_tags(
        self, container_name: str, blob_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get blob properties including tags"""
        try:
            blob_client = self.blob_client.get_blob_client(container_name, blob_name)
            properties = blob_client.get_blob_properties()

            return {
                "name": blob_name,
                "size": properties.size,
                "tags": properties.metadata
                or {},  # Tags are stored in metadata for some operations
                "exists": True,
            }
        except Exception:
            return None

    def generate_normalized_name(self, blob_name: str, tags: Dict[str, str]) -> str:
        """Generate normalized filename from tags"""
        year = tags.get("year", "unknown")
        source_org = tags.get("source_org", "unknown")

        # Clean up the values
        year = year.strip() if year != "unknown" else "unknown"
        source_org = (
            source_org.strip().lower().replace(" ", "_")
            if source_org != "unknown"
            else "unknown"
        )

        # Create new filename
        base_name = os.path.basename(blob_name)
        return f"{year}-{source_org}-{base_name}"

    def calculate_checksum(self, container_name: str, blob_name: str) -> Optional[str]:
        """Calculate MD5 checksum of blob content"""
        try:
            blob_client = self.blob_client.get_blob_client(container_name, blob_name)
            download_stream = blob_client.download_blob()

            # Calculate MD5 hash
            hash_md5 = hashlib.md5()
            for chunk in download_stream.chunks():
                hash_md5.update(chunk)

            return hash_md5.hexdigest()
        except Exception as e:
            print(f"Error calculating checksum for {blob_name}: {e}", file=sys.stderr)
            return None

    def normalize_blob_filename(
        self, container_name: str, blob_name: str, dry_run: bool = True
    ) -> Dict[str, Any]:
        """
        Normalize a single blob's filename based on its tags
        Returns operation result
        """
        result = {
            "blob_name": blob_name,
            "normalized_name": None,
            "action": "skipped",
            "reason": None,
            "checksum_match": None,
        }

        # Get blob with tags
        blob_info = self.get_blob_with_tags(container_name, blob_name)
        if not blob_info:
            result["reason"] = "blob_not_found"
            return result

        tags = blob_info.get("tags", {})
        if not tags:
            result["reason"] = "no_tags"
            return result

        # Generate normalized name
        normalized_name = self.generate_normalized_name(blob_name, tags)

        # Skip if already normalized
        if normalized_name == blob_name:
            result["reason"] = "already_normalized"
            return result

        result["normalized_name"] = normalized_name

        if dry_run:
            result["action"] = "dry_run"
            result["reason"] = "would_rename"
            return result

        # Perform the rename (copy + delete)
        try:
            # Calculate source checksum
            source_checksum = self.calculate_checksum(container_name, blob_name)
            if not source_checksum:
                result["reason"] = "checksum_failed"
                return result

            # Copy to new name
            source_client = self.blob_client.get_blob_client(container_name, blob_name)
            dest_client = self.blob_client.get_blob_client(
                container_name, normalized_name
            )

            # Start copy operation
            dest_client.start_copy_from_url(source_client.url)

            # Wait for copy to complete (simplified - in production you'd poll)
            import time

            time.sleep(2)  # Basic wait

            # Verify copy succeeded and checksum matches
            dest_checksum = self.calculate_checksum(container_name, normalized_name)
            if dest_checksum != source_checksum:
                result["reason"] = "checksum_mismatch"
                result["checksum_match"] = False
                # Clean up failed copy
                try:
                    dest_client.delete_blob()
                except Exception:
                    pass
                return result

            # Delete original
            source_client.delete_blob()

            result["action"] = "renamed"
            result["checksum_match"] = True

        except Exception as e:
            result["reason"] = f"rename_failed: {str(e)}"

        return result

    def normalize_container(
        self,
        container_name: str,
        prefix: str = "",
        dry_run: bool = True,
        max_blobs: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Normalize filenames for all blobs in container matching criteria
        """
        results = []

        try:
            container_client = self.blob_client.get_container_client(container_name)

            # List blobs with tags
            blobs = container_client.list_blobs(include=["tags"], max_results=max_blobs)

            for blob in blobs:
                if prefix and not blob.name.startswith(prefix):
                    continue

                result = self.normalize_blob_filename(
                    container_name, blob.name, dry_run
                )
                results.append(result)

                # Progress indicator
                status = result["action"].upper()
                print(
                    f"[{status}] {blob.name} -> {result.get('normalized_name', 'N/A')}"
                )

        except Exception as e:
            print(f"Error processing container {container_name}: {e}", file=sys.stderr)

        return results


def main():
    parser = argparse.ArgumentParser(
        description="Azure Blob Storage Filename Normalization Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run on education folder
  %(prog)s --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \\
           --container edu-content --prefix education/ --dry-run

  # Normalize files in production
  %(prog)s --account-url "https://myaccount.blob.core.windows.net" \\
           --container edu-content --prefix education/ --max-blobs 50

  # Normalize specific file
  %(prog)s --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \\
           --container edu-content --blob "education/guideline.pdf"
        """,
    )

    # Authentication
    auth_group = parser.add_mutually_exclusive_group(required=True)
    auth_group.add_argument(
        "--connection-string", help="Azure Storage connection string"
    )
    auth_group.add_argument(
        "--account-url", help="Azure Storage account URL (uses DefaultAzureCredential)"
    )

    # Target specification
    parser.add_argument("--container", required=True, help="Blob container name")
    parser.add_argument(
        "--prefix", default="", help="Blob prefix to filter (e.g., education/)"
    )
    parser.add_argument(
        "--blob", help="Specific blob name to normalize (alternative to prefix)"
    )

    # Options
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Show what would be done without making changes (default: enabled)",
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_false",
        dest="dry_run",
        help="Actually perform the normalization",
    )
    parser.add_argument(
        "--max-blobs",
        type=int,
        default=100,
        help="Maximum number of blobs to process (default: 100)",
    )

    args = parser.parse_args()

    try:
        # Initialize normalizer
        normalizer = BlobFilenameNormalizer(
            connection_string=args.connection_string, account_url=args.account_url
        )

        print("🔄 Starting filename normalization")
        print(f"Container: {args.container}")
        print(f"Prefix: {args.prefix or '(all)'}")
        print(f"Dry run: {args.dry_run}")
        print(f"Max blobs: {args.max_blobs}")
        print()

        if args.blob:
            # Normalize single blob
            result = normalizer.normalize_blob_filename(
                args.container, args.blob, args.dry_run
            )
            print(f"Result: {result}")
        else:
            # Normalize container
            results = normalizer.normalize_container(
                args.container, args.prefix, args.dry_run, args.max_blobs
            )

            # Summary
            actions = {}
            for result in results:
                actions[result["action"]] = actions.get(result["action"], 0) + 1

            print()
            print("📊 Summary:")
            for action, count in actions.items():
                print(f"  {action}: {count}")

            if args.dry_run:
                print("\n💡 Use --no-dry-run to perform actual renaming")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
