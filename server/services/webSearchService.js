const axios = require('axios');
const cheerio = require('cheerio');

class WebSearchService {
  constructor(geminiApiKey) {
    this.apiKey = geminiApiKey;
    this.model = process.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async scrapeWebPage(url, maxLength = 3000) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 8000,
        maxRedirects: 3,
      });

      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header, iframe, noscript').remove();
      
      let content = '';
      const contentSelectors = [
        'article', 'main', '[role="main"]', '.content', '.article-content',
        '.post-content', '#content', '.entry-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length) {
          content = element.text();
          break;
        }
      }
      
      if (!content) {
        content = $('body').text();
      }
      
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      return content.substring(0, maxLength);
    } catch (error) {
      console.log(`[Scraper] Failed to scrape ${url}: ${error.message}`);
      return null;
    }
  }

  async performDuckDuckGoSearch(query) {
    try {
      console.log(`[DuckDuckGo] Searching for: ${query}`);
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result').each((i, element) => {
        if (i >= 5) return false;
        
        const title = $(element).find('.result__title').text().trim();
        const snippet = $(element).find('.result__snippet').text().trim();
        const url = $(element).find('.result__url').attr('href');
        
        if (title && url) {
          let actualUrl = url;
          try {
            if (url.includes('uddg=')) {
              const urlParams = new URLSearchParams(url.split('?')[1]);
              actualUrl = decodeURIComponent(urlParams.get('uddg') || url);
            }
          } catch (e) {
            actualUrl = url;
          }
          
          results.push({ title, snippet, url: actualUrl });
        }
      });

      if (results.length === 0) {
        return 'No search results found. I will answer based on my training data.';
      }

      console.log(`[DuckDuckGo] Found ${results.length} results, scraping content...`);

      let combinedContent = `🔍 WEB SEARCH RESULTS\n${'='.repeat(60)}\n\n`;
      combinedContent += `Search Query: "${query}"\n`;
      combinedContent += `Found ${results.length} relevant web pages\n\n`;

      const scrapePromises = results.slice(0, 3).map(async (result, i) => {
        const scrapedContent = await this.scrapeWebPage(result.url);
        return { result, scrapedContent, index: i };
      });
      
      const scrapedResults = await Promise.all(scrapePromises);
      
      for (const { result, scrapedContent, index } of scrapedResults) {
        combinedContent += `\n${'─'.repeat(60)}\n`;
        combinedContent += `📄 RESULT ${index + 1}: ${result.title}\n`;
        combinedContent += `${'─'.repeat(60)}\n\n`;
        
        if (scrapedContent) {
          combinedContent += `${scrapedContent}\n\n`;
        } else if (result.snippet) {
          combinedContent += `${result.snippet}\n\n`;
        }
        
        combinedContent += `🔗 Source: ${result.url}\n`;
      }
      
      for (let i = 3; i < results.length; i++) {
        const result = results[i];
        combinedContent += `\n${'─'.repeat(60)}\n`;
        combinedContent += `📄 RESULT ${i + 1}: ${result.title}\n`;
        combinedContent += `${'─'.repeat(60)}\n\n`;
        combinedContent += `${result.snippet}\n\n`;
        combinedContent += `🔗 Source: ${result.url}\n`;
      }

      combinedContent += `\n${'='.repeat(60)}\n`;
      return combinedContent;
    } catch (error) {
      console.error('[DuckDuckGo] Error:', error.message);
      return 'Unable to fetch search results. I will answer based on my training data.';
    }
  }

  async processQueryStream(userMessage, conversationHistory = [], onToken) {
    try {
      if (onToken) {
        onToken('🔍 Searching the web...\n\n');
      }
      
      const searchResults = await this.performDuckDuckGoSearch(userMessage);
      
      if (onToken) {
        onToken('✓ Search complete. Analyzing results...\n\n');
      }

      // Build message array for Gemini OpenAI-compatible completions
      const messages = [
        {
          role: 'system',
          content: 'You are a knowledgeable AI assistant with access to real-time web search results.\n' +
            'Your responses should be:\n' +
            '1. Accurate and based on the current web search results provided\n' +
            '2. Well-structured with clear sections or bullet points when appropriate\n' +
            '3. Comprehensive yet concise\n' +
            '4. Include relevant facts, dates, and context from the search results\n' +
            '5. Cite sources by mentioning website names or organizations when presenting information\n' +
            '6. Provide up-to-date information based on the search results\n\n' +
            'Format your response in a user-friendly way with proper paragraphs and organization.'
        }
      ];

      // Add history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });

      // Add query with search results
      messages.push({
        role: 'user',
        content: `Question: ${userMessage}\n\n${searchResults}\n\nBased on the web search results provided above, please give me a comprehensive and well-organized answer to my question. Structure your response with clear paragraphs and include relevant details from the sources.`
      });

      if (!this.apiKey) {
        if (onToken) {
          onToken('[Demo Mode - Gemini API Key Not Configured in Backend]\n');
          onToken('Here is what was found:\n' + searchResults.substring(0, 500) + '...');
        }
        return { success: true, usedWebSearch: true };
      }

      const apiKeys = this.apiKey.split(',').map(k => k.trim()).filter(Boolean);
      if (apiKeys.length === 0) {
        if (onToken) {
          onToken('[Demo Mode - Gemini API Key Not Configured in Backend]\n');
          onToken('Here is what was found:\n' + searchResults.substring(0, 500) + '...');
        }
        return { success: true, usedWebSearch: true };
      }

      let lastError = null;
      const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

      for (let idx = 0; idx < apiKeys.length; idx++) {
        const key = apiKeys[idx];
        console.log(`[WebSearchService] Attempting connection with API key index ${idx + 1}/${apiKeys.length}`);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: this.model,
              messages,
              stream: true,
              max_tokens: 4000,
              temperature: 0.7,
            })
          });

          if (!response.ok) {
            console.warn(`[WebSearchService] Key ${idx + 1} failed with status: ${response.status}`);
            lastError = new Error(`Gemini API returned ${response.status}`);
            continue; // Rotate to next key
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) {
            throw new Error('Response body is not readable');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmedLine.slice(6));
                  const token = data.choices?.[0]?.delta?.content;
                  if (token && onToken) {
                    onToken(token);
                  }
                } catch (e) {
                  // ignore parse errors
                }
              }
            }
          }

          return { success: true, usedWebSearch: true };
        } catch (err) {
          console.warn(`[WebSearchService] Error with Key ${idx + 1}: ${err.message}`);
          lastError = err;
        }
      }

      // If all keys fail, throw the last error
      throw lastError || new Error('All configured API keys failed.');
    } catch (error) {
      console.error('[WebSearchService] Streaming error:', error);
      if (onToken) {
        onToken(`\n\n⚠️ Error processing request: ${error.message}`);
      }
      return { success: false, usedWebSearch: false };
    }
  }
}

module.exports = WebSearchService;
