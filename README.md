# Chat-ji-Pitty 🤖

A premium full-stack AI chatbot application named **Chat-ji-Pitty**. It integrates **Gemini AI** for conversation generation, **Supabase** for user authentication and conversational database persistence, and a stateless **Render** Node.js proxy for live web search queries.

![Chat-ji-Pitty](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-API-green)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-red)

---

## ✨ Features

- 🤖 **Gemini AI Integration** - High-speed, streaming completions powered by Google Gemini (Free Tier/Gemini 1.5 Flash).
- 💾 **Supabase Authentication & DB** - Robust user authentication, session-based persistence, profiles, and messages stored securely in Supabase.
- 🔄 **Multi-Key Failover Rotation** - Support for multiple Gemini API keys in a queue with automated failover logic when rate limits are exhausted.
- 🔍 **Stateless Web Search** - Cheerio/Axios-powered background search scraper running on Render backend, enabling up-to-the-minute web retrieval fallback.
- ⏰ **Database Keep-Awake Endpoint** - Exposes a simple `/api/ping-db` route that can be scheduled to ping Supabase, preventing the free database tier from pausing due to inactivity.
- 📎 **Multimodal Uploads** - Seamless image processing, text files, and full PDF text extraction via PDF.js.
- 🎨 **Premium Aesthetic UI** - Harmonious color themes, responsive sidebar overlay, full dark/light glassmorphic UI.
- 💬 **Advanced Markdown & KaTeX** - Full GFM style formatting, LaTeX math equation support.

---

## 🔑 Google Gemini API Keys & Rate Limits

### Where to generate Gemini API Keys?
1. Sign up/log in to [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API key** on the top sidebar.
3. Select your project and generate a new key. You can generate multiple keys (e.g. 3 to 4 keys) to set up failover rotation!

### Will the free API key last for unlimited prompts?
No. Google Gemini's **Free Tier** has strict rate limits. For the recommended model `gemini-1.5-flash`:
- **15 RPM** (Requests Per Minute)
- **1 million TPM** (Tokens Per Minute)
- **1,500 RPD** (Requests Per Day)

If your app generates a large volume of requests or gets loaded with consecutive prompts, you may run into **HTTP 429 (Too Many Requests)** errors or quota exhaustion warnings.

### Automated Key Failover Rotation
To resolve these limits, **Chat-ji-Pitty** supports comma-separated list of API keys. If the current API key is exhausted or encounters a rate limit, the application automatically catches the error and fail-overs to the next API key in the list.

Define them in your `.env` (both in the frontend root and backend `server/.env`) like this:
```env
VITE_GEMINI_API_KEY=key_one_xxxx, key_two_xxxx, key_three_xxxx, key_four_xxxx
```
The rotation logic cycles through `key_one` -> `key_two` -> `key_three` -> `key_four`. It will only fail back to a simulated demo stream if all configured keys are exhausted.

---

## ⏰ Supabase Database Keep-Awake Ping

To prevent Supabase projects on the **Free Tier** from going to sleep / pausing after 7 days of inactivity, a keep-awake database ping route has been implemented in the Node.js backend.

### Endpoint Route
- **Method**: `GET`
- **URL Path**: `/api/ping-db` (e.g., `https://your-search-proxy.onrender.com/api/ping-db`)

### How it works
When this URL is called, the Render backend automatically makes a request to your Supabase project's REST PostgREST API (`/rest/v1/conversations?select=id&limit=1`). This creates real database activity, resetting Supabase's inactivity timer.

### Setting up a Cron Job
You can use external free uptime checkers (e.g., [UptimeRobot](https://uptimerobot.com/), [Better Uptime](https://betterstack.com/uptime), or [Cron-Job.org](https://cron-job.org/)) to request this endpoint every **5 to 7 days**:
1. Create a free account on the monitoring tool.
2. Add a new HTTP/GET monitor pointing to: `https://your-search-proxy.onrender.com/api/ping-db`
3. Set the polling frequency to once every **5 days** (or 120 hours).

---

## 🚀 Getting Started

### 1. Environment Configurations

Create a `.env` file in the root directory:

```env
# Comma-separated Gemini API Keys for failover rotation
VITE_GEMINI_API_KEY=key_1, key_2, key_3

VITE_GEMINI_MODEL=gemini-1.5-flash

# Supabase Auth/DB Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Web Search API Proxy Base URL (Render server or local)
VITE_API_BASE_URL=http://localhost:4000/api
```

Also, create a `.env` in the `server` directory for your search proxy:
```env
PORT=4000
VITE_GEMINI_API_KEY=key_1, key_2, key_3
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
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

---

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
             +------------+   +--------+--------+
                                       | (Pings DB)
                                       v
                               +-------+--------+
                               | Supabase REST  |
                               +----------------+
```

---

Built with ❤️ by pritam-ray. All rights reserved.
