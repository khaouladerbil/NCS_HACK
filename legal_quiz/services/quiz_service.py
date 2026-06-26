from .gemini_service import generate_quiz_with_fallback


def generate_quiz(topic: str, difficulty: str, question_count: int = 10) -> dict:
    return generate_quiz_with_fallback(topic, difficulty, question_count)
