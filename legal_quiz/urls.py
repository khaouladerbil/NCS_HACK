from django.urls import path
from .views import GenerateQuizView, SubmitQuizView, QuizHistoryView, QuizProgressView

urlpatterns = [
    path("generate/", GenerateQuizView.as_view(), name="quiz-generate"),
    path("submit/", SubmitQuizView.as_view(), name="quiz-submit"),
    path("history/", QuizHistoryView.as_view(), name="quiz-history"),
    path("progress/", QuizProgressView.as_view(), name="quiz-progress"),
]
