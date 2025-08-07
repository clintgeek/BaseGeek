import axios from 'axios';

class AIService {
  constructor() {
    this.providers = {
      claude: {
        name: 'Claude 3.5 Sonnet',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        costPer1kTokens: 0.003,
        maxTokens: 1000,
        temperature: 0.7
      },
      groq: {
        name: 'Groq Llama 3.1',
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        model: 'llama-3.1-8b-instant',
        costPer1kTokens: 0.00027,
        maxTokens: 1000,
        temperature: 0.7
      },
      gemini: {
        name: 'Gemini 1.5 Flash',
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-flash',
        costPer1kTokens: 0.00035,
        maxTokens: 1000,
        temperature: 0.7
      }
    };

    this.currentProvider = 'claude';
    this.fallbackOrder = ['claude', 'groq', 'gemini'];
    this.sessionStats = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      providerUsage: {}
    };

    // Log API key status
    this.logApiKeyStatus();
  }

  // Log API key status for debugging
  logApiKeyStatus() {
    console.log('\n=== AI Service API Key Status ===');
    for (const [provider, config] of Object.entries(this.providers)) {
      const apiKey = config.apiKey;
      if (apiKey && apiKey.length > 10) {
        const maskedKey = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 8)}`;
        console.log(`${provider.toUpperCase()} API = ${maskedKey} ✅`);
      } else {
        console.log(`${provider.toUpperCase()} API = Not configured ❌`);
      }
    }
    console.log('================================\n');
  }

  /**
   * Generic AI call method that tries providers in fallback order
   */
  async callAI(prompt, config = {}) {
    const {
      provider = this.currentProvider,
      maxTokens = this.providers[provider].maxTokens,
      temperature = this.providers[provider].temperature,
      model = this.providers[provider].model
    } = config;

    // Try the specified provider first
    try {
      return await this.callProvider(provider, prompt, { maxTokens, temperature, model });
    } catch (error) {
      console.log(`Primary provider ${provider} failed, trying fallbacks...`);

      // Try fallback providers
      for (const fallbackProvider of this.fallbackOrder) {
        if (fallbackProvider !== provider) {
          try {
            return await this.callProvider(fallbackProvider, prompt, { maxTokens, temperature });
          } catch (fallbackError) {
            console.log(`Fallback provider ${fallbackProvider} failed:`, fallbackError.message);
          }
        }
      }

      throw new Error('All AI providers failed');
    }
  }

  /**
   * Call specific AI provider
   */
  async callProvider(provider, prompt, config = {}) {
    const providerConfig = this.providers[provider];
    if (!providerConfig.apiKey) {
      throw new Error(`${provider} API key not configured`);
    }

    const { maxTokens = providerConfig.maxTokens, temperature = providerConfig.temperature, model = providerConfig.model } = config;

    switch (provider) {
      case 'claude':
        return await this.callClaude(prompt, { maxTokens, temperature, model });
      case 'groq':
        return await this.callGroq(prompt, { maxTokens, temperature, model });
      case 'gemini':
        return await this.callGemini(prompt, { maxTokens, temperature, model });
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt, config = {}) {
    const { maxTokens = 1000, temperature = 0.7, model = 'claude-3-5-sonnet-20241022' } = config;

    try {
      const response = await axios.post(`${this.providers.claude.baseURL}/messages`, {
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.providers.claude.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      const result = response.data.content[0].text;
      this.updateStats('claude', response.data.usage?.input_tokens || 0, response.data.usage?.output_tokens || 0);

      return result;
    } catch (error) {
      console.error('Claude API error:', error.message);
      throw error;
    }
  }

  /**
   * Call Groq API
   */
  async callGroq(prompt, config = {}) {
    const { maxTokens = 1000, temperature = 0.7, model = 'llama-3.1-8b-instant' } = config;

    try {
      const response = await axios.post(`${this.providers.groq.baseURL}/chat/completions`, {
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.providers.groq.apiKey}`
        },
        timeout: 30000
      });

      const result = response.data.choices[0].message.content;
      this.updateStats('groq', response.data.usage?.prompt_tokens || 0, response.data.usage?.completion_tokens || 0);

      return result;
    } catch (error) {
      console.error('Groq API error:', error.message);
      throw error;
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, config = {}) {
    const { maxTokens = 1000, temperature = 0.7, model = 'gemini-1.5-flash' } = config;

    try {
      const response = await axios.post(`${this.providers.gemini.baseURL}/models/${model}:generateContent`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: this.providers.gemini.apiKey
        },
        timeout: 30000
      });

      const result = response.data.candidates[0].content.parts[0].text;
      this.updateStats('gemini', response.data.usageMetadata?.promptTokenCount || 0, response.data.usageMetadata?.candidatesTokenCount || 0);

      return result;
    } catch (error) {
      console.error('Gemini API error:', error.message);
      throw error;
    }
  }

  /**
   * Parse JSON response from AI
   */
  parseJSONResponse(responseText) {
    try {
      // Extract JSON from response (handle markdown formatting)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Update usage statistics
   */
  updateStats(provider, inputTokens, outputTokens) {
    const totalTokens = inputTokens + outputTokens;
    const cost = (totalTokens / 1000) * this.providers[provider].costPer1kTokens;

    this.sessionStats.totalCalls++;
    this.sessionStats.totalTokens += totalTokens;
    this.sessionStats.totalCost += cost;

    if (!this.sessionStats.providerUsage[provider]) {
      this.sessionStats.providerUsage[provider] = { calls: 0, tokens: 0, cost: 0 };
    }

    this.sessionStats.providerUsage[provider].calls++;
    this.sessionStats.providerUsage[provider].tokens += totalTokens;
    this.sessionStats.providerUsage[provider].cost += cost;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      ...this.sessionStats,
      averageCostPerCall: this.sessionStats.totalCalls > 0 ? this.sessionStats.totalCost / this.sessionStats.totalCalls : 0
    };
  }

  /**
   * Reset session statistics
   */
  resetSessionStats() {
    this.sessionStats = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      providerUsage: {}
    };
  }

  /**
   * Set the current provider
   */
  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter(provider =>
      this.providers[provider].apiKey && this.providers[provider].apiKey.length > 10
    );
  }
}

export default new AIService();
