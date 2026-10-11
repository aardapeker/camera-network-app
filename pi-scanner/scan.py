#!/usr/bin/env python3
"""Runs periodic nmap host-discovery scans and POSTs results to the backend.

Deployed on the Raspberry Pi at /opt/pi-scanner/scan.py, run as a systemd
service (see pi-scanner.service). Config comes from environment variables
(see pi-scanner.env.example).
"""

import os
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests

BACKEND_URL = os.environ["BACKEND_URL"].rstrip("/")
API_KEY = os.environ["API_KEY"]
# Comma-separated for multi-block sites, e.g. "192.168.1.0/24,192.168.2.0/24".
# nmap accepts multiple targets in one invocation, so all blocks are scanned
# together in a single pass rather than one nmap call per subnet.
SUBNETS = [s.strip() for s in os.environ["SUBNET"].split(",") if s.strip()]
SOURCE_ID = os.environ.get("SOURCE_ID", "pi-scanner")
INTERVAL_SECONDS = int(os.environ.get("INTERVAL_SECONDS", "60"))


def run_scan():
    result = subprocess.run(
        ["nmap", "-sn", *SUBNETS, "-oX", "-"],
        capture_output=True,
        text=True,
        check=True,
        timeout=INTERVAL_SECONDS * 3,
    )
    return parse_hosts(result.stdout)


def parse_hosts(xml_output):
    root = ET.fromstring(xml_output)
    hosts = []
    for host in root.findall("host"):
        status = host.find("status")
        if status is None or status.get("state") != "up":
            continue

        ip = None
        mac = None
        vendor = None
        for address in host.findall("address"):
            addrtype = address.get("addrtype")
            if addrtype == "ipv4":
                ip = address.get("addr")
            elif addrtype == "mac":
                mac = address.get("addr")
                vendor = address.get("vendor")

        if ip is None:
            continue

        hostname = None
        hostnames_el = host.find("hostnames")
        if hostnames_el is not None:
            hostname_el = hostnames_el.find("hostname")
            if hostname_el is not None:
                hostname = hostname_el.get("name")

        hosts.append({
            "ip": ip,
            "mac": mac,
            "vendor": vendor,
            "hostname": hostname,
            "ports": [],
        })
    return hosts


def report(hosts):
    payload = {
        "sourceId": SOURCE_ID,
        "subnet": ",".join(SUBNETS),
        # Backend deserializes this into java.time.LocalDateTime, which rejects
        # an ISO offset suffix - send a naive UTC timestamp instead.
        "scannedAt": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        "hosts": hosts,
    }
    response = requests.post(
        f"{BACKEND_URL}/api/network-scans",
        json=payload,
        headers={"X-API-Key": API_KEY},
        timeout=10,
    )
    response.raise_for_status()


def main():
    print(f"pi-scanner starting: subnets={SUBNETS} backend={BACKEND_URL} interval={INTERVAL_SECONDS}s", flush=True)
    while True:
        cycle_start = time.monotonic()
        try:
            hosts = run_scan()
            if hosts:
                report(hosts)
                print(f"reported {len(hosts)} host(s)", flush=True)
            else:
                print("scan found no hosts, skipping report", flush=True)
        except Exception as exc:
            print(f"scan/report cycle failed: {exc}", file=sys.stderr, flush=True)

        elapsed = time.monotonic() - cycle_start
        if elapsed > INTERVAL_SECONDS:
            print(
                f"cycle took {elapsed:.1f}s, longer than INTERVAL_SECONDS={INTERVAL_SECONDS}s - "
                "scanning back-to-back with no idle time, consider raising the interval",
                file=sys.stderr, flush=True,
            )
        time.sleep(max(0, INTERVAL_SECONDS - elapsed))


if __name__ == "__main__":
    main()
