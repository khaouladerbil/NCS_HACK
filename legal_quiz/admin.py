from django.contrib import admin
from .models import QuizAttempt, LearningProgress


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "topic", "difficulty", "percentage", "started_at", "finished_at")
    list_filter = ("difficulty", "topic")
    search_fields = ("user__email", "topic")


@admin.register(LearningProgress)
class LearningProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "level", "average_score", "completed_quizzes", "last_played")
