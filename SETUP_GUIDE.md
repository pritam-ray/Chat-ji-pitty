# Quick Setup Guide

## Step 1: Create Database

1. Open MySQL Workbench
2. Copy the entire content from `database_setup.sql`
3. Paste and execute in MySQL Workbench
4. Verify tables created:
   ```sql
   USE chatbot;
   SHOW TABLES;
   -- Should show: conversations, messages, attachments, azure_sessions
   ```

## Step 2: Configure Backend

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `server/.env` with your MySQL credentials:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=chatbot
   ```

5. Start server:
   ```bash
   npm start
   ```

   You should see:
   ```
   ✓ MySQL database connected successfully
   Server running on http://localhost:4000
   ```

## Step 3: Configure Frontend

1. Go back to root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Azure OpenAI credentials:
   ```env
   VITE_AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
   VITE_AZURE_OPENAI_API_KEY=your-azure-api-key-here
   VITE_AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   VITE_AZURE_OPENAI_API_VERSION=2024-08-01-preview
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

5. Start frontend:
   ```bash
   npm run dev
   ```

   Open browser at `http://localhost:5173`

## Step 4: Test the App

1. Click "New chat" button
2. Type a message and send
3. Watch the response stream in real-time
4. Check the console logs:
   - `[App] Using Azure Response API with session management` (for text messages)
   - Session ID will be created and stored

5. Send another message in the same conversation:
   - Azure will use the stored session ID
   - No full history sent = lower token costs!

6. Verify in database:
   ```sql
   USE chatbot;
   
   -- Check conversations
   SELECT id, title, azure_session_id, 
          FROM_UNIXTIME(created_at/1000) as created 
   FROM conversations;
   
   -- Check messages
   SELECT c.title, m.role, LEFT(m.content, 50) as content
   FROM messages m
   JOIN conversations c ON m.conversation_id = c.id
   ORDER BY m.created_at DESC
   LIMIT 10;
   ```

## Troubleshooting

### Backend Issues

**Error: Access denied for user**
- Check MySQL credentials in `server/.env`
- Verify user has permissions: `GRANT ALL ON chatbot.* TO 'your_user'@'localhost';`

**Error: Database 'chatbot' doesn't exist**
- Run `database_setup.sql` in MySQL Workbench first

**Port 4000 already in use**
- Change `PORT` in `server/.env` to another port (e.g., 4001)
- Update `VITE_API_BASE_URL` in frontend `.env` accordingly

### Frontend Issues

**Error: Failed to fetch conversations**
- Ensure backend server is running on port 4000
- Check `VITE_API_BASE_URL` in `.env`
- Check browser console for CORS errors

**Azure API errors**
- Verify `VITE_AZURE_OPENAI_ENDPOINT` is correct
- Check `VITE_AZURE_OPENAI_API_KEY` is valid
- Ensure `VITE_AZURE_OPENAI_DEPLOYMENT_NAME` matches your deployment
- Try API version `2024-08-01-preview` or `2024-02-15-preview`

**Session API not working**
- Check console for `[App] Using Azure Response API with session management`
- If you see "session API unavailable", it will fall back to standard API (still works!)
- Response API may not be available in all regions yet

### Testing Session Management

1. Open browser dev tools (F12) → Console tab
2. Send a message
3. Look for: `[App] Using Azure Response API with session management`
4. Check database for session ID:
   ```sql
   SELECT title, azure_session_id FROM conversations 
   WHERE azure_session_id IS NOT NULL;
   ```

## Production Deployment

### Backend
```bash
cd server
npm install --production
# Use PM2 or similar for process management
pm2 start server.js --name chatbot-api
```

### Frontend
```bash
npm run build
# Serve the dist/ folder with nginx, Apache, or hosting service
```

### Environment Variables in Production
- Use secure vaults for API keys
- Enable HTTPS for backend API
- Configure CORS properly for your domain
- Use connection pooling for MySQL (already configured)

## Next Steps

- Add user authentication
- Implement conversation sharing
- Add rate limiting
- Set up backup for MySQL database
- Monitor token usage with `azure_sessions` table
- Add conversation export feature
