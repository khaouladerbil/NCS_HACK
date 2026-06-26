def build_prompt(template, user_input, context=None):
    parts = [f"You are a legal document drafting assistant."]

    if template and template.prompt_hint:
        parts.append(f"\nDocument type: {template.name}")
        parts.append(f"\nInstructions: {template.prompt_hint}")

    if context:
        parts.append(f"\nContext:\n{context}")

    parts.append(f"\nUser request:\n{user_input}")
    parts.append("\nGenerate the legal document in a professional format with proper sections and legal language.")
    parts.append("\nDo not include placeholders like [Name] — use the information provided or state 'To be completed'.")

    return "\n".join(parts)
