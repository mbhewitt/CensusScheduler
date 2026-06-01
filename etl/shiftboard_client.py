"""Minimal standalone Shiftboard client.

Extracted from census-python/app/services/shiftboard_service.py for use by
the prod ETL scripts. Drops the SQLAlchemy and app.core dependencies; this
file only does HTTP I/O + TSV parsing.

Public surface:
    ShiftboardClient(user, password, session_id)
        .authenticate()                -> bool
        .download_profiles(group_id)   -> list[dict]   # parsed TSV rows
        .add_member_to_census(id)      -> bool         # move to group 597584
        .remove_member_from_intake(id) -> bool         # remove from group 602158

Groups:
    CENSUS_TEAM_GROUP = 597584   # Active Census Team
    INTAKE_GROUP      = 602158   # Pending intake

The TSV response uses Shiftboard's report.cgi `format=new_excel` endpoint,
which despite the name returns tab-delimited text.
"""

from __future__ import annotations

import io
import logging
from typing import Any

import httpx
import openpyxl

logger = logging.getLogger(__name__)

CENSUS_TEAM_GROUP = 597584
INTAKE_GROUP = 602158
DEFAULT_SS = "534228"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.5",
    "Origin": "https://www.shiftboard.com",
    "Referer": "https://www.shiftboard.com/BurningMan/",
}


class ShiftboardError(RuntimeError):
    pass


class ShiftboardClient:
    def __init__(
        self,
        user: str,
        password: str,
        session_id: str = DEFAULT_SS,
        timeout: float = 60.0,
    ):
        self._user = user
        self._password = password
        self._ss = session_id
        self._timeout = timeout
        self._cookies: dict[str, str] | None = None

    # ---------------------------------------------------------------- auth

    def authenticate(self) -> bool:
        """POST credentials, capture SB2Session cookie."""
        headers = {**_HEADERS, "Content-Type": "application/x-www-form-urlencoded"}
        with httpx.Client(
            follow_redirects=True, timeout=self._timeout, headers=headers
        ) as client:
            client.get("https://www.shiftboard.com/BurningMan/")
            resp = client.post(
                "https://app.shiftboard.com/servola/auth.cgi",
                data={
                    "ss": self._ss,
                    "auth_user": self._user,
                    "auth_password": self._password,
                },
            )
            if "/errors/" in str(resp.url) or resp.status_code >= 400:
                logger.error(
                    "Shiftboard login landed at error page: %s (status %s)",
                    resp.url, resp.status_code,
                )
                return False
            if "SB2Session" not in client.cookies:
                logger.error(
                    "Shiftboard login: no SB2Session cookie returned; cookies=%s",
                    list(client.cookies.keys()),
                )
                return False
            self._cookies = dict(client.cookies)
            logger.info("Shiftboard auth OK (SB2Session captured)")
            return True

    # ------------------------------------------------------------- download

    def _get_bytes(self, url: str) -> bytes | None:
        if not self._cookies:
            raise ShiftboardError("not authenticated; call authenticate() first")
        with httpx.Client(
            headers=_HEADERS, cookies=self._cookies, timeout=self._timeout,
        ) as client:
            resp = client.get(url, follow_redirects=True)
            final_url = str(resp.url)
            if "/errors/" in final_url or resp.status_code >= 400:
                logger.error("GET %s -> %s (final %s)", url, resp.status_code, final_url)
                return None
            return resp.content

    def _post(self, url: str, data: dict) -> bool:
        if not self._cookies:
            raise ShiftboardError("not authenticated; call authenticate() first")
        with httpx.Client(
            headers=_HEADERS, cookies=self._cookies, timeout=self._timeout,
            follow_redirects=False,
        ) as client:
            resp = client.post(url, data=data)
            if resp.status_code in (301, 302, 303, 307, 308):
                location = resp.headers.get("location", "")
                if any(s in location for s in ("/errors/", "403", "404", "login")):
                    logger.error("POST %s -> redirect to %s", url, location)
                    return False
                # Following redirect counts as success; Shiftboard form actions
                # typically redirect to the same admin page on success.
                return True
            if resp.status_code < 400:
                return True
            logger.error("POST %s -> status %s", url, resp.status_code)
            return False

    def download_profiles(self, group_id: int = CENSUS_TEAM_GROUP) -> list[dict[str, Any]]:
        """Download + parse the profile XLSX for a given group.

        Despite the URL implying an "Excel" download, the response is a real
        binary xlsx (ZIP archive starting with PK\\x03\\x04), not TSV.
        """
        url = (
            "https://www.shiftboard.com/servola/reporting/report.cgi"
            f"?download=1&type=profile&uncrypt=1&profile_type_id=1"
            f"&group={group_id}&ss={self._ss}"
        )
        content = self._get_bytes(url)
        if not content:
            raise ShiftboardError(f"download_profiles({group_id}) returned empty content")
        return _parse_profile_xlsx(content)

    # ----------------------------------------------------- group membership

    def add_member_to_census(self, shiftboard_id: int) -> bool:
        """Move a volunteer into the Active Census Team group."""
        # Shiftboard's group-membership admin endpoint POSTs to security.cgi
        # with form fields matching the admin UI. See censusload.php
        # addmembers() for the original PHP version.
        url = "https://www.shiftboard.com/servola/admin/security.cgi"
        return self._post(url, {
            "group": str(CENSUS_TEAM_GROUP),
            "memnum": str(shiftboard_id),
            "ss": self._ss,
            "action": "add_member",
        })

    def remove_member_from_intake(self, shiftboard_id: int) -> bool:
        """Remove a volunteer from the Intake group."""
        url = "https://www.shiftboard.com/servola/admin/security.cgi"
        return self._post(url, {
            "group": str(INTAKE_GROUP),
            "memnum": str(shiftboard_id),
            "ss": self._ss,
            "action": "remove_member",
        })


# --------------------------------------------------------- TSV parsing

def _parse_profile_xlsx(content: bytes) -> list[dict[str, Any]]:
    """Parse Shiftboard's xlsx-formatted profile export.

    Column names from Shiftboard's standard "profile" report. If they
    change upstream, normalize_keys() is where to look.
    """
    profiles: list[dict[str, Any]] = []
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active
    rows_iter = ws.iter_rows(values_only=True)
    try:
        header = [str(c).strip() if c is not None else "" for c in next(rows_iter)]
    except StopIteration:
        return profiles
    for raw in rows_iter:
        row = {header[i]: raw[i] for i in range(min(len(header), len(raw)))}
        sb_id = _to_int(row.get("Shiftboard ID"))
        if not sb_id:
            continue
        email = _to_str(
            row.get("Email") or row.get("Receives Email") or ""
        ).strip().lower()
        if not email:
            continue
        playaname = _to_str(
            row.get("Playa Name/AKA")
            or row.get("Playa Name")
            or row.get("AKA")
            or ""
        )
        profiles.append({
            "shiftboard_id": sb_id,
            "playaname": playaname,
            "first": _to_str(row.get("First Name")),
            "last": _to_str(row.get("Last Name")),
            "standing": _to_str(row.get("Standing")),
            "email": email,
            "phone_mobile": _to_str(row.get("Mobile Phone")),
            "phone_home": _to_str(row.get("Home Phone")),
            "address": _to_str(row.get("Address")),
            "city": _to_str(row.get("City")),
            "state": _to_str(row.get("State")),
            "country": _to_str(row.get("Country")),
            "zip": _to_str(row.get("Zip")),
            "last_updated": _to_str(row.get("Last Updated")) or None,
        })
    wb.close()
    return profiles


def _to_int(v: Any) -> int:
    if v is None:
        return 0
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def _to_str(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()
