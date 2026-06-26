import re
import os
import time
import json
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError

from django.db import connection
from django.core.management.base import BaseCommand, CommandError


def geocode_address(street, city, state):
    parts = [p for p in [street, city, state] if p]
    if not parts:
        return None
    query = ", ".join(parts) + ", Algeria"
    url = f"https://nominatim.openstreetmap.org/search?q={quote(query)}&format=json&limit=1&countrycodes=dz"
    req = Request(url, headers={"User-Agent": "NCS_Hack/1.0"})
    try:
        with urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            if data:
                return (float(data[0]["lat"]), float(data[0]["lon"]))
    except (URLError, json.JSONDecodeError, KeyError, IndexError):
        pass
    return None


def split_sql_values(values_text):
    """Split SQL values string like ('a', 123, NULL, 'it''s') into individual values."""
    values_text = values_text.strip()
    if values_text.startswith("(") and values_text.endswith(")"):
        values_text = values_text[1:-1]

    result = []
    current = ""
    in_str = False
    i = 0
    while i < len(values_text):
        ch = values_text[i]
        if in_str:
            if ch == "\\":
                if i + 1 < len(values_text):
                    current += values_text[i + 1]
                    i += 2
                    continue
                current += ch
                i += 1
                continue
            if ch == "'":
                if i + 1 < len(values_text) and values_text[i + 1] == "'":
                    current += "'"
                    i += 2
                    continue
                else:
                    in_str = False
                    i += 1
                    continue
            current += ch
            i += 1
            continue
        if ch == "'":
            in_str = True
            i += 1
            continue
        if ch == ",":
            result.append(current.strip())
            current = ""
            i += 1
            continue
        if ch not in " \n\r\t":
            current += ch
        i += 1
    if current.strip():
        result.append(current.strip())
    return result


def parse_value(raw):
    if raw is None or raw == "":
        return None
    if raw.upper() == "NULL":
        return None
    if raw.startswith("'") and raw.endswith("'"):
        return raw[1:-1]
    try:
        if "." in raw:
            return float(raw)
        return int(raw)
    except ValueError:
        return raw


def parse_inserts(sql_text, table_name):
    """Yield (columns, row_values) for each INSERT statement found."""
    pattern = (
        r"insert\s+into\s+`?" + re.escape(table_name) + r"`?\s*"
        r"\(([^)]+)\)\s*values\s*"
        r"((?:\((?:[^()]|\([^()]*\))*\))\s*;?)"
    )
    for match in re.finditer(pattern, sql_text, re.IGNORECASE | re.DOTALL):
        cols = [c.strip().strip("`") for c in match.group(1).split(",")]
        values_text = match.group(2).strip().rstrip(";").strip()
        raw_vals = split_sql_values(values_text)
        row = [parse_value(v) for v in raw_vals]
        yield cols, row


class Command(BaseCommand):
    help = "Import lawyer directory data from SQL dump files"

    def add_arguments(self, parser):
        parser.add_argument("sql_dir", type=str)

    def handle(self, *args, **options):
        sql_dir = options["sql_dir"]
        if not os.path.isdir(sql_dir):
            raise CommandError(f"Directory not found: {sql_dir}")

        with connection.cursor() as cursor:

            # --- Import addresses ---
            fpath = os.path.join(sql_dir, "core_address.sql")
            self.stdout.write("Importing addresses ...")
            if not os.path.isfile(fpath):
                self.stdout.write(self.style.ERROR(f"File not found: {fpath}"))
                return

            address_map = {}
            count = 0
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            for cols, row in parse_inserts(content, "core_address"):
                data = dict(zip(cols, row))
                old_id = data.pop("id", None)
                cursor.execute(
                    """INSERT INTO directory_data_address
                       (street, city, state, zip_code, country, latitude, longitude)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                    [data.get(c) for c in ("street","city","state","zip_code","country","latitude","longitude")]
                )
                cursor.execute("SELECT LASTVAL()")
                new_id = cursor.fetchone()[0]
                if old_id is not None:
                    address_map[int(old_id)] = int(new_id)
                count += 1
            self.stdout.write(self.style.SUCCESS(f"  {count} addresses imported"))

            # --- Import users (for lawyer names) ---
            fpath = os.path.join(sql_dir, "auth_user.sql")
            user_names = {}
            if os.path.isfile(fpath):
                self.stdout.write("Reading users ...")
                with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                for cols, row in parse_inserts(content, "auth_user"):
                    data = dict(zip(cols, row))
                    uid = int(data["id"])
                    user_names[uid] = {
                        "first_name": data.get("first_name", "") or "",
                        "last_name": data.get("last_name", "") or "",
                        "email": data.get("email", "") or "",
                    }
                self.stdout.write(self.style.SUCCESS(f"  {len(user_names)} users read"))
            else:
                self.stdout.write(self.style.WARNING("  auth_user.sql not found"))

            # --- Import lawyer profiles ---
            fpath = os.path.join(sql_dir, "core_lawyerprofile.sql")
            self.stdout.write("Importing lawyers ...")
            count = 0
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            for cols, row in parse_inserts(content, "core_lawyerprofile"):
                data = dict(zip(cols, row))
                old_addr = data.get("address_id")
                new_addr = address_map.get(int(old_addr)) if old_addr else None
                uid = data.get("user_id")
                info = user_names.get(int(uid), {}) if uid else {}
                cursor.execute(
                    """INSERT INTO directory_data_lawyerprofile
                       (specialization, approved, address_id,
                        first_name, last_name, rating)
                       VALUES (%s,%s,%s,%s,%s,%s)""",
                    [
                        data.get("specialization", "") or "",
                        bool(int(data["approved"])) if data.get("approved") is not None else None,
                        new_addr,
                        info.get("first_name", ""),
                        info.get("last_name", ""),
                        int(data["rating"]) if data.get("rating") else None,
                    ]
                )
                count += 1
            self.stdout.write(self.style.SUCCESS(f"  {count} lawyers imported"))

        # --- Geocode addresses missing lat/lng ---
        with connection.cursor() as c:
            c.execute(
                "SELECT id, street, city, state FROM directory_data_address "
                "WHERE latitude IS NULL OR longitude IS NULL"
            )
            missing = c.fetchall()
            if missing:
                self.stdout.write(f"Geocoding {len(missing)} addresses ...")
                done = 0
                for row in missing:
                    addr_id, street, city, state = row
                    coords = geocode_address(street, city, state)
                    if coords:
                        c.execute(
                            "UPDATE directory_data_address SET latitude=%s, longitude=%s WHERE id=%s",
                            [coords[0], coords[1], addr_id]
                        )
                        done += 1
                    time.sleep(1.1)
                self.stdout.write(self.style.SUCCESS(f"  Geocoded {done}/{len(missing)} addresses"))
            else:
                self.stdout.write("All addresses already have coordinates")

        self.stdout.write(self.style.SUCCESS("Done!"))
