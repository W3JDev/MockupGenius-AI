
# Technology Stack

## Frontend Framework
- **React 19:** Chosen for the robust ecosystem and upcoming compiler optimizations.
- **TypeScript:** Strict typing is mandatory to handle the complex state objects of the Mockup settings.

## Styling
- **Tailwind CSS:** Enables rapid UI iteration.
- **Lucide React:** Consistent, clean iconography fitting the "SaaS" aesthetic.

## AI & Machine Learning
- **Google GenAI SDK (`@google/genai`):**
    - *Why:* Native integration with Gemini. Lower latency than REST calls.
    - *Models:*
        - `gemini-2.5-flash`: For rapid text analysis and logic.
        - `gemini-3-pro-image-preview`: For high-fidelity image generation.

## Utilities
- **JSZip:** Client-side zip generation for the "Bulk Download" feature, keeping data on the client.
- **HTML5 Canvas / FileReader:** Native browser APIs for image handling.

## Infrastructure
- **Hosting:** Static hosting (Vercel/Netlify compatible).
- **Environment:** Requires `process.env.API_KEY` injection.
