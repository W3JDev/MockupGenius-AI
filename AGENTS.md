
# AGENTS.md - AI Coding Assistant Rules

> **AUDIENCE:** This file is for AI Coding Agents (Cursor, Copilot, Windsurf, etc.).
> **STRICT ADHERENCE REQUIRED.**
> 
> **Primary Maintainer:** w3jdev (w3jdev.com)

## 1. Project Context
**Name:** MockupGenius AI
**Type:** Client-side React Application (SPA)
**Core Function:** Generative AI Image Manipulation & Marketing Asset Creation.
**Monorepo:** No. Flat structure.

## 2. Tech Stack & Constraints

### Core Frameworks
- **Frontend:** React 19 (Functional Components, Hooks).
- **Styling:** Tailwind CSS (Utility-first).
- **Icons:** Lucide React.
- **Build/Bundling:** Standard ES Modules via `index.html` import (Current setup).

### 🧠 Google GenAI SDK (CRITICAL)
You **MUST** follow these specific import and usage patterns. We use the updated `@google/genai` library.

**❌ FORBIDDEN (Deprecated):**
- `import { GoogleGenerativeAI } from "@google/generative-ai"`
- `genAI.getGenerativeModel(...)`
- `response.response.text()`

**✅ REQUIRED (Current Standard):**
- **Import:** `import { GoogleGenAI, Type } from "@google/genai";`
- **Init:** `const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });`
- **Text Gen:** `await ai.models.generateContent(...)`
- **Image Gen:** `await ai.models.generateContent(...)` with `gemini-2.5-flash-image` or `gemini-3-pro-image-preview`.
- **Output:** Access `response.text` directly (it is a property, not a function).

## 3. Architecture & Patterns

### Dual-Layer Composite Architecture
When modifying `services/geminiService.ts`:
1.  **Layer 1 (Screen):** Must instruct model to upscale UI, apply high-pass sharpening, and perform perspective transform.
2.  **Layer 2 (Environment):** Must use physics-based rendering prompt instructions (Octane/Redshift specs).
3.  **Prompt Engineering:** Maintain the "Anti-Hallucination Protocol" block in all prompts to prevent back-of-device rendering.

### File Structure
The project currently uses a flat structure (Root-level components).
- `App.tsx`: Main controller & state.
- `types.ts`: Centralized Interfaces & Enums.
- `components/*.tsx`: UI Components.
- `services/*.tsx`: Business logic & API calls.

## 4. Code Style & Rules

1.  **Strict TypeScript:** No `any` unless absolutely necessary for external un-typed libraries. Define interfaces in `types.ts`.
2.  **Tailwind only:** Do not create `.css` files. Use Tailwind classes.
3.  **Error Handling:** All async operations (especially API calls) must be wrapped in `try/catch` with user-facing error state updates.
4.  **No Hallucinations:** Do not import libraries that are not in `package.json` (or the import map in `index.html`) without asking to install them.
5.  **Clean Code:** Remove `console.log` before "committing" code suggestions.

## 5. Dangerous Zones ⚠️
Ask for human review before modifying:
1.  **`services/geminiService.ts`**: The prompt engineering here is tuned for specific visual output. Changing words can break the "Dual-Layer" effect.
2.  **API Key Handling:** Do not modify how `process.env.API_KEY` is accessed.

## 6. Common Commands
- **Start:** `npm start`
- **Build:** `npm run build`
- **Test:** `npm test`

## 7. Knowledge Graph
- **State Management:** React `useState` / `useEffect`.
- **Image Processing:** Browser native `FileReader` and `Blob` API.
- **Zip Generation:** `jszip`.
