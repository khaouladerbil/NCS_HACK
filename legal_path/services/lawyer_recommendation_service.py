import math
from django.db.models import Q

from directory_data.models import LawyerProfile
from legal_twin.models import CitizenProfile

CATEGORY_SPEC_MAP = {
    "labor": ["Droit du travail"],
    "family": ["Droit familial"],
    "civil": ["Droit civil"],
    "criminal": ["Droit pénal"],
    "property": ["Droit de l'immobilier"],
    "commercial": ["Droit commercial"],
    "administrative": ["Droit administratif"],
    "other": [],
}

WILAYA_COORDS = {
    "Adrar": (27.8743, -0.2857), "Chlef": (36.1647, 1.3347), "Laghouat": (33.8061, 2.8821),
    "Oum El Bouaghi": (35.8732, 7.1307), "Batna": (35.5565, 6.1742), "Bejaia": (36.7509, 5.0567),
    "Biskra": (34.8552, 5.7242), "Bechar": (31.6167, -2.2167), "Blida": (36.4728, 2.8315),
    "Bouira": (36.3786, 3.8994), "Tamanrasset": (22.7852, 5.5228), "Tebessa": (35.4072, 8.1204),
    "Tlemcen": (34.8783, -1.3150), "Tiaret": (35.3792, 1.3197), "Tizi Ouzou": (36.7155, 4.0499),
    "Algiers": (36.7538, 3.0588), "Djelfa": (34.6703, 3.2630), "Jijel": (36.8206, 5.7667),
    "Setif": (36.1895, 5.4079), "Saida": (34.8304, 0.1517), "Skikda": (36.8762, 6.9098),
    "Sidi Bel Abbes": (35.1912, -0.6376), "Annaba": (36.9018, 7.7544), "Guelma": (36.4667, 7.4333),
    "Constantine": (36.3651, 6.6147), "Medea": (36.2669, 2.7531), "Mostaganem": (35.9310, 0.0892),
    "Msila": (35.7067, 4.5416), "Mascara": (35.3967, 0.1403), "Ouargla": (31.9500, 5.3167),
    "Oran": (35.6991, -0.6304), "El Bayadh": (32.6500, 0.9500), "Illizi": (26.4833, 8.4667),
    "Bordj Bou Arreridj": (36.0667, 4.7667), "Boumerdes": (36.7667, 3.4667), "El Tarf": (36.7667, 8.3167),
    "Tindouf": (27.6742, -8.1308), "Tissemsilt": (35.6050, 1.8117), "El Oued": (33.3667, 6.8667),
    "Khenchela": (35.4333, 7.1333), "Souk Ahras": (36.3833, 7.9500), "Tipaza": (36.5833, 2.4333),
    "Mila": (36.4500, 6.2667), "Ain Defla": (36.2667, 1.9667), "Naama": (33.2667, -0.3167),
    "Ain Temouchent": (35.3000, -1.1333), "Ghardaia": (32.4833, 3.6667), "Relizane": (35.7333, 0.5500),
    "Timimoun": (29.2500, 0.2333), "Bordj Badji Mokhtar": (21.3283, 0.9539),
    "Ouled Djellal": (34.4167, 5.0667), "Beni Abbes": (30.0833, -2.1000),
    "In Salah": (27.1936, 2.4606), "In Guezzam": (19.5667, 5.7667),
    "Touggourt": (33.1000, 6.0667), "Djanet": (24.5500, 9.4833),
    "El M'Ghair": (33.9500, 5.9167), "El Meniaa": (30.5833, 2.8667),
}


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class LawyerRecommendationService:

    @staticmethod
    def get_specializations_for_category(category: str) -> list[str]:
        return CATEGORY_SPEC_MAP.get(category, [])

    @staticmethod
    def recommend(user, category: str, user_wilaya: str = None,
                  lat: str = None, lng: str = None) -> list[dict]:
        specs = LawyerRecommendationService.get_specializations_for_category(category)

        qs = (
            LawyerProfile.objects
            .select_related("address")
            .filter(approved=True)
        )

        if specs:
            query = Q()
            for spec in specs:
                query |= Q(specialization__icontains=spec)
            qs = qs.filter(query)

        qs = qs.order_by("-rating")

        user_lat = None
        user_lng = None

        if lat and lng:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
            except (TypeError, ValueError):
                pass

        if user_lat is None:
            if not user_wilaya:
                try:
                    profile = user.citizen_profile
                    user_wilaya = profile.wilaya
                except CitizenProfile.DoesNotExist:
                    pass
            coords = WILAYA_COORDS.get(user_wilaya) if user_wilaya else None
            if coords:
                user_lat, user_lng = coords

        results = []
        for lawyer in qs:
            distance = None
            addr = lawyer.address
            if addr and addr.latitude is not None and addr.longitude is not None and user_lat and user_lng:
                try:
                    distance = round(haversine(user_lat, user_lng, float(addr.latitude), float(addr.longitude)), 1)
                except (TypeError, ValueError):
                    pass

            same_wilaya = LawyerRecommendationService._is_same_wilaya(lawyer, user_wilaya)
            match_reason = LawyerRecommendationService._get_match_reason(
                lawyer, category, user_wilaya, same_wilaya, distance
            )
            results.append({
                "lawyer": lawyer,
                "match_reason": match_reason,
                "is_same_wilaya": same_wilaya,
                "distance_km": distance,
                "specializations": [
                    s.strip()
                    for s in lawyer.specialization.split(",")
                    if s.strip()
                ],
            })

        results.sort(key=lambda r: (
            -(r["is_same_wilaya"]),
            r["distance_km"] if r["distance_km"] is not None else float("inf"),
            -(r["lawyer"].rating or 0),
        ))
        return results

    @staticmethod
    def _get_match_reason(lawyer, category, user_wilaya, same_wilaya, distance=None) -> str:
        specs = LawyerRecommendationService.get_specializations_for_category(category)
        matched_specs = []
        for spec in specs:
            if spec.lower() in lawyer.specialization.lower():
                matched_specs.append(spec)

        reasons = []
        if matched_specs:
            reasons.append(f"Specializes in {', '.join(matched_specs)}")
        if distance is not None:
            reasons.append(f"{distance} km away")

        return "; ".join(reasons) if reasons else "Available lawyer"

    @staticmethod
    def _is_same_wilaya(lawyer, user_wilaya: str) -> bool:
        if not user_wilaya or not lawyer.address:
            return False
        if lawyer.address.state:
            return (user_wilaya.lower() in lawyer.address.state.lower()
                    or lawyer.address.state.lower() in user_wilaya.lower())
        if lawyer.address.city:
            return (user_wilaya.lower() in lawyer.address.city.lower()
                    or lawyer.address.city.lower() in user_wilaya.lower())
        return False
