# Chat-ji-Pitty 🤖

A premium full-stack AI chatbot application named **Chat-ji-Pitty**. It integrates **Gemini AI** for conversation generation, **Supabase** for user authentication and conversational database persistence, and a stateless **Render** Node.js proxy for live web search queries.

![Chat-ji-Pitty](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-API-green)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-red)

## ✨ Features

- 🤖 **Gemini AI Integration** - High-speed, streaming completions powered by Google Gemini (Free Tier/Gemini 1.5 Flash).
- 💾 **Supabase Authentication & DB** - Robust user authentication, session-based persistence, profiles, and messages stored securely in Supabase.
- 🔍 **Stateless Web Search** - Cheerio/Axios-powered background search scraper running on Render backend, enabling up-to-the-minute web retrieval fallback.
- 📎 **Multimodal Uploads** - Seamless image processing, text files, and full PDF text extraction via PDF.js.
- 🎨 **Premium Aesthetic UI** - Harmonious color themes, responsive sidebar overlay, full dark/light glassmorphic UI.
- 💬 **Advanced Markdown & KaTeX** - Full GFM style formatting, LaTeX math equation support.

## 🚀 Getting Started

### 1. Environment Configurations

Create a `.env` file in the root directory:

```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-1.5-flash

# Supabase Auth/DB Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Web Search API Proxy Base URL (Render server or local)
VITE_API_BASE_URL=http://localhost:4000/api
```

And in the `server` directory, create `server/.env` if self-hosting:
```env
PORT=4000
```

### 2. Local Installation & Development

To launch the project locally:

```bash
# Install root (frontend) dependencies
npm install

# Install backend search proxy dependencies
cd server
npm install
cd ..

# Start search proxy backend (Port 4000)
npm run dev --prefix server

# Start React dev server (Port 5173)
npm run dev
```

## 🏗️ Architecture

```
                 +-------------------+
                 |  React Frontend   |
                 |  (Chat-ji-Pitty)  |
                 +----+---------+----+
                      |         |
      (Auth / DB calls)         (Web Search fallback)
                      v         v
             +--------+---+   +-+---------------+
             |  Supabase  |   |  Render Proxy   |
             |  Serverless|   | (Stateless node)|
             +------------+   +-----------------+
```

---

Built with ❤️ by pritam-ray. All rights reserved.
