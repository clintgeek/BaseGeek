import aiService from './aiService.js';
import AIModel from '../models/AIModel.js';
import AIPricing from '../models/AIPricing.js';
import AIFreeTier from '../models/AIFreeTier.js';
import aiModelCapabilitiesService from './aiModelCapabilitiesService.js';

class AIDirectorService {
  constructor() {
    this.providerPricing = {
      anthropic: {
        'claude-opus-4-1-20250805': { input: 15, output: 75 },
        'claude-opus-4-20250514': { input: 15, output: 75 },
        'claude-sonnet-4-20250514': { input: 3, output: 15 },
        'claude-3-7-sonnet-20250219': { input: 3, output: 15 },
        'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
        'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
        'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
      },
      groq: {
        'llama-3.1-8b-instant': { input: 0.00027, output: 0.00027 },
        'llama-3.1-70b-versatile': { input: 0.0007, output: 0.0007 },
        'llama-3.1-405b-reasoning': { input: 0.002, output: 0.002 },
        'mixtral-8x7b-instant': { input: 0.00027, output: 0.00027 },
        'gemma-2-9b-it': { input: 0.00027, output: 0.00027 },
        'llama-3.3-70b-versatile': { input: 0.0007, output: 0.0007 },
        'llama3-8b-8192': { input: 0.00027, output: 0.00027 },
        'llama3-70b-8192': { input: 0.0007, output: 0.0007 },
        'gemma2-9b-it': { input: 0.00027, output: 0.00027 },
        'compound-beta': { input: 0.00027, output: 0.00027 },
        'compound-beta-mini': { input: 0.00027, output: 0.00027 },
        'meta-llama/llama-4-scout-17b-16e-instruct': { input: 0.0007, output: 0.0007 },
        'meta-llama/llama-4-maverick-17b-128e-instruct': { input: 0.0007, output: 0.0007 },
        'meta-llama/llama-guard-4-12b': { input: 0.0007, output: 0.0007 },
        'meta-llama/llama-prompt-guard-2-22m': { input: 0.00027, output: 0.00027 },
        'meta-llama/llama-prompt-guard-2-86m': { input: 0.00027, output: 0.00027 },
        'qwen/qwen3-32b': { input: 0.0007, output: 0.0007 },
        'moonshotai/kimi-k2-instruct': { input: 0.0007, output: 0.0007 },
        'openai/gpt-oss-20b': { input: 0.0007, output: 0.0007 },
        'openai/gpt-oss-120b': { input: 0.002, output: 0.002 },
        'allam-2-7b': { input: 0.00027, output: 0.00027 },
        'deepseek-r1-distill-llama-70b': { input: 0.0007, output: 0.0007 },
        'whisper-large-v3': { input: 0.00027, output: 0.00027 },
        'whisper-large-v3-turbo': { input: 0.00027, output: 0.00027 },
        'distil-whisper-large-v3-en': { input: 0.00027, output: 0.00027 },
        'playai-tts': { input: 0.00027, output: 0.00027 },
        'playai-tts-arabic': { input: 0.00027, output: 0.00027 }
      },
      gemini: {
        'gemini-1.5-flash': { input: 0.00035, output: 1.05 },
        'gemini-1.5-pro': { input: 3.5, output: 10.5 },
        'gemini-pro': { input: 0.5, output: 1.5 }
      },
      together: {
        'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free': { input: 0.0002, output: 0.0002 },
        'meta-llama/Llama-3.1-8B-Instruct': { input: 0.0002, output: 0.0002 },
        'togethercomputer/llama-3.1-8b-instruct': { input: 0.0002, output: 0.0002 }
      }
    };
  }

  async collectModelInformation() {
    try {
      console.log('Starting AI Director collectModelInformation...');
      const providers = ['anthropic', 'groq', 'gemini', 'together'];
      const modelInfo = {};

      for (const provider of providers) {
        console.log(`Processing provider: ${provider}`);

        // Check if provider has API key and is enabled
        const hasApiKey = !!aiService.providers[provider]?.apiKey;
        const isEnabled = aiService.providers[provider]?.enabled || false;

        console.log(`${provider} - hasApiKey: ${hasApiKey}, isEnabled: ${isEnabled}`);

        // Only refresh from API if we have no models in database or if it's been more than 24 hours
        const existingModels = await aiService.getModels(provider);
        const shouldRefresh = existingModels.length === 0 || await this.shouldRefreshProvider(provider);

        if (hasApiKey && isEnabled && shouldRefresh) {
          try {
            console.log(`Refreshing models for ${provider} from API...`);
            await aiService.refreshModels(provider);
          } catch (error) {
            console.log(`Failed to refresh ${provider} models:`, error.message);
          }
        } else {
          console.log(`Using cached models for ${provider} (${existingModels.length} models found)`);
        }

        // Get models from database (now potentially updated)
        const models = await aiService.getModels(provider);
        console.log(`${provider} - found ${models.length} models`);

        // Get pricing from database
        const pricingData = await AIPricing.find({
          provider,
          isActive: true
        });
        console.log(`${provider} - found ${pricingData.length} pricing records`);

        const pricingMap = {};
        pricingData.forEach(pricing => {
          pricingMap[pricing.modelId] = {
            input: pricing.inputPrice,
            output: pricing.outputPrice
          };
        });

        // Update pricing for any new models that don't have pricing
        await this.updatePricingForNewModels();

        // Update capabilities for all models
        for (const model of models) {
          await aiModelCapabilitiesService.updateModelCapabilities(provider, model.id);
        }

        // Get free tier information
        const freeTierData = await AIFreeTier.find({ provider });
        console.log(`${provider} - found ${freeTierData.length} free tier records`);

        const freeTierMap = {};
        freeTierData.forEach(freeTier => {
          freeTierMap[freeTier.modelId] = {
            isFree: freeTier.isFree,
            limits: freeTier.freeLimits,
            notes: freeTier.notes
          };
        });

        modelInfo[provider] = {
          models: models.map(model => {
            console.log(`Processing model: ${model.id} (${typeof model.id})`);
            const capabilities = model.capabilities || aiModelCapabilitiesService.inferCapabilities(model.id);
            return {
              id: model.id,
              name: model.name,
              pricing: pricingMap[model.id] || { input: 'Unknown', output: 'Unknown' },
              freeTier: freeTierMap[model.id] || { isFree: false, limits: {}, notes: '' },
              capabilities
            };
          }),
          totalModels: models.length,
          hasApiKey,
          isEnabled
        };
      }

      const result = {
        success: true,
        data: {
          providers: modelInfo,
          summary: {
            totalProviders: providers.length,
            totalModels: Object.values(modelInfo).reduce((sum, provider) => sum + provider.totalModels, 0),
            providersWithKeys: Object.values(modelInfo).filter(p => p.hasApiKey).length,
            enabledProviders: Object.values(modelInfo).filter(p => p.isEnabled).length
          }
        }
      };

      console.log('AI Director result structure:', {
        success: result.success,
        dataKeys: Object.keys(result.data),
        providersCount: Object.keys(result.data.providers).length,
        summary: result.data.summary
      });

      return result;
    } catch (error) {
      console.error('Failed to collect model information:', error);
      return {
        success: false,
        error: {
          message: 'Failed to collect model information',
          details: error.message
        }
      };
    }
  }

  async seedInitialPricing() {
    try {
      const initialPricing = [
        // Anthropic models
        { provider: 'anthropic', modelId: 'claude-opus-4-1-20250805', inputPrice: 15, outputPrice: 75 },
        { provider: 'anthropic', modelId: 'claude-opus-4-20250514', inputPrice: 15, outputPrice: 75 },
        { provider: 'anthropic', modelId: 'claude-sonnet-4-20250514', inputPrice: 3, outputPrice: 15 },
        { provider: 'anthropic', modelId: 'claude-3-7-sonnet-20250219', inputPrice: 3, outputPrice: 15 },
        { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', inputPrice: 3, outputPrice: 15 },
        { provider: 'anthropic', modelId: 'claude-3-5-haiku-20241022', inputPrice: 0.8, outputPrice: 4 },
        { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', inputPrice: 0.25, outputPrice: 1.25 },

        // Groq models
        { provider: 'groq', modelId: 'llama-3.1-8b-instant', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'llama-3.1-70b-versatile', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'llama-3.1-405b-reasoning', inputPrice: 0.002, outputPrice: 0.002 },
        { provider: 'groq', modelId: 'mixtral-8x7b-instant', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'gemma-2-9b-it', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'llama-3.3-70b-versatile', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'llama3-8b-8192', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'llama3-70b-8192', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'gemma2-9b-it', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'compound-beta', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'compound-beta-mini', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'meta-llama/llama-4-scout-17b-16e-instruct', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'meta-llama/llama-4-maverick-17b-128e-instruct', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'meta-llama/llama-guard-4-12b', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'meta-llama/llama-prompt-guard-2-22m', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'meta-llama/llama-prompt-guard-2-86m', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'qwen/qwen3-32b', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'moonshotai/kimi-k2-instruct', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'openai/gpt-oss-20b', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'openai/gpt-oss-120b', inputPrice: 0.002, outputPrice: 0.002 },
        { provider: 'groq', modelId: 'allam-2-7b', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'deepseek-r1-distill-llama-70b', inputPrice: 0.0007, outputPrice: 0.0007 },
        { provider: 'groq', modelId: 'whisper-large-v3', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'whisper-large-v3-turbo', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'distil-whisper-large-v3-en', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'playai-tts', inputPrice: 0.00027, outputPrice: 0.00027 },
        { provider: 'groq', modelId: 'playai-tts-arabic', inputPrice: 0.00027, outputPrice: 0.00027 },

        // Gemini models
        { provider: 'gemini', modelId: 'gemini-1.5-flash', inputPrice: 0.00035, outputPrice: 1.05 },
        { provider: 'gemini', modelId: 'gemini-1.5-pro', inputPrice: 3.5, outputPrice: 10.5 },
        { provider: 'gemini', modelId: 'gemini-pro', inputPrice: 0.5, outputPrice: 1.5 },

        // Together.ai models
        { provider: 'together', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', inputPrice: 0.0002, outputPrice: 0.0002 },
        { provider: 'together', modelId: 'meta-llama/Llama-3.1-8B-Instruct', inputPrice: 0.0002, outputPrice: 0.0002 },
        { provider: 'together', modelId: 'togethercomputer/llama-3.1-8b-instruct', inputPrice: 0.0002, outputPrice: 0.0002 }
      ];

      for (const pricing of initialPricing) {
        await AIPricing.findOneAndUpdate(
          { provider: pricing.provider, modelId: pricing.modelId },
          {
            inputPrice: pricing.inputPrice,
            outputPrice: pricing.outputPrice,
            lastUpdated: new Date(),
            isActive: true
          },
          { upsert: true, new: true }
        );
      }

      console.log('Initial AI pricing seeded successfully');
    } catch (error) {
      console.error('Failed to seed initial pricing:', error);
    }
  }

    async updatePricingForNewModels() {
    try {
      // Get all models from database
      const allModels = await AIModel.find({ isActive: true });

      for (const model of allModels) {
        // Check if pricing exists for this model
        const existingPricing = await AIPricing.findOne({
          provider: model.provider,
          modelId: model.modelId
        });

        if (!existingPricing) {
          // Try to find pricing in our hardcoded data
          const hardcodedPricing = this.providerPricing[model.provider]?.[model.modelId];

          if (hardcodedPricing) {
            await AIPricing.create({
              provider: model.provider,
              modelId: model.modelId,
              inputPrice: hardcodedPricing.input,
              outputPrice: hardcodedPricing.output,
              isActive: true
            });
            console.log(`Added pricing for ${model.provider}/${model.modelId}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update pricing for new models:', error);
    }
  }

  async shouldRefreshProvider(provider) {
    try {
      // Check if we have any models for this provider
      const models = await aiService.getModels(provider);
      if (models.length === 0) {
        return true; // No models, definitely need to refresh
      }

      // Check the last refresh time (we'll use the oldest model's timestamp as a proxy)
      const oldestModel = await AIModel.findOne({ provider }).sort({ createdAt: 1 });
      if (!oldestModel) {
        return true; // No models found, need to refresh
      }

      // Refresh if it's been more than 24 hours
      const hoursSinceLastRefresh = (Date.now() - oldestModel.createdAt.getTime()) / (1000 * 60 * 60);
      const shouldRefresh = hoursSinceLastRefresh > 24;

      console.log(`${provider} last refresh: ${hoursSinceLastRefresh.toFixed(1)} hours ago, should refresh: ${shouldRefresh}`);
      return shouldRefresh;
    } catch (error) {
      console.error(`Error checking refresh status for ${provider}:`, error);
      return true; // Default to refreshing if there's an error
    }
  }

  async seedFreeTierInformation() {
    try {
      console.log('Seeding free tier information...');
      const freeTierData = [
        // Groq Free Tier - ALL models are free with same limits
        // Based on https://console.groq.com/docs/rate-limits
        {
          provider: 'groq',
          modelId: 'allam-2-7b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'compound-beta',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'compound-beta-mini',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'deepseek-r1-distill-llama-70b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'distil-whisper-large-v3-en',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000,
            audioSecondsPerHour: 7200,
            audioSecondsPerDay: 28800
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'gemma2-9b-it',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'llama-3.1-8b-instant',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'llama-3.3-70b-versatile',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'llama3-70b-8192',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'llama3-8b-8192',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'meta-llama/llama-guard-4-12b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'meta-llama/llama-prompt-guard-2-22m',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'meta-llama/llama-prompt-guard-2-86m',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'moonshotai/kimi-k2-instruct',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'openai/gpt-oss-120b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'openai/gpt-oss-20b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'playai-tts',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000,
            audioSecondsPerHour: 7200,
            audioSecondsPerDay: 28800
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'playai-tts-arabic',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000,
            audioSecondsPerHour: 7200,
            audioSecondsPerDay: 28800
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'qwen/qwen3-32b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'whisper-large-v3',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000,
            audioSecondsPerHour: 7200,
            audioSecondsPerDay: 28800
          },
          notes: 'Free tier - all Groq models available'
        },
        {
          provider: 'groq',
          modelId: 'whisper-large-v3-turbo',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 50,
            requestsPerDay: 14400,
            tokensPerMinute: 18000,
            tokensPerDay: 5184000,
            audioSecondsPerHour: 7200,
            audioSecondsPerDay: 28800
          },
          notes: 'Free tier - all Groq models available'
        },

        // Gemini Free Tier
        {
          provider: 'gemini',
          modelId: 'gemini-1.5-flash',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 1500,
            tokensPerMinute: 60000,
            tokensPerDay: 1500000
          },
          notes: 'Free tier with good limits'
        },

        // Anthropic - No free tier available
        // Note: Anthropic doesn't offer free tiers, so we don't include them in free tier tracking

        // Together.ai Free Tier Models (all 5 free models)
        // Based on Together.ai account page showing "up to 60 requests per minute in LLMS in the Free"
        {
          provider: 'together',
          modelId: 'meta-llama/Llama-Vision-Free',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 86400, // 60 RPM * 24 hours * 60 minutes
            tokensPerMinute: 60000, // Assuming 1K tokens per request
            tokensPerDay: 86400000 // 60 RPM * 24 hours * 60 minutes * 1K tokens
          },
          notes: 'Free tier - 60 RPM'
        },
        {
          provider: 'together',
          modelId: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 86400,
            tokensPerMinute: 60000,
            tokensPerDay: 86400000
          },
          notes: 'Free tier - 60 RPM'
        },
        {
          provider: 'together',
          modelId: 'lgai/exaone-deep-32b',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 86400,
            tokensPerMinute: 60000,
            tokensPerDay: 86400000
          },
          notes: 'Free tier - 60 RPM'
        },
        {
          provider: 'together',
          modelId: 'lgai/exaone-3-5-32b-instruct',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 86400,
            tokensPerMinute: 60000,
            tokensPerDay: 86400000
          },
          notes: 'Free tier - 60 RPM'
        },
        {
          provider: 'together',
          modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          isFree: true,
          freeLimits: {
            requestsPerMinute: 60,
            requestsPerDay: 86400,
            tokensPerMinute: 60000,
            tokensPerDay: 86400000
          },
          notes: 'Free tier - 60 RPM'
        }
      ];

      for (const freeTier of freeTierData) {
        await AIFreeTier.findOneAndUpdate(
          { provider: freeTier.provider, modelId: freeTier.modelId },
          {
            isFree: freeTier.isFree,
            freeLimits: freeTier.freeLimits,
            notes: freeTier.notes
          },
          { upsert: true, new: true }
        );
      }

      console.log('Free tier information seeded successfully');
      console.log(`Seeded ${freeTierData.length} free tier records`);
    } catch (error) {
      console.error('Failed to seed free tier information:', error);
    }
  }

  async getCostAnalysis(prompt, expectedResponseLength = 1000) {
    try {
      const modelInfo = await this.collectModelInformation();
      if (!modelInfo.success) {
        return modelInfo;
      }

      const analysis = {};
      const providers = modelInfo.data.providers;

      for (const [providerName, provider] of Object.entries(providers)) {
        if (!provider.hasApiKey || !provider.isEnabled) continue;

        analysis[providerName] = {
          models: provider.models.map(model => {
            const inputTokens = Math.ceil(prompt.length / 4); // Rough estimate
            const outputTokens = expectedResponseLength;

            const inputCost = (inputTokens / 1000) * (model.pricing.input || 0);
            const outputCost = (outputTokens / 1000) * (model.pricing.output || 0);
            const totalCost = inputCost + outputCost;

            return {
              id: model.id,
              name: model.name,
              estimatedCost: totalCost,
              inputTokens,
              outputTokens,
              pricing: model.pricing
            };
          }).sort((a, b) => a.estimatedCost - b.estimatedCost) // Sort by cost
        };
      }

      return {
        success: true,
        data: {
          analysis,
          promptLength: prompt.length,
          expectedResponseLength
        }
      };
    } catch (error) {
      console.error('Failed to analyze costs:', error);
      return {
        success: false,
        error: {
          message: 'Failed to analyze costs',
          details: error.message
        }
      };
    }
  }

  async recommendProvider(task, budget = null, priority = 'cost', requirements = {}) {
    try {
      const modelInfo = await this.collectModelInformation();
      if (!modelInfo.success) {
        return modelInfo;
      }

      const recommendations = [];
      const providers = modelInfo.data.providers;

      // Parse task requirements
      const taskRequirements = this.parseTaskRequirements(task, requirements);

      for (const [providerName, provider] of Object.entries(providers)) {
        if (!provider.hasApiKey || !provider.isEnabled) continue;

        // Filter models based on requirements
        const suitableModels = provider.models.filter(model => {
          if (!model.capabilities) return true; // Include if no capabilities data

          // Check vision requirement
          if (taskRequirements.needsVision && !model.capabilities.supportsVision) {
            return false;
          }

          // Check audio requirement
          if (taskRequirements.needsAudio && !model.capabilities.supportsAudio) {
            return false;
          }

          // Check function calling requirement
          if (taskRequirements.needsFunctionCalling && !model.capabilities.supportsFunctionCalling) {
            return false;
          }

          // Check reasoning requirement
          if (taskRequirements.needsReasoning && model.capabilities.performance?.reasoning === 'basic') {
            return false;
          }

          // Check code generation requirement
          if (taskRequirements.needsCodeGeneration && !model.capabilities.tasks?.codeGeneration) {
            return false;
          }

          return true;
        });

        if (suitableModels.length === 0) continue;

        // Get the best model for this provider based on priority and requirements
        const bestModel = suitableModels.reduce((best, current) => {
          if (priority === 'cost') {
            const costA = (current.pricing.input || 0) + (current.pricing.output || 0);
            const costB = (best.pricing.input || 0) + (best.pricing.output || 0);
            return costA < costB ? current : best;
          } else if (priority === 'speed') {
            const speedOrder = { 'ultra-fast': 0, 'fast': 1, 'medium': 2, 'slow': 3 };
            const speedA = speedOrder[current.capabilities?.performance?.speed || 'medium'];
            const speedB = speedOrder[best.capabilities?.performance?.speed || 'medium'];
            return speedA < speedB ? current : best;
          } else if (priority === 'quality') {
            const qualityOrder = { 'state-of-the-art': 0, 'excellent': 1, 'good': 2, 'basic': 3 };
            const qualityA = qualityOrder[current.capabilities?.performance?.quality || 'good'];
            const qualityB = qualityOrder[best.capabilities?.performance?.quality || 'good'];
            return qualityA < qualityB ? current : best;
          }
          return best;
        });

        const reasoning = this.generateReasoning(bestModel, taskRequirements, priority);

        recommendations.push({
          provider: providerName,
          model: bestModel,
          reasoning,
          capabilities: bestModel.capabilities
        });
      }

      // Sort by priority
      recommendations.sort((a, b) => {
        if (priority === 'cost') {
          const costA = (a.model.pricing.input || 0) + (a.model.pricing.output || 0);
          const costB = (b.model.pricing.input || 0) + (b.model.pricing.output || 0);
          return costA - costB;
        } else if (priority === 'speed') {
          const speedOrder = { 'ultra-fast': 0, 'fast': 1, 'medium': 2, 'slow': 3 };
          const speedA = speedOrder[a.model.capabilities?.performance?.speed || 'medium'];
          const speedB = speedOrder[b.model.capabilities?.performance?.speed || 'medium'];
          return speedA - speedB;
        } else if (priority === 'quality') {
          const qualityOrder = { 'state-of-the-art': 0, 'excellent': 1, 'good': 2, 'basic': 3 };
          const qualityA = qualityOrder[a.model.capabilities?.performance?.quality || 'good'];
          const qualityB = qualityOrder[b.model.capabilities?.performance?.quality || 'good'];
          return qualityA - qualityB;
        }
        return 0;
      });

      return {
        success: true,
        data: {
          recommendations,
          task,
          budget,
          priority,
          requirements: taskRequirements
        }
      };
    } catch (error) {
      console.error('Failed to recommend provider:', error);
      return {
        success: false,
        error: {
          message: 'Failed to recommend provider',
          details: error.message
        }
      };
    }
  }

  parseTaskRequirements(task, requirements = {}) {
    const taskLower = task.toLowerCase();

    return {
      needsVision: requirements.needsVision || taskLower.includes('image') || taskLower.includes('vision') || taskLower.includes('photo'),
      needsAudio: requirements.needsAudio || taskLower.includes('audio') || taskLower.includes('speech') || taskLower.includes('whisper'),
      needsFunctionCalling: requirements.needsFunctionCalling || taskLower.includes('function') || taskLower.includes('tool'),
      needsReasoning: requirements.needsReasoning || taskLower.includes('reason') || taskLower.includes('logic') || taskLower.includes('solve'),
      needsCodeGeneration: requirements.needsCodeGeneration || taskLower.includes('code') || taskLower.includes('program') || taskLower.includes('script'),
      needsJSONOutput: requirements.needsJSONOutput || taskLower.includes('json') || taskLower.includes('structured'),
      maxTokens: requirements.maxTokens || 4096
    };
  }

  generateReasoning(model, requirements, priority) {
    const reasons = [];

    if (model.freeTier?.isFree) {
      reasons.push('Free tier available');
    }

    if (requirements.needsVision && model.capabilities?.supportsVision) {
      reasons.push('Supports vision tasks');
    }

    if (requirements.needsReasoning && model.capabilities?.performance?.reasoning !== 'basic') {
      reasons.push('Good reasoning capabilities');
    }

    if (priority === 'speed' && model.capabilities?.performance?.speed === 'ultra-fast') {
      reasons.push('Ultra-fast inference');
    }

    if (priority === 'quality' && model.capabilities?.performance?.quality === 'state-of-the-art') {
      reasons.push('State-of-the-art quality');
    }

    if (priority === 'cost' && model.freeTier?.isFree) {
      reasons.push('Cost-effective (free tier)');
    }

    return reasons.join(', ') || `Best ${priority} option`;
  }
}

export default new AIDirectorService();
