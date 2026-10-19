#!/usr/bin/env python3
"""Inspect the public CC-BY-4.0 CTA archive using HTTP byte ranges.

Default operation reads its ZIP directory, not the 25.6 GB image archive.
Optional --stl downloads only the named STL entry and verifies its ZIP CRC.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

RECORD = "https://zenodo.org/api/records/15697196"


class RemoteZip(io.RawIOBase):
    def __init__(self, url, size):
        self.url, self.size, self.position = url, size, 0
        self.bytes_read = 0

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else self.size + offset
        if self.position < 0:
            raise ValueError("Negative ZIP offset")
        return self.position

    def read(self, count=-1):
        count = self.size - self.position if count < 0 else min(count, self.size - self.position)
        if not count:
            return b""
        if count > 32 * 1024 * 1024:
            raise ValueError("Refusing a range larger than 32 MB")
        start = self.position
        request = urllib.request.Request(self.url, headers={"Range": f"bytes={start}-{start + count - 1}"})
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status != 206 or not response.headers.get("Content-Range", "").startswith(f"bytes {start}-"):
                raise ValueError("Server did not honor the requested byte range; full archive download refused")
            result = response.read(count + 1)
        if len(result) != count:
            raise ValueError("Truncated or oversized range")
        self.position += count
        self.bytes_read += count
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--stl", help="Exact archive entry from a previous report")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    with urllib.request.urlopen(RECORD, timeout=30) as response:
        record = json.load(response)
    if record["metadata"]["license"]["id"] != "cc-by-4.0":
        parser.error("Unexpected dataset license")
    file = next(item for item in record["files"] if item["key"] == "Dataset.zip")
    remote = RemoteZip(file["links"]["self"], file["size"])
    with zipfile.ZipFile(remote) as archive:
        meshes = [item for item in archive.infolist() if item.filename.lower().endswith(".stl")]
        report = {"record": RECORD, "doi": "10.5281/zenodo.15697196", "license": "CC-BY-4.0",
            "archiveSize": file["size"], "archiveChecksum": file["checksum"],
            "archiveChecksumVerified": False, "stlCount": len(meshes),
            "meshes": [{"entry": item.filename, "size": item.file_size, "compressedSize": item.compress_size, "crc32": f"{item.CRC:08x}"} for item in meshes]}
        if args.stl:
            if not args.output or args.stl not in {item.filename for item in meshes}:
                parser.error("--stl must name an indexed STL and --output is required")
            info = archive.getinfo(args.stl)
            if info.file_size > 32 * 1024 * 1024:
                parser.error("STL exceeds the 32 MB download limit")
            content = archive.read(info)  # zipfile verifies uncompressed length and CRC32
            args.output.write_bytes(content)
            report["downloaded"] = {"entry": info.filename, "sha256": hashlib.sha256(content).hexdigest(), "crcVerified": True}
        report["bytesFetched"] = remote.bytes_read
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ["stlCount", "bytesFetched", "archiveSize"]}))


if __name__ == "__main__":
    main()
