const express = require('express');
const cors = require('cors');
require('dotenv').config();

const WebSearchService = require('./services/webSearchService');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Web Search Service using backend environment key
const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const webSearchService = new WebSearchService(geminiApiKey);

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// ========================================
// Web Search Endpoints
// ========================================

// Stream chat response with web search (Server-Sent Events)
app.post('/api/chat/search/stream', async (req, res) => {
  try {
    const { message, conversationId, history } = req.body;
    
    console.log('[WebSearch Stream] Request received:', { message, conversationId });
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('[WebSearch Stream] Starting stream...');
    
    const result = await webSearchService.processQueryStream(
      message,
      history || [],
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    );

    console.log('[WebSearch Stream] Stream complete. Used search:', result.usedWebSearch);

    res.write(`data: ${JSON.stringify({ 
      done: true, 
      usedWebSearch: result.usedWebSearch 
    })}\n\n`);
    res.end();

  } catch (error) {
    console.error('[WebSearch Stream] Error:', error);
    res.write(`data: ${JSON.stringify({ 
      error: 'Failed to process web search',
      done: true 
    })}\n\n`);
    res.end();
  }
});

// Non-stream search summary endpoint
app.post('/api/chat/search', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let searchContent = await webSearchService.performDuckDuckGoSearch(message);
    res.json({
      success: true,
      response: searchContent,
      usedWebSearch: true
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// ========================================
// Health Check
// ========================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
