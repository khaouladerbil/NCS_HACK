from datetime import datetime
from django.utils import timezone
from django.db.models import Count, Avg

from legal_quiz.models import QuizAttempt, LearningProgress


class ScoringService:

    @staticmethod
    def calculate_score(attempt: QuizAttempt, answers: list[dict], questions: list[dict]) -> QuizAttempt:
        correct = 0
        total = len(questions)

        for q_data, answer in zip(questions, answers):
            if q_data.get("correct") == answer.get("answer"):
                correct += 1

        percentage = round((correct / total) * 100, 2) if total > 0 else 0.0

        attempt.correct_answers = correct
        attempt.total_questions = total
        attempt.score = correct
        attempt.percentage = percentage
        attempt.finished_at = timezone.now()
        attempt.save(update_fields=[
            "correct_answers", "total_questions", "score",
            "percentage", "finished_at"
        ])

        ScoringService._update_progress(attempt.user)

        return attempt

    @staticmethod
    def _update_progress(user):
        progress, _ = LearningProgress.objects.get_or_create(user=user)

        stats = QuizAttempt.objects.filter(user=user).aggregate(
            count=Count("id"),
            avg=Avg("percentage"),
        )

        total = stats["count"] or 0
        avg = round(stats["avg"] or 0.0, 2)

        favorite = (
            QuizAttempt.objects.filter(user=user)
            .values("topic")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )

        level = "Beginner"
        if avg >= 80:
            level = "Expert"
        elif avg >= 60:
            level = "Advanced"
        elif avg >= 40:
            level = "Intermediate"

        progress.completed_quizzes = total
        progress.average_score = avg
        progress.favorite_topic = favorite["topic"] if favorite else ""
        progress.level = level
        progress.last_played = timezone.now()
        progress.save()
