# Production Setup & Deployment Guide

This guide describes how to deploy the Chat-ji-Pitty application using **Supabase** for database/authentication, **Netlify** for the frontend React application, and **Render** for the stateless Web Search backend proxy.

---

## 🛠️ Step 1: Create and Configure Supabase

Supabase is a serverless alternative to Firebase that hosts PostgreSQL and handles User Authentication out-of-the-box.

1. Sign up/log in to [Supabase](https://supabase.com/).
2. Click **New Project** and create a project in your preferred region.
3. Open the **SQL Editor** tab in the sidebar dashboard.
4. Click **New Query**, paste the following SQL schema, and click **Run**:

```sql
-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New chat',
  azure_response_id TEXT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  display_content TEXT NULL,
  created_at BIGINT NOT NULL
);

-- Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'audio', 'file')),
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NULL,
  file_data TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
```

5. In the Supabase sidebar, navigate to **Project Settings** -> **API**.
6. Copy your **Project URL** and **Anon Public Key**. You will need these for deployment.

---

## 🚀 Step 2: Deploy Frontend on Netlify

Netlify hosts static web applications directly from GitHub with automatic rebuilds on push.

1. Commit your codebase to GitHub.
2. Sign in to [Netlify](https://www.netlify.com/).
3. Click **Add new site** -> **Import an existing project** -> Choose **GitHub**.
4. Authorize Netlify and select your cloned repository (`Chat-ji-pitty`).
5. Configure the Build Settings:
   - **Base directory**: (Leave blank if Vite is in the root directory. If your code is inside a subfolder, select it, otherwise leave empty).
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Add Environment Variables** and define the following variables:
   - `VITE_SUPABASE_URL`: (Your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Public Key)
   - `VITE_GROQ_API_KEY`: (Optional: Your Groq API Key from console.groq.com. Highly recommended!)
   - `VITE_GROQ_MODEL`: `llama-3.3-70b-versatile` (or other supported models)
   - `VITE_GEMINI_API_KEY`: (Optional fallback: Your Google Gemini API Key from Google AI Studio)
   - `VITE_GEMINI_MODEL`: `gemini-2.0-flash`
   - `VITE_API_BASE_URL`: (Your Render backend proxy URL, e.g. `https://your-app.onrender.com/api` - you can configure this after Step 3)
7. Click **Deploy Site**. Netlify will build and host the app, providing a production URL (e.g., `https://your-site.netlify.app`).

---

## 🌐 Step 3: Deploy Search Proxy on Render (Optional)

Since scraping web pages directly from the browser throws CORS security blocks, we use a stateless Express server to proxy Web Search (DuckDuckGo search queries).

1. Sign in to [Render](https://render.com/).
2. Click **New** -> **Web Service** -> Connect your GitHub repository.
3. Configure the Web Service settings:
   - **Name**: `chatbot-search-proxy`
   - **Runtime**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
4. Open the **Environment** tab on Render and add the environment variables:
   - `VITE_GROQ_API_KEY`: (Optional: Your Groq API Key)
   - `VITE_GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `VITE_GEMINI_API_KEY`: (Optional: Your Google Gemini API Key)
   - `VITE_GEMINI_MODEL`: `gemini-2.0-flash`
5. Click **Deploy Web Service**.
6. Render will compile and deploy your backend proxy, generating a public URL (e.g., `https://chatbot-search-proxy.onrender.com`).
7. **Important**: Go back to your **Netlify Environment Variables** and set `VITE_API_BASE_URL` to `https://chatbot-search-proxy.onrender.com/api` so that the frontend can call your search proxy! Re-deploy the Netlify frontend to apply the variable.

---

## 🔐 Enable Supabase Password Reset Redirect

To make password reset emails function correctly:
1. Open your **Supabase Dashboard**.
2. Go to **Authentication** -> **URL Configuration**.
3. Under **Redirect URLs**, click **Add URL** and paste your Netlify deployment URL (e.g., `https://your-site.netlify.app/`).
4. This ensures that clicking the password reset link inside the recovery email redirect users securely back to your Netlify app.
