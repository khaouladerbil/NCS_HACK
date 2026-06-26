import json
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError


def geocode(query: str) -> tuple[float, float] | None:
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={quote(query)}&format=json&limit=1&countrycodes=dz"
    )
    req = Request(url, headers={"User-Agent": "LegalPath/1.0"})
    try:
        with urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            if data:
                return (float(data[0]["lat"]), float(data[0]["lon"]))
    except (URLError, json.JSONDecodeError, KeyError, IndexError):
        pass
    return None
