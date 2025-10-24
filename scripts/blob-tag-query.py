#!/usr/bin/env python3

"""
Azure Blob Storage Tag Query and Review Utilities
Provides tools for querying blobs by tags, exporting review candidates, and sampling downloads
"""

import argparse
import csv
import json
import os
import random
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


class BlobTagQuery:
    """Azure Blob Storage tag-based query utilities"""

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

    def query_blobs_by_tags(
        self, container_name: str, tag_filters: Dict[str, str], max_results: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Query blobs by index tags
        tag_filters: dict of tag_name -> expected_value
        """
        blobs = []

        try:
            # List all blobs with their tags
            blob_list = self.blob_client.get_container_client(
                container_name
            ).list_blobs(include=["tags"], max_results=max_results)

            for blob in blob_list:
                if blob.tags:
                    # Check if blob matches all tag filters
                    matches = all(
                        blob.tags.get(tag_name) == expected_value
                        for tag_name, expected_value in tag_filters.items()
                    )

                    if matches:
                        blobs.append(
                            {
                                "name": blob.name,
                                "size": blob.size,
                                "last_modified": blob.last_modified.isoformat()
                                if blob.last_modified
                                else None,
                                "tags": blob.tags,
                                "container": container_name,
                            }
                        )

        except Exception as e:
            print(f"Error querying blobs: {e}", file=sys.stderr)
            return []

        return blobs

    def export_needs_review(self, container_name: str, output_file: str) -> int:
        """Export all blobs with needs_review=yes to CSV"""
        review_blobs = self.query_blobs_by_tags(
            container_name,
            {"needs_review": "yes"},
            max_results=10000,  # Higher limit for review export
        )

        if not review_blobs:
            print("No blobs found needing review")
            return 0

        # Write to CSV
        fieldnames = ["name", "size", "last_modified", "container"] + [
            f"tag_{k}" for k in review_blobs[0]["tags"].keys()
        ]

        with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for blob in review_blobs:
                row = {
                    "name": blob["name"],
                    "size": blob["size"],
                    "last_modified": blob["last_modified"],
                    "container": blob["container"],
                }

                # Add tag columns
                for tag_name, tag_value in blob["tags"].items():
                    row[f"tag_{tag_name}"] = tag_value

                writer.writerow(row)

        print(f"Exported {len(review_blobs)} blobs needing review to {output_file}")
        return len(review_blobs)

    def sample_download(
        self,
        container_name: str,
        tag_filters: Dict[str, str],
        sample_size: int = 25,
        output_dir: str = "samples",
    ) -> List[str]:
        """
        Download a random sample of blobs matching tag filters
        Returns list of downloaded file paths
        """
        matching_blobs = self.query_blobs_by_tags(
            container_name, tag_filters, max_results=10000
        )

        if not matching_blobs:
            print("No blobs found matching criteria")
            return []

        # Random sample
        sample = random.sample(matching_blobs, min(sample_size, len(matching_blobs)))

        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        downloaded_files = []

        for blob in sample:
            try:
                blob_client = self.blob_client.get_blob_client(
                    container=container_name, blob=blob["name"]
                )

                # Download to file
                local_path = os.path.join(output_dir, os.path.basename(blob["name"]))
                with open(local_path, "wb") as download_file:
                    download_stream = blob_client.download_blob()
                    download_file.write(download_stream.readall())

                downloaded_files.append(local_path)
                print(f"Downloaded: {blob['name']} -> {local_path}")

            except Exception as e:
                print(f"Error downloading {blob['name']}: {e}", file=sys.stderr)

        print(f"Downloaded {len(downloaded_files)} sample files to {output_dir}")
        return downloaded_files

    def run_arbitrary_query(
        self, container_name: str, query_json: str
    ) -> List[Dict[str, Any]]:
        """Run arbitrary tag query from JSON string"""
        try:
            tag_filters = json.loads(query_json)
            return self.query_blobs_by_tags(container_name, tag_filters)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON query: {e}", file=sys.stderr)
            return []


def main():
    parser = argparse.ArgumentParser(
        description="Azure Blob Storage Tag Query and Review Utilities",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export all files needing review
  %(prog)s --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \\
           --container edu-content --export-review review_candidates.csv

  # Query by specific tags
  %(prog)s --account-url "https://myaccount.blob.core.windows.net" \\
           --container edu-content --query '{"docType": "guideline", "condition": "ACS"}'

  # Sample download 10 cardiology files
  %(prog)s --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \\
           --container edu-content --sample-download 10 \\
           --query '{"condition": "cardiology_general"}' --output-dir cardiology_samples
        """,
    )

    # Authentication options
    auth_group = parser.add_mutually_exclusive_group(required=True)
    auth_group.add_argument(
        "--connection-string", help="Azure Storage connection string"
    )
    auth_group.add_argument(
        "--account-url", help="Azure Storage account URL (uses DefaultAzureCredential)"
    )

    # Container specification
    parser.add_argument("--container", required=True, help="Blob container name")

    # Operations
    parser.add_argument(
        "--export-review",
        metavar="FILE",
        help="Export blobs with needs_review=yes to CSV file",
    )
    parser.add_argument(
        "--query",
        metavar="JSON",
        help="Query blobs by tags (JSON object of tag filters)",
    )
    parser.add_argument(
        "--sample-download",
        type=int,
        metavar="COUNT",
        help="Download random sample of matching blobs",
    )
    parser.add_argument(
        "--output-dir",
        default="samples",
        help="Output directory for downloads (default: samples)",
    )

    args = parser.parse_args()

    try:
        # Initialize client
        query_tool = BlobTagQuery(
            connection_string=args.connection_string, account_url=args.account_url
        )

        # Execute requested operations
        if args.export_review:
            count = query_tool.export_needs_review(args.container, args.export_review)
            print(f"Review export complete: {count} files")

        if args.query:
            results = query_tool.run_arbitrary_query(args.container, args.query)
            print(f"Query results: {len(results)} blobs")
            if results:
                print("Sample results:")
                for blob in results[:5]:  # Show first 5
                    print(f"  {blob['name']} (tags: {blob['tags']})")
                if len(results) > 5:
                    print(f"  ... and {len(results) - 5} more")

        if args.sample_download:
            if not args.query:
                parser.error(
                    "--sample-download requires --query to specify which blobs to sample"
                )

            downloaded = query_tool.sample_download(
                args.container,
                json.loads(args.query),
                args.sample_download,
                args.output_dir,
            )
            print(f"Sample download complete: {len(downloaded)} files")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
