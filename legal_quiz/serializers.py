from rest_framework import serializers
from .models import QuizAttempt, LearningProgress


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = "__all__"
        read_only_fields = ("user", "started_at", "finished_at")


class LearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningProgress
        fields = "__all__"
        read_only_fields = ("user",)


class GenerateQuizSerializer(serializers.Serializer):
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=["beginner", "medium", "hard"])
    question_count = serializers.IntegerField(default=10, min_value=1, max_value=20)


class SubmitQuizSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    answers = serializers.ListField(
        child=serializers.DictField()
    )
    questions = serializers.ListField(
        child=serializers.DictField()
    )
