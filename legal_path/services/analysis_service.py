from ..models import LegalRequest, AIAnalysis, RoadmapStep, Recommendation, TimelineEvent


class AnalysisService:
    """AI analysis logic — no AI logic in models or views."""

    @staticmethod
    def analyze(legal_request: LegalRequest) -> AIAnalysis:
        """Run AI analysis on a legal request and store results."""
        raise NotImplementedError("AI integration goes here")

    @staticmethod
    def generate_roadmap(legal_request: LegalRequest) -> list[RoadmapStep]:
        """Generate roadmap steps for a legal request."""
        raise NotImplementedError("AI integration goes here")

    @staticmethod
    def generate_recommendations(legal_request: LegalRequest) -> list[Recommendation]:
        """Generate recommendations for a legal request."""
        raise NotImplementedError("AI integration goes here")

    @staticmethod
    def add_timeline_event(
        legal_request: LegalRequest, event_type: str, title: str, description: str = ""
    ) -> TimelineEvent:
        """Record a timeline event."""
        return TimelineEvent.objects.create(
            legal_request=legal_request,
            event_type=event_type,
            title=title,
            description=description,
        )
