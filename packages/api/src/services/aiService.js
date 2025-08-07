import axios from 'axios';
import AIConfig from '../models/AIConfig.js';
import AIModel from '../models/AIModel.js';
import AIPricing from '../models/AIPricing.js';
import aiUsageService from './aiUsageService.js';
import AIFreeTier from '../models/AIFreeTier.js';
import AIUsage from '../models/AIUsage.js';

class AIService {
  constructor() {
    this.providers = {
      anthropic: {
        name: 'Claude 3.5 Sonnet',
        apiKey: '',
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        costPer1kTokens: 0.003,
        maxTokens: 4000,
        temperature: 0.7,
        enabled: false
      },
      groq: {
        name: 'Groq Llama 3.1',
        apiKey: '',
        baseURL: 'https://api.groq.com/openai/v1',
        model: 'llama-3.1-8b-instant',
        costPer1kTokens: 0.00027,
        maxTokens: 4000,
        temperature: 0.7,
        enabled: false
      },
      gemini: {
        name: 'Gemini 1.5 Flash',
        apiKey: '',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-flash',
        costPer1kTokens: 0.00035,
        maxTokens: 4000,
        temperature: 0.7,
        enabled: false
      },
      together: {
        name: 'Together AI',
        apiKey: '',
        baseURL: 'https://api.together.xyz/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        costPer1kTokens: 0.0002,
        maxTokens: 4000,
        temperature: 0.7,
        enabled: false
      }
    };

    this.currentProvider = 'groq';
    this.fallbackOrder = ['groq', 'together', 'gemini', 'anthropic'];
    this.sessionStats = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      providerUsage: {}
    };

    // Initialize configurations (will be loaded asynchronously)
    this.initialized = false;
    this.initializeService();
  }

  async initializeService() {
    try {
      await this.loadConfigurations();
      await this.seedInitialModels();
      this.initialized = true;
      console.log('AI Service initialized with configurations from database');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  // Load configurations from database
  async loadConfigurations() {
    try {
      console.log('🔍 Loading AI configurations from database...');
      const configs = await AIConfig.find({});
      console.log(`📊 Found ${configs.length} configurations in database`);

      for (const config of configs) {
        console.log(`  ${config.provider}: enabled=${config.enabled}, apiKey=${config.apiKey ? 'Set' : 'Not Set'}`);
        if (this.providers[config.provider]) {
          this.providers[config.provider].apiKey = config.apiKey;
          this.providers[config.provider].enabled = config.enabled;
          this.providers[config.provider].model = config.model || this.providers[config.provider].model;
          this.providers[config.provider].maxTokens = config.maxTokens || this.providers[config.provider].maxTokens;
          this.providers[config.provider].temperature = config.temperature || this.providers[config.provider].temperature;
        }
      }
      this.logApiKeyStatus();
    } catch (error) {
      console.error('Failed to load AI configurations:', error);
      console.error('Error details:', error.stack);
    }
  }

  async refreshModels(provider) {
    try {
      let models = [];

      switch (provider) {
        case 'groq':
          if (this.providers.groq.apiKey) {
            const response = await axios.get('https://api.groq.com/openai/v1/models', {
              headers: { 'Authorization': `Bearer ${this.providers.groq.apiKey}` }
            });
            models = response.data.data || [];
          }
          break;

        case 'together':
          if (this.providers.together.apiKey) {
            try {
              console.log('Fetching Together.ai models...');
              const response = await axios.get('https://api.together.xyz/v1/models', {
                headers: { 'Authorization': `Bearer ${this.providers.together.apiKey}` },
                timeout: 10000
              });
              console.log('Together.ai response:', response.data);
              // Together.ai returns an array directly, not wrapped in data property
              const togetherModels = response.data || [];
              // Transform to match our expected format and save pricing
              models = togetherModels.map(model => {
                // Save pricing to database if available
                if (model.pricing) {
                  AIPricing.findOneAndUpdate(
                    { provider: 'together', modelId: model.id },
                    {
                      inputPrice: model.pricing.input,
                      outputPrice: model.pricing.output,
                      lastUpdated: new Date(),
                      isActive: true
                    },
                    { upsert: true, new: true }
                  ).catch(error => {
                    console.error(`Failed to save pricing for ${model.id}:`, error);
                  });
                }

                return {
                  id: model.id,
                  name: model.display_name
                };
              });
              console.log('Transformed Together.ai models:', models);
            } catch (error) {
              console.error('Together.ai API error:', error.message);
              if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
              }
              throw new Error(`Together.ai API error: ${error.message}`);
            }
          } else {
            console.log('Together.ai API key not configured');
            throw new Error('Together.ai API key not configured');
          }
          break;

        case 'anthropic':
          // Hardcoded models from Anthropic docs
          models = [
            { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
            { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' },
            { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3' }
          ];
          break;

        case 'gemini':
          // Hardcoded models for Gemini
          models = [
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-pro', name: 'Gemini Pro' }
          ];
          break;
      }

      // Update database with new models
      for (const model of models) {
        await AIModel.findOneAndUpdate(
          { provider, modelId: model.id },
          {
            name: model.name,
            lastChecked: new Date(),
            isActive: true
          },
          { upsert: true, new: true }
        );
      }

      // Mark models as inactive if they're no longer available
      await AIModel.updateMany(
        {
          provider,
          lastChecked: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
        },
        { isActive: false }
      );

      return models;
    } catch (error) {
      console.error(`Failed to refresh models for ${provider}:`, error);
      throw error;
    }
  }

  async getModels(provider) {
    try {
      // Get models from database
      const dbModels = await AIModel.find({
        provider,
        isActive: true
      }).sort({ name: 1 });

      return dbModels.map(model => ({
        id: model.modelId,
        name: model.name
      }));
    } catch (error) {
      console.error(`Failed to get models for ${provider}:`, error);
      return [];
    }
  }

    async seedInitialModels() {
    try {
      const initialModels = {
        anthropic: [
          { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
          { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
          { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7' },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' },
          { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3' }
        ],
        gemini: [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-pro', name: 'Gemini Pro' }
        ]
      };

      for (const [provider, models] of Object.entries(initialModels)) {
        for (const model of models) {
          await AIModel.findOneAndUpdate(
            { provider, modelId: model.id },
            {
              name: model.name,
              lastChecked: new Date(),
              isActive: true
            },
            { upsert: true, new: true }
          );
        }
      }

      console.log('Initial AI models seeded successfully');
    } catch (error) {
      console.error('Failed to seed initial models:', error);
    }
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
    // Wait for service to be initialized
    if (!this.initialized) {
      console.log('Waiting for AI service to initialize...');
      let attempts = 0;
      while (!this.initialized && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (!this.initialized) {
        throw new Error('AI service failed to initialize');
      }
    }

    const {
      provider = this.currentProvider,
      maxTokens = this.providers[provider].maxTokens,
      temperature = this.providers[provider].temperature,
      model = this.providers[provider].model,
      userId = null,
      appName = 'unknown'
    } = config;

    // Check usage limits before making the call
    if (userId) {
      const modelToUse = model || this.providers[provider]?.model;
      const availability = await aiUsageService.checkIfModelAvailable(provider, modelToUse, userId);

      if (!availability.available) {
        return {
          success: false,
          error: `Model not available: ${availability.reason}`,
          usage: availability.usage
        };
      }
    }

    // Try the specified provider first
    try {
      const result = await this.callProvider(provider, prompt, { maxTokens, temperature, model });

      // Track usage in session stats
      await this.updateStats(provider, result.inputTokens || 0, result.outputTokens || 0, model, appName);

      // Track usage (use session-level tracking if no userId provided)
      const trackingUserId = userId || 'session';
      const modelToUse = model || this.providers[provider]?.model;
      await aiUsageService.trackUsage(provider, modelToUse, trackingUserId, {
        inputTokens: result.inputTokens || 0,
        outputTokens: result.outputTokens || 0,
        requests: 1
      });

      return result.content;
    } catch (error) {
      console.log(`Primary provider ${provider} failed:`, error.message);
      console.log(`Trying fallbacks: ${this.fallbackOrder.filter(p => p !== provider).join(' → ')}`);

      // Try fallback providers
      for (const fallbackProvider of this.fallbackOrder) {
        if (fallbackProvider !== provider) {
          try {
            console.log(`Trying fallback provider: ${fallbackProvider}`);
            const result = await this.callProvider(fallbackProvider, prompt, { maxTokens, temperature });

            // Track usage in session stats for fallback
            await this.updateStats(fallbackProvider, result.inputTokens || 0, result.outputTokens || 0, this.providers[fallbackProvider]?.model, appName);

            // Track usage for fallback provider (use session-level tracking if no userId provided)
            const fallbackModel = this.providers[fallbackProvider]?.model;
            const fallbackTrackingUserId = userId || 'session';
            await aiUsageService.trackUsage(fallbackProvider, fallbackModel, fallbackTrackingUserId, {
              inputTokens: result.inputTokens || 0,
              outputTokens: result.outputTokens || 0,
              requests: 1
            });

            console.log(`Fallback provider ${fallbackProvider} succeeded`);
            return result.content;
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
      case 'anthropic':
        return await this.callClaude(prompt, { maxTokens, temperature, model });
      case 'groq':
        return await this.callGroq(prompt, { maxTokens, temperature, model });
      case 'gemini':
        return await this.callGemini(prompt, { maxTokens, temperature, model });
      case 'together':
        return await this.callTogether(prompt, { maxTokens, temperature, model });
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
      const response = await axios.post(`${this.providers.anthropic.baseURL}/messages`, {
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
          'x-api-key': this.providers.anthropic.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000
      });

      const result = response.data.content[0].text;

      return {
        content: result,
        inputTokens: response.data.usage?.input_tokens || 0,
        outputTokens: response.data.usage?.output_tokens || 0
      };
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
        timeout: 60000
      });

      const result = response.data.choices[0].message.content;

      return {
        content: result,
        inputTokens: response.data.usage?.prompt_tokens || 0,
        outputTokens: response.data.usage?.completion_tokens || 0
      };
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
        timeout: 60000
      });

      const result = response.data.candidates[0].content.parts[0].text;

      return {
        content: result,
        inputTokens: response.data.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.data.usageMetadata?.candidatesTokenCount || 0
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      throw error;
    }
  }

  /**
   * Call Together AI API
   */
  async callTogether(prompt, config = {}) {
    const { maxTokens = 1000, temperature = 0.7, model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free' } = config;

    try {
      const response = await axios.post(`${this.providers.together.baseURL}/chat/completions`, {
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.providers.together.apiKey}`
        },
        timeout: 60000
      });

      const result = response.data.choices[0].message.content;

      return {
        content: result,
        inputTokens: response.data.usage?.prompt_tokens || 0,
        outputTokens: response.data.usage?.completion_tokens || 0
      };
    } catch (error) {
      console.error('Together AI API error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
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
    async updateStats(provider, inputTokens, outputTokens, modelId = null, appName = 'unknown') {
    const totalTokens = inputTokens + outputTokens;

    // Check if this model is free and within limits
    let actualCost = 0;
    let isFreeUsage = false;

    if (modelId) {
      try {
        // Check if model is in free tier
        const freeTier = await AIFreeTier.findOne({ provider, modelId });
        if (freeTier?.isFree) {
          // Check current usage for this model
          const usage = await AIUsage.findOne({
            provider,
            modelId,
            userId: 'session', // We'll need to pass actual userId
            date: new Date().toDateString()
          });

          if (usage) {
            // Check if we're still within free limits
            const isWithinLimits = !usage.isAtLimit.requestsPerDay &&
                                 !usage.isAtLimit.tokensPerDay &&
                                 !usage.isAtLimit.requestsPerMinute &&
                                 !usage.isAtLimit.tokensPerMinute;

            if (isWithinLimits) {
              isFreeUsage = true;
              actualCost = 0; // Free!
            } else {
              // Exceeded free tier - calculate cost
              actualCost = (totalTokens / 1000) * this.providers[provider].costPer1kTokens;
            }
          } else {
            // No usage record yet - assume free
            isFreeUsage = true;
            actualCost = 0;
          }
        } else {
          // Not a free model - always charge
          actualCost = (totalTokens / 1000) * this.providers[provider].costPer1kTokens;
        }
      } catch (error) {
        console.error('Error checking free tier status:', error);
        // Fallback to charging
        actualCost = (totalTokens / 1000) * this.providers[provider].costPer1kTokens;
      }
    } else {
      // No modelId provided - charge normally
      actualCost = (totalTokens / 1000) * this.providers[provider].costPer1kTokens;
    }

    this.sessionStats.totalCalls++;
    this.sessionStats.totalTokens += totalTokens;
    this.sessionStats.totalCost += actualCost;

    console.log(`Updated session stats: calls=${this.sessionStats.totalCalls}, tokens=${this.sessionStats.totalTokens}, cost=${this.sessionStats.totalCost}`);

        if (!this.sessionStats.providerUsage[provider]) {
      this.sessionStats.providerUsage[provider] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        freeCalls: 0,
        paidCalls: 0,
        appUsage: {}
      };
    }

    this.sessionStats.providerUsage[provider].calls++;
    this.sessionStats.providerUsage[provider].tokens += totalTokens;
    this.sessionStats.providerUsage[provider].cost += actualCost;

    console.log(`Updated provider stats for ${provider}: calls=${this.sessionStats.providerUsage[provider].calls}, tokens=${this.sessionStats.providerUsage[provider].tokens}, cost=${this.sessionStats.providerUsage[provider].cost}`);

    // Track app usage
    if (!this.sessionStats.providerUsage[provider].appUsage[appName]) {
      this.sessionStats.providerUsage[provider].appUsage[appName] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        freeCalls: 0,
        paidCalls: 0
      };
    }

    this.sessionStats.providerUsage[provider].appUsage[appName].calls++;
    this.sessionStats.providerUsage[provider].appUsage[appName].tokens += totalTokens;
    this.sessionStats.providerUsage[provider].appUsage[appName].cost += actualCost;

    console.log(`Updated app stats for ${provider}/${appName}: calls=${this.sessionStats.providerUsage[provider].appUsage[appName].calls}, tokens=${this.sessionStats.providerUsage[provider].appUsage[appName].tokens}, cost=${this.sessionStats.providerUsage[provider].appUsage[appName].cost}`);

    if (isFreeUsage) {
      this.sessionStats.providerUsage[provider].freeCalls =
        (this.sessionStats.providerUsage[provider].freeCalls || 0) + 1;
      this.sessionStats.providerUsage[provider].appUsage[appName].freeCalls++;
    } else {
      this.sessionStats.providerUsage[provider].paidCalls =
        (this.sessionStats.providerUsage[provider].paidCalls || 0) + 1;
      this.sessionStats.providerUsage[provider].appUsage[appName].paidCalls++;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    console.log('Getting session stats:', this.sessionStats);
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
