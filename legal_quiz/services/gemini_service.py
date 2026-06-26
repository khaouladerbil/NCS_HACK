import os
import json
from google import genai


FALLBACK_QUIZ = {
    "questions": [
        {
            "question": "What is the maximum probation period under Algerian Labor Law?",
            "choices": ["A. 1 month", "B. 3 months", "C. 6 months", "D. 12 months"],
            "correct": "C",
            "explanation": "Under Algerian Labor Law, the maximum probation period is 6 months."
        },
        {
            "question": "Which body handles labor disputes in Algeria?",
            "choices": ["A. Cour Supreme", "B. Conseil d'Etat", "C. Tribunal du Travail", "D. Cour des Comptes"],
            "correct": "C",
            "explanation": "Labor disputes are handled by the Tribunal du Travail (Labor Court)."
        },
        {
            "question": "What is the legal working hours per week in Algeria?",
            "choices": ["A. 35 hours", "B. 39 hours", "C. 40 hours", "D. 44 hours"],
            "correct": "C",
            "explanation": "The legal working week is 40 hours under Algerian labor regulations."
        },
    ]
}


def call_gemini(prompt: str) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
    except Exception:
        return None

    if not response.text:
        return None

    text = response.text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1])

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def generate_quiz_with_fallback(topic: str, difficulty: str, question_count: int) -> dict:
    prompt = None
    from .prompt_builder import build_quiz_prompt
    prompt = build_quiz_prompt(topic, difficulty, question_count)

    result = call_gemini(prompt)

    if result is None:
        result = FALLBACK_QUIZ

    if "questions" not in result or not isinstance(result["questions"], list):
        result = FALLBACK_QUIZ

    questions = result["questions"][:question_count]
    return {
        "topic": topic,
        "difficulty": difficulty,
        "total": len(questions),
        "questions": questions,
    }
