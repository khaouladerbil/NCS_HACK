from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class LegalPathTests(TestCase):
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
        self.requests_url = "/api/legal-path/requests/"

    def _create_request(self):
        res = self.client.post(
            self.requests_url,
            {"title": "My case", "description": "Help needed", "category": "civil"},
            format="json",
        )
        return res.data["id"]

    def test_create_request(self):
        res = self.client.post(
            self.requests_url,
            {
                "title": "Legal question",
                "description": "I need help with a contract",
                "category": "civil",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["title"], "Legal question")
        self.assertEqual(res.data["status"], "draft")

    def test_list_requests(self):
        self._create_request()
        res = self.client.get(self.requests_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_user_cannot_see_others_requests(self):
        self._create_request()
        other = User.objects.create_user(
            email="other@example.com",
            username="other",
            password="testpass123",
        )
        login_other = self.client.post(
            "/api/auth/login/",
            {"email": "other@example.com", "password": "testpass123"},
            format="json",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_other.data['access']}"
        )
        res = self.client.get(self.requests_url)
        self.assertEqual(len(res.data), 0)

    def test_unauthenticated_access(self):
        self.client.credentials()
        res = self.client.get(self.requests_url)
        self.assertEqual(res.status_code, 401)

    def test_ai_analysis_endpoint(self):
        req_id = self._create_request()
        url = f"/api/legal-path/requests/{req_id}/analysis/"
        res = self.client.post(
            url,
            {
                "summary": "Test analysis",
                "risk_level": "medium",
                "confidence": 0.85,
                "relevant_laws": ["Law A", "Law B"],
                "suggested_actions": ["Action 1"],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["risk_level"], "medium")

    def test_roadmap_steps_endpoint(self):
        req_id = self._create_request()
        url = f"/api/legal-path/requests/{req_id}/roadmap-steps/"
        res = self.client.post(
            url,
            {
                "order": 1,
                "title": "Gather documents",
                "description": "Collect all required paperwork",
                "estimated_days": 7,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["title"], "Gather documents")

    def test_required_documents_endpoint(self):
        req_id = self._create_request()
        url = f"/api/legal-path/requests/{req_id}/documents/"
        res = self.client.post(
            url,
            {"name": "ID Card", "description": "Copy of national ID"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_recommendations_endpoint(self):
        req_id = self._create_request()
        url = f"/api/legal-path/requests/{req_id}/recommendations/"
        res = self.client.post(
            url,
            {
                "title": "Consult a professional",
                "description": "Seek expert advice",
                "priority": "high",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_timeline_events_endpoint(self):
        req_id = self._create_request()
        url = f"/api/legal-path/requests/{req_id}/timeline/"
        res = self.client.post(
            url,
            {
                "event_type": "created",
                "title": "Case created",
                "description": "Initial filing completed",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_nested_endpoints_scoped_to_request(self):
        req1 = self._create_request()
        req2 = self._create_request()
        self.client.post(
            f"/api/legal-path/requests/{req1}/timeline/",
            {"event_type": "created", "title": "Event for req1"},
            format="json",
        )
        res = self.client.get(f"/api/legal-path/requests/{req2}/timeline/")
        self.assertEqual(len(res.data), 0)
