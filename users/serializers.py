import re
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    # full name optional, used to set first_name / last_name
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("id", "email", "name", "password")

    def _generate_username(self, email: str) -> str:
        base = re.sub(r"[^\w]", "", email.split("@")[0])[:30] or "user"
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        return username

    def create(self, validated_data):
        name = validated_data.pop("name", "")
        parts = name.strip().split(" ", 1)
        first = parts[0] if parts else ""
        last = parts[1] if len(parts) > 1 else ""
        username = self._generate_username(validated_data["email"])
        return User.objects.create_user(
            email=validated_data["email"],
            username=username,
            password=validated_data["password"],
            first_name=first,
            last_name=last,
        )
