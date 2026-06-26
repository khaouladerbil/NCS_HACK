BUILD_PROMPT = """You are a legal education assistant specializing in Algerian law.

Generate a {question_count}-question multiple-choice quiz about {topic} at {difficulty} difficulty.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{{
  "questions": [
    {{
      "question": "Question text here?",
      "choices": ["A. choice1", "B. choice2", "C. choice3", "D. choice4"],
      "correct": "A",
      "explanation": "Brief explanation of the correct answer"
    }}
  ]
}}

Requirements:
- Each question must have exactly 4 choices labeled A, B, C, D
- "correct" must be one of "A", "B", "C", or "D"
- Questions must be accurate according to Algerian law
- Explanations should be educational (1-2 sentences)
- Mix of easy and challenging questions appropriate for {difficulty} level
"""


def build_quiz_prompt(topic: str, difficulty: str, question_count: int = 10) -> str:
    return BUILD_PROMPT.format(
        topic=topic,
        difficulty=difficulty,
        question_count=question_count,
    )
