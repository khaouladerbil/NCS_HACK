from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .models import CitizenProfile, CitizenDocument, CitizenCase, LegalDeadline
from datetime import date

User = get_user_model()


class LegalTwinTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        login_res = self.client.post(
            "/api/auth/login/",
            {"email": "test@example.com", "password": "testpass123"},
            format="json",
        )
        self.token = login_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.profile_url = "/api/legal/profile/"
        self.documents_url = "/api/legal/documents/"
        self.cases_url = "/api/legal/cases/"
        self.deadlines_url = "/api/legal/deadlines/"

    def test_create_profile(self):
        res = self.client.post(
            self.profile_url,
            {
                "full_name": "John Doe",
                "birth_date": "1990-01-01",
                "sex": "male",
                "wilaya": "Algiers",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["full_name"], "John Doe")

    def test_get_profile(self):
        self.client.post(
            self.profile_url,
            {
                "full_name": "John Doe",
                "birth_date": "1990-01-01",
                "sex": "male",
                "wilaya": "Algiers",
            },
            format="json",
        )
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["full_name"], "John Doe")

    def test_create_document(self):
        CitizenProfile.objects.create(
            user=self.user,
            full_name="John Doe",
            birth_date="1990-01-01",
            sex="male",
            wilaya="Algiers",
        )
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        file = SimpleUploadedFile("test.pdf", BytesIO(b"dummy content").read(), content_type="application/pdf")
        res = self.client.post(
            self.documents_url,
            {
                "document_type": "id_card",
                "folder_name": "ID",
                "description": "My ID card",
                "file": file,
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, 201)

    def test_create_case(self):
        CitizenProfile.objects.create(
            user=self.user,
            full_name="John Doe",
            birth_date="1990-01-01",
            sex="male",
            wilaya="Algiers",
        )
        res = self.client.post(
            self.cases_url,
            {
                "case_number": "CASE-001",
                "title": "Test Case",
                "description": "A test case",
                "status": "open",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_create_deadline(self):
        CitizenProfile.objects.create(
            user=self.user,
            full_name="John Doe",
            birth_date="1990-01-01",
            sex="male",
            wilaya="Algiers",
        )
        res = self.client.post(
            self.deadlines_url,
            {"title": "File documents", "due_date": "2026-07-01"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_unauthenticated_access(self):
        self.client.credentials()
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, 401)
