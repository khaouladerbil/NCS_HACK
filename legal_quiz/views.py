from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import QuizAttempt, LearningProgress
from .serializers import (
    QuizAttemptSerializer,
    LearningProgressSerializer,
    GenerateQuizSerializer,
    SubmitQuizSerializer,
)
from .services.quiz_service import generate_quiz
from .services.scoring_service import ScoringService


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data["topic"]
        difficulty = serializer.validated_data["difficulty"]
        question_count = serializer.validated_data["question_count"]

        try:
            quiz = generate_quiz(topic, difficulty, question_count)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if "error" in quiz:
            return Response(quiz, status=status.HTTP_502_BAD_GATEWAY)

        attempt = QuizAttempt.objects.create(
            user=request.user,
            topic=topic,
            difficulty=difficulty,
            total_questions=quiz["total"],
        )

        quiz["attempt_id"] = attempt.id
        return Response(quiz, status=status.HTTP_201_CREATED)


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            attempt = QuizAttempt.objects.get(
                id=serializer.validated_data["attempt_id"],
                user=request.user,
            )
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND)

        if attempt.finished_at is not None:
            return Response({"error": "Already submitted"}, status=status.HTTP_400_BAD_REQUEST)

        attempt = ScoringService.calculate_score(
            attempt,
            serializer.validated_data["answers"],
            serializer.validated_data["questions"],
        )

        return Response(QuizAttemptSerializer(attempt).data)


class QuizHistoryView(generics.ListAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(user=self.request.user)


class QuizProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress, _ = LearningProgress.objects.get_or_create(user=request.user)
        return Response(LearningProgressSerializer(progress).data)
