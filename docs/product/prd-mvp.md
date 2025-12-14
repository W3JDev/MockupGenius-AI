
# Product Requirements Document (PRD) - MVP

**Version:** 1.2
**Status:** In Development
**Owner:** Product Team

## 1. Objective
Build a web-based tool that takes a user-uploaded screenshot and returns a photorealistic device mockup placed in a contextually relevant environment, complete with SEO metadata.

## 2. Feature Scope

### 2.1. Input
- **File Upload:** Drag & drop support for PNG/JPG.
- **Batch Processing:** Support for multiple files at once.
- **Auto-Detection:** AI analysis of the image to determine:
    - App Category (e.g., Fintech)
    - Dominant Colors
    - Device Aspect Ratio (Mobile vs Desktop)

### 2.2. Configuration (The "Controls")
- **Device Frame:** Auto, Smartphone, Laptop, Tablet, Watch.
- **Background Style:** Enum selection (Studio, Lifestyle, Custom Prompt).
- **Lighting:** Soft, Dramatic, Neon, Natural.
- **Content Fit:** Cover, Contain, Top Align (Critical for scrolling screenshots).
- **A/B Testing:** Switch to generate 2 distinct variants per input.

### 2.3. Generation Core (The "Engine")
- **Model:** Google Gemini 3.0 Pro / 2.5 Flash.
- **Architecture:** Dual-Layer Composite.
    - *Constraint:* Text on screen must remain legible.
    - *Constraint:* No hallucinations of back-of-device.

### 2.4. Output & Management
- **Gallery:** Grid view of generated assets.
- **Metadata:** Display AI-generated SEO title, keywords, and caption.
- **Refinement:** "Replace Image" feature to keep the scene but swap the screen.
- **Download:** Individual high-res download or Bulk ZIP download.

## 3. Non-Functional Requirements
- **Latency:** Generation should take < 15 seconds per image.
- **Quality:** Minimum 2K resolution output.
- **Privacy:** Images processed in memory; no long-term storage of user assets.
- **Accessibility:** UI must support keyboard navigation and screen readers.
