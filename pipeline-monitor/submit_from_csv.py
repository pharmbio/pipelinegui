#!/usr/bin/env python3
"""
Submit image analyses periodically using pipeline-monitor.py:submit_analysis.

Usage (from repo root):
    python pipeline-monitor/submit_from_csv.py path/to/jobs.csv [--interval-minutes N]

The CSV file must have a header row with at least:
    plate_acquisition,analysis_pipeline_name,cellprofiler_version

Optional columns (will default if missing/empty):
    well_filter,site_filter,z_plane,priority,
    run_on_uppmax,run_on_pharmbio,run_on_haswell,run_on_pelle,run_on_hpcdev,
    run_location,submitted_by

Every xx minutes the next row is submitted via submit_analysis.
"""

import csv
import logging
import sys
import time
import argparse
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline_monitor import submit_analysis


INTERVAL_SECONDS = 240 * 60  # default: 240 minutes (4 hours)


def _to_bool(value: Optional[str]) -> bool:
    if value is None:
        return False
    v = str(value).strip().lower()
    return v in {"1", "true", "yes", "y", "on"}


def read_jobs(csv_path: Path) -> List[Dict[str, Any]]:
    with csv_path.open(newline="") as f:
        reader = csv.DictReader(f)
        jobs: List[Dict[str, Any]] = []
        for row in reader:
            if not row:
                continue
            jobs.append(row)
    return jobs


def submit_jobs(jobs: List[Dict[str, Any]], interval_seconds: int = INTERVAL_SECONDS) -> None:
    for idx, job in enumerate(jobs, start=1):
        logging.info("Submitting job %s/%s", idx, len(jobs))

        try:
            plate_acq = int(job.get("plate_acquisition", "").strip())
        except ValueError:
            logging.error("Invalid plate_acquisition in row %s: %r", idx, job.get("plate_acquisition"))
            continue

        pipeline_name = (job.get("analysis_pipeline_name") or "").strip()
        cp_version = (job.get("cellprofiler_version") or "").strip()

        if not pipeline_name or not cp_version:
            logging.error("Missing required fields in row %s: %r", idx, job)
            continue

        well_filter = (job.get("well_filter") or "").strip()
        site_filter = (job.get("site_filter") or "").strip()
        z_plane = (job.get("z_plane") or "").strip()
        priority_string = (job.get("priority") or "").strip()
        run_on_uppmax = _to_bool(job.get("run_on_uppmax"))
        run_on_pharmbio = _to_bool(job.get("run_on_pharmbio"))
        run_on_haswell = _to_bool(job.get("run_on_haswell"))
        run_on_pelle = _to_bool(job.get("run_on_pelle"))
        run_on_hpcdev = _to_bool(job.get("run_on_hpcdev"))
        run_location = (job.get("run_location") or "").strip() or None
        submitted_by = (job.get("submitted_by") or "").strip() or None

        logging.info(
            "Calling submit_analysis(plate_acquisition=%s, pipeline_name=%s, cellprofiler_version=%s, "
            "well_filter=%s, site_filter=%s, z_plane=%s, priority=%s, run_on_uppmax=%s, "
            "run_on_pharmbio=%s, run_on_haswell=%s, run_on_pelle=%s, run_on_hpcdev=%s, run_location=%s, submitted_by=%s)",
            plate_acq,
            pipeline_name,
            cp_version,
            well_filter,
            site_filter,
            z_plane,
            priority_string,
            run_on_uppmax,
            run_on_pharmbio,
            run_on_haswell,
            run_on_pelle,
            run_on_hpcdev,
            run_location,
            submitted_by,
        )

        result = submit_analysis(  # type: ignore[misc]
            plate_acq,
            pipeline_name,
            cp_version,
            well_filter,
            site_filter,
            z_plane,
            priority_string,
            run_on_uppmax,
            run_on_pharmbio,
            run_on_haswell,
            run_on_pelle,
            run_on_hpcdev,
            run_location,
            submitted_by=submitted_by,
        )

        logging.info("submit_analysis result: %r", result)

        if idx < len(jobs):
            logging.info("Sleeping %s seconds before next job", interval_seconds)
            time.sleep(interval_seconds)


def main(argv: List[str]) -> None:
    parser = argparse.ArgumentParser(
        description="Submit image analyses periodically from a CSV file."
    )
    parser.add_argument(
        "csv_path",
        help="Path to the jobs CSV file",
    )
    parser.add_argument(
        "--interval-minutes",
        type=float,
        default=None,
        help=(
            "Minutes to sleep between job submissions. "
            f"Defaults to {INTERVAL_SECONDS / 60:.0f} minutes."
        ),
    )

    args = parser.parse_args(argv[1:])

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}")
        sys.exit(1)

    interval_seconds = INTERVAL_SECONDS
    if args.interval_minutes is not None:
        if args.interval_minutes < 0:
            print(f"Invalid --interval-minutes: {args.interval_minutes!r} (must be non-negative)")
            sys.exit(1)
        interval_seconds = int(args.interval_minutes * 60)

    logging.basicConfig(
        format="%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
        datefmt="%H:%M:%S",
        level=logging.INFO,
    )

    logging.info("Reading jobs from %s", csv_path)
    jobs = read_jobs(csv_path)
    if not jobs:
        logging.info("No jobs found in CSV, exiting")
        return

    submit_jobs(jobs, interval_seconds=interval_seconds)


if __name__ == "__main__":
    main(sys.argv)
