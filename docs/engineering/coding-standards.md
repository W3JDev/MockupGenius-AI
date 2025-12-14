
# Coding Standards

## TypeScript Guidelines
- **Strict Mode:** Enabled.
- **Interfaces vs Types:** Use `interface` for object definitions (extensible), `type` for unions/primitives.
- **Enums:** Use String Enums for configuration options (e.g., `DeviceType`) to make debugging easier.

## React Patterns
- **Hooks:** Custom logic should be extracted to hooks if used in multiple components.
- **Props:** Destructure props in the function signature.
- **Components:** Functional components only.

## AI Integration Rules
- **Anti-Hallucination:** Never assume the AI returns JSON unless `responseSchema` is strictly defined.
- **Fallbacks:** Always wrap AI calls in `retryOperation` (exponential backoff) to handle 503/429 errors.
- **Secrets:** NEVER log the API Key.

## Directory Structure (Logical)
Although the current repo is flat, logically group code as:
- `components/`: Pure UI.
- `services/`: Side-effects and API calls.
- `types/`: Definitions.
