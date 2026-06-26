from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.me_url = "/api/auth/me/"
        self.user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
        }

    def test_register(self):
        res = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["email"], self.user_data["email"])

    def test_register_duplicate_email(self):
        self.client.post(self.register_url, self.user_data, format="json")
        res = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(res.status_code, 400)

    def test_login(self):
        self.client.post(self.register_url, self.user_data, format="json")
        res = self.client.post(
            self.login_url,
            {"email": self.user_data["email"], "password": self.user_data["password"]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_me_authenticated(self):
        self.client.post(self.register_url, self.user_data, format="json")
        login_res = self.client.post(
            self.login_url,
            {"email": self.user_data["email"], "password": self.user_data["password"]},
            format="json",
        )
        token = login_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], self.user_data["email"])

    def test_me_unauthenticated(self):
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, 401)
