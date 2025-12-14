
# ADR 001: Dual-Layer Composite Rendering Architecture

**Status:** Accepted
**Date:** 2023-10-27

## Context
Standard Generative AI (Imagen, Midjourney) often struggles with "Text Preservation". When asked to "Put this screenshot on a phone", they often hallucinate the text, making it unreadable or gibberish, rendering the marketing asset useless.

## Decision
We will implement a prompt engineering strategy called **"Dual-Layer Composite Rendering"**.

We will explicitly instruct the model to treat the generation as two distinct steps (conceptually):
1.  **Layer 1 (The Screen):** A rigorous mapping of the input pixels to the target geometry with upscaling and sharpening.
2.  **Layer 2 (The World):** A creative generation of the device body, lighting, and background.

## Consequences
- **Positive:** Text legibility is dramatically improved. Device physics (glass reflections) are applied *over* the text, not *instead* of it.
- **Negative:** Slightly higher prompt complexity and token count. Requires models with high instruction-following capabilities (Gemini Pro/Flash 2.5+).
