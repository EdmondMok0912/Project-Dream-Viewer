# Project Dream Viewer 🌙

**Project Dream Viewer** is a sophisticated, AI-assisted dream reflection and journaling application. It is designed to help users document their dreams, explore underlying symbols, and gain personal insights through structured, multi-perspective psychological frameworks (including Jungian and Freudian analysis).

## ✨ Key Features

- **📖 Deep Dream Analysis:** Submit your dream records to receive a structured report detailing core themes, emotions, and symbolic meanings.
- **🧠 Multi-Perspective Frameworks:** The app generates insights based on Jungian depth psychology, Freudian perspectives, modern cognitive theories, and physiological stress factors.
- **🛡️ Safety-First Risk Screening:** Built-in mechanisms detect potentially harmful content and route users towards professional support resources rather than offering AI interpretations for crisis situations.
- **🗂️ Local Archive & Export:** Export your dream analyses as JSON or Markdown formats for secure local storage, ensuring privacy and ownership of your personal reflections.
- **🔍 Cross-Dream Comparison:** Upload multiple past dreams (JSON) to generate an overarching analysis comparing recurring symbols, emotional trends, and timeline developments.
- **🔑 Bring Your Own Key (BYOK):** Frontend support for users to input their own API key, allowing unrestricted personal access if the system's global quota is reached.
- **✨ Immersive UI:** A comforting, warm color palette (stone and orange tones) paired with smooth, elegant animations powered by Framer Motion for a calming user experience.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://motion.dev/)
- **AI Integration:** Google GenAI SDK (`@google/genai`) utilizing the latest `gemma-4-31b-it` and `gemma-4-26b-a4b-it` models.
- **Validation:** Zod
- **Markdown Rendering:** `react-markdown`

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed along with `npm` (or `yarn` / `pnpm`).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/project-dream-viewer.git
   cd project-dream-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env.local` file in the root of your project and configure the necessary variables:

```env
# Required: Your API Key (from Google AI Studio)
GEMINI_API_KEY=your_api_key_here

# Optional: Configure models
PRIMARY_MODEL=gemma-4-31b-it
FALLBACK_MODEL=gemma-4-26b-a4b-it
```

### Running the Development Server

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

- `/app` - Next.js application routes, including the main dashboard, archive, and serverless API endpoints (`/api/analyze`, `/api/compare`).
- `/components` - Modular React components for the UI, including the Dream Form, Report Viewer, and Crisis sections.
- `/lib` - Core logic, configuration, and Zod schemas strictly defining the AI's structured outputs.

## ⚠️ Disclaimer

**Project Dream Viewer is intended as a psychological education and self-reflection tool only.** 
The AI-generated insights are not a substitute for professional medical advice, diagnosis, or therapy. If you are experiencing psychological distress, please seek help from certified mental health professionals.
