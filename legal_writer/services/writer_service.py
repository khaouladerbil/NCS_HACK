from .prompt_builder import build_prompt


def generate_document(document, user_input):
    template = document.template
    prompt = build_prompt(template, user_input)

    # Placeholder for Gemini integration.
    generated_content = simulate_ai_generate(prompt)

    return {
        "content": generated_content,
        "prompt": prompt,
    }


def simulate_ai_generate(prompt):
    return f"""--- DRAFT: {prompt[:50]}... ---

This is a placeholder generated document.

The AI service will replace this content with a properly drafted legal document.

Section 1: Introduction
To be completed.

Section 2: Body
To be completed.

Section 3: Conclusion
To be completed.

--- END OF DRAFT ---"""
