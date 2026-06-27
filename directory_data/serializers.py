from rest_framework import serializers

from .models import LawyerProfile, Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["street", "city", "state", "latitude", "longitude"]


class LawyerMapSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    specializations = serializers.SerializerMethodField()

    class Meta:
        model = LawyerProfile
        fields = [
            "id", "first_name", "last_name", "rating",
            "address", "specializations",
        ]

    def get_specializations(self, obj):
        return [s.strip() for s in obj.specialization.split(",") if s.strip()]
