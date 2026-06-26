import time
import json
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError

from django.db import connection, close_old_connections
from django.core.management.base import BaseCommand


def geocode(query):
    url = f"https://nominatim.openstreetmap.org/search?q={quote(query)}&format=json&limit=1&countrycodes=dz"
    req = Request(url, headers={"User-Agent": "NCS_Hack/1.0"})
    try:
        with urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data:
                return (float(data[0]["lat"]), float(data[0]["lon"]))
    except (URLError, json.JSONDecodeError, KeyError, IndexError):
        pass
    return None


class Command(BaseCommand):
    help = "Geocode all addresses via Nominatim"

    def handle(self, *args, **options):
        with connection.cursor() as c:
            c.execute("SELECT id, street, city, state FROM directory_data_address ORDER BY id")
            rows = c.fetchall()

        self.stdout.write(f"Total addresses: {len(rows)}")
        done = 0
        failed = 0
        total = len(rows)

        for i, (addr_id, street, city, state) in enumerate(rows):
            parts = [p.strip() for p in [street, city, state] if p and p.strip()]
            if not parts:
                failed += 1
                if (i + 1) % 50 == 0:
                    self.stdout.write(f"  {i+1}/{total} (done={done}, failed={failed})")
                time.sleep(1.1)
                continue

            query = ", ".join(parts) + ", Algeria"
            coords = geocode(query)

            try:
                if coords:
                    with connection.cursor() as c:
                        c.execute(
                            "UPDATE directory_data_address SET latitude=%s, longitude=%s WHERE id=%s",
                            [coords[0], coords[1], addr_id]
                        )
                    done += 1
                else:
                    failed += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  DB error on id={addr_id}: {e}"))
                failed += 1

            if (i + 1) % 50 == 0:
                self.stdout.write(f"  {i+1}/{total} (done={done}, failed={failed})")

            close_old_connections()
            time.sleep(1.1)

        self.stdout.write(self.style.SUCCESS(f"Done! {done} geocoded, {failed} failed out of {total}"))
