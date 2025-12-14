
# MockupGenius AI 🎨

> **Professional Marketing Mockup Generator powered by Google Gemini 2.5/3.0 Vision.**
> *Turn raw app screenshots into award-winning marketing assets in seconds.*

![Status](https://img.shields.io/badge/Status-Production-green)
![Tech](https://img.shields.io/badge/Stack-React_|_Tailwind_|_Gemini_SDK-blue)
![License](https://img.shields.io/badge/License-Proprietary-orange)

<p align="left">
  <strong>Crafted by w3jdev</strong><br/>
  <a href="https://w3jdev.com">w3jdev.com</a> · <a href="https://github.com/w3jdev">github.com/w3jdev</a> · <a href="https://linkedin.com/in/w3jdev">linkedin.com/in/w3jdev</a>
</p>

## 📋 Overview

MockupGenius AI is an enterprise-grade web application designed to automate the creation of high-fidelity product mockups. It utilizes a **Dual-Layer Composite Rendering Architecture** to separate screen content (UI) from environmental generation, ensuring text legibility while providing photorealistic lighting and physics.

### Key Features
- **Dual-Layer Rendering:** Upscales UI 300% and composites it onto AI-generated devices with physically accurate glass refraction.
- **Contextual Intelligence:** Automatically detects app category (Fintech, F&B) and generates relevant background props.
- **SEO & Marketing Data:** Auto-generates filenames, alt text, and social captions for every asset.
- **A/B Testing:** Generates variant angles and lighting setups for conversion optimization.
- **Smart Image Replacement:** Allows swapping screen content while retaining the exact generative environment.

---

## 🤖 For AI Agents
If you are an AI coding assistant (Cursor, Copilot, Windsurf), **YOU MUST READ [AGENTS.md](./AGENTS.md)** before making changes.

---

## 📚 Documentation Structure

We follow a strict "Docs-as-Code" philosophy.

### 🏗️ Architecture & Engineering
- **[System Overview](docs/architecture/system-overview.md):** High-level design and data flow.
- **[Tech Stack](docs/architecture/tech-stack.md):** Libraries, tools, and decision rationale.
- **[Coding Standards](docs/engineering/coding-standards.md):** Style guides, linting, and patterns.
- **[API Contracts](docs/engineering/api-contracts.md):** Integration details with Gemini API.

### 🚀 Product & Vision
- **[Product Requirements (PRD)](docs/product/prd-mvp.md):** Detailed feature specifications.
- **[Vision & Pitch](docs/product/vision.md):** The "Why" and "What".
- **[Success Metrics](docs/product/success-metrics.md):** KPIs and validation criteria.

### 🔄 Process & Tracking
- **[Roadmap](docs/process/roadmap.md):** Future milestones and release plan.
- **[Changelog](docs/process/changelog.md):** Version history.
- **[Testing Strategy](docs/process/testing-strategy.md):** QA and validation protocols.

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Google Gemini API Key (Paid Tier recommended for `gemini-3-pro-image-preview`)

### Installation

```bash
# Install dependencies
npm install

# Set up Environment
export API_KEY="your_google_api_key"

# Run Development Server
npm start
```

## 🔒 Security Note
This application is client-side heavy. API Keys are passed via `process.env`. Ensure `.env` files are never committed to version control.
