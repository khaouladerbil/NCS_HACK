from django.db import models
from users.models import User


class QuizAttempt(models.Model):
    DIFFICULTY_CHOICES = [
        ("beginner", "Beginner"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    topic = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    score = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    correct_answers = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user.email} - {self.topic} ({self.percentage}%)"


class LearningProgress(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="quiz_progress"
    )
    completed_quizzes = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    favorite_topic = models.CharField(max_length=255, blank=True)
    level = models.CharField(max_length=50, default="Beginner")
    last_played = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - Level {self.level} ({self.average_score}%)"
