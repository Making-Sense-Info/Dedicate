"""HTTP wrapper around Dedicator invoke.sh / invoke.ps1 (Saxon-HE + Sparna shacl-play)."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DEFAULT_SHAPES_URL = (
    "https://data.health.europa.eu/healthdcat-ap/releases/release-8/"
    "html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/"
    "non-public-shapes.ttl"
)

API_DIR = Path(__file__).resolve().parent
ROOT = API_DIR.parents[1]
IS_WINDOWS = sys.platform.startswith("win")
INVOKE_SH = API_DIR / "invoke.sh"
INVOKE_PS1 = API_DIR / "invoke.ps1"
INVOKE = INVOKE_PS1 if IS_WINDOWS else INVOKE_SH
DEFAULT_XSL = ROOT / "ddi-l-to-healthdcat-ap" / "xsl" / "ddi-lifecycle-to-dcat-ap.xsl"
STATIC_DIR = API_DIR.parent / "web" / "dist"

MAX_UPLOAD_BYTES = int(os.environ.get("DEDICATOR_MAX_UPLOAD_BYTES", 25 * 1024 * 1024))
RUN_TIMEOUT_SEC = int(os.environ.get("DEDICATOR_TIMEOUT_SEC", 180))
FETCH_TIMEOUT_SEC = int(os.environ.get("DEDICATOR_FETCH_TIMEOUT_SEC", 60))
SHACL_JAR = os.environ.get("SHACL_JAR", "").strip()
DEFAULT_SHAPES = os.environ.get("SHACL_SHAPES", DEFAULT_SHAPES_URL).strip()

app = FastAPI(title="Dedicator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("DEDICATOR_CORS", "*").split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _read_upload(upload: UploadFile | None, limit: int = MAX_UPLOAD_BYTES) -> bytes | None:
    if upload is None:
        return None
    filename = (upload.filename or "").strip()
    if not filename:
        # Empty multipart file field
        return None
    data = await upload.read()
    if not data:
        return None
    if len(data) > limit:
        raise HTTPException(413, f"Upload too large (max {limit} bytes)")
    return data


def _fetch_url(url: str, *, limit: int = MAX_UPLOAD_BYTES) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Dedicator/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT_SEC) as resp:
            data = resp.read(limit + 1)
    except urllib.error.URLError as exc:
        raise HTTPException(422, f"Failed to fetch URL: {url} ({exc})") from exc
    if len(data) > limit:
        raise HTTPException(413, f"Remote file too large (max {limit} bytes): {url}")
    if not data:
        raise HTTPException(422, f"Empty response from URL: {url}")
    return data


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "platform": "windows" if IS_WINDOWS else "posix",
        "invoke": INVOKE.is_file(),
        "invokeScript": INVOKE.name,
        "default_xsl": DEFAULT_XSL.is_file(),
        "shacl_jar": bool(SHACL_JAR and Path(SHACL_JAR).is_file()),
        "default_shapes": DEFAULT_SHAPES,
        "java": shutil.which("java") is not None,
    }


def _build_invoke_cmd(
    *,
    ddi_path: Path,
    out_ttl: Path,
    xsl_path: Path,
    do_validate: bool,
    shapes_arg: str,
    report_html: Path,
) -> list[str]:
    if IS_WINDOWS:
        cmd = [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(INVOKE_PS1),
            "-InputPath",
            str(ddi_path),
            "-OutputPath",
            str(out_ttl),
            "-Xsl",
            str(xsl_path),
        ]
        if do_validate and SHACL_JAR and Path(SHACL_JAR).is_file():
            cmd += [
                "-ShaclJar",
                SHACL_JAR,
                "-Shapes",
                shapes_arg,
                "-Report",
                str(report_html),
            ]
        return cmd

    cmd = [
        "bash",
        str(INVOKE_SH),
        "--input",
        str(ddi_path),
        "--output",
        str(out_ttl),
        "--xsl",
        str(xsl_path),
    ]
    if do_validate and SHACL_JAR and Path(SHACL_JAR).is_file():
        cmd += [
            "--shacl-jar",
            SHACL_JAR,
            "--shapes",
            shapes_arg,
            "--report",
            str(report_html),
        ]
    return cmd


@app.post("/api/run")
async def run_pipeline(
    ddi: UploadFile | None = File(None, description="DDI Lifecycle 3.3 XML (file)"),
    xsl: UploadFile | None = File(None, description="Optional XSLT override (file)"),
    shapes: UploadFile | None = File(None, description="Optional SHACL shapes Turtle (file)"),
    ddi_url: str | None = Form(None),
    xsl_url: str | None = Form(None),
    shapes_url: str | None = Form(None),
    run_validation: str = Form("true"),
) -> dict:
    """Run Saxon transform (+ Sparna validate when SHACL_JAR is set and run_validation=true)."""
    if not INVOKE.is_file():
        raise HTTPException(500, f"Invoke script not found at {INVOKE}")
    if not DEFAULT_XSL.is_file():
        raise HTTPException(500, f"Default XSL not found at {DEFAULT_XSL}")

    do_validate = run_validation.lower() in {"1", "true", "yes", "on"}
    ddi_bytes = await _read_upload(ddi)
    xsl_bytes = await _read_upload(xsl)
    shapes_bytes = await _read_upload(shapes)

    ddi_url_clean = (ddi_url or "").strip()
    xsl_url_clean = (xsl_url or "").strip()
    if not ddi_bytes and ddi_url_clean:
        ddi_bytes = _fetch_url(ddi_url_clean)
    if not xsl_bytes and xsl_url_clean:
        xsl_bytes = _fetch_url(xsl_url_clean)

    if not ddi_bytes:
        raise HTTPException(400, "Provide a DDI file upload or ddi_url")

    work = Path(tempfile.mkdtemp(prefix="dedicator-"))
    try:
        job = uuid.uuid4().hex[:12]
        ddi_path = work / f"{job}.xml"
        out_ttl = work / f"{job}.ttl"
        report_html = work / f"{job}-shacl-report.html"
        ddi_path.write_bytes(ddi_bytes)

        xsl_path = DEFAULT_XSL
        if xsl_bytes:
            xsl_path = work / f"{job}.xsl"
            xsl_path.write_bytes(xsl_bytes)

        shapes_arg = (shapes_url or "").strip() or DEFAULT_SHAPES
        if shapes_bytes:
            shapes_path = work / f"{job}-shapes.ttl"
            shapes_path.write_bytes(shapes_bytes)
            shapes_arg = str(shapes_path)

        cmd = _build_invoke_cmd(
            ddi_path=ddi_path,
            out_ttl=out_ttl,
            xsl_path=xsl_path,
            do_validate=do_validate,
            shapes_arg=shapes_arg,
            report_html=report_html,
        )

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT_SEC,
            )
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(504, f"Pipeline timed out after {RUN_TIMEOUT_SEC}s") from exc

        if proc.returncode != 0 or not out_ttl.is_file():
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Pipeline failed",
                    "stdout": (proc.stdout or "")[-4000:],
                    "stderr": (proc.stderr or "")[-4000:],
                    "code": proc.returncode,
                },
            )

        report_ttl_path = report_html.with_suffix(".ttl")
        return {
            "ok": True,
            "turtle": out_ttl.read_text(encoding="utf-8", errors="replace"),
            "reportHtml": (
                report_html.read_text(encoding="utf-8", errors="replace")
                if report_html.is_file()
                else None
            ),
            "reportTtl": (
                report_ttl_path.read_text(encoding="utf-8", errors="replace")
                if report_ttl_path.is_file()
                else None
            ),
            "validated": report_html.is_file(),
            "log": (proc.stdout or "")[-2000:],
            "shapes": shapes_arg if do_validate else None,
            "shaclConfigured": bool(SHACL_JAR and Path(SHACL_JAR).is_file()),
        }
    finally:
        shutil.rmtree(work, ignore_errors=True)


if STATIC_DIR.is_dir():
    assets = STATIC_DIR / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(404)
        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
