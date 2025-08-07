import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import aiDirectorService from '../services/aiDirectorService.js';
import aiUsageService from '../services/aiUsageService.js';
import AIConfig from '../models/AIConfig.js';
import AIModel from '../models/AIModel.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/ai/stats - Get AI service statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = aiService.getSessionStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get AI statistics',
        code: 'AI_STATS_ERROR'
      }
    });
  }
});

// POST /api/ai/call - Generic AI call endpoint
router.post('/call', async (req, res) => {
  try {
    const { prompt, config = {} } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prompt is required',
          code: 'MISSING_PROMPT'
        }
      });
    }

    const result = await aiService.callAI(prompt, config);

    res.json({
      success: true,
      data: {
        response: result,
        provider: aiService.currentProvider
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'AI call failed',
        code: 'AI_CALL_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/parse-json - AI call with JSON parsing
router.post('/parse-json', async (req, res) => {
  try {
    const { prompt, config = {} } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prompt is required',
          code: 'MISSING_PROMPT'
        }
      });
    }

    const response = await aiService.callAI(prompt, config);
    const parsedResult = aiService.parseJSONResponse(response);

    res.json({
      success: true,
      data: {
        response: parsedResult,
        rawResponse: response,
        provider: aiService.currentProvider
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'AI JSON parsing failed',
        code: 'AI_JSON_ERROR',
        details: error.message
      }
    });
  }
});

// GET /api/ai/providers - Get available AI providers
router.get('/providers', async (req, res) => {
  try {
    const availableProviders = aiService.getAvailableProviders();
    const providerInfo = availableProviders.map(provider => ({
      name: provider,
      displayName: aiService.providers[provider].name,
      costPer1kTokens: aiService.providers[provider].costPer1kTokens
    }));

    res.json({
      success: true,
      data: {
        providers: providerInfo,
        currentProvider: aiService.currentProvider
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get provider information',
        code: 'PROVIDER_INFO_ERROR'
      }
    });
  }
});

// POST /api/ai/provider - Set AI provider
router.post('/provider', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Provider is required',
          code: 'MISSING_PROVIDER'
        }
      });
    }

    const success = aiService.setProvider(provider);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid provider',
          code: 'INVALID_PROVIDER'
        }
      });
    }

    res.json({
      success: true,
      data: {
        provider: aiService.currentProvider,
        message: `Provider set to ${aiService.providers[provider].name}`
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to set provider',
        code: 'SET_PROVIDER_ERROR'
      }
    });
  }
});

// GET /api/ai/models/:provider - Get available models for a provider
router.get('/models/:provider', async (req, res) => {
  try {
    const { provider } = req.params;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Provider is required',
          code: 'MISSING_PROVIDER'
        }
      });
    }

    // Get models from database
    const models = await aiService.getModels(provider);

    res.json({
      success: true,
      data: {
        provider,
        models
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch models',
        code: 'MODELS_FETCH_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/models/:provider/refresh - Refresh models for a provider
router.post('/models/:provider/refresh', async (req, res) => {
  try {
    const { provider } = req.params;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Provider is required',
          code: 'MISSING_PROVIDER'
        }
      });
    }

    // Check if API key is configured
    const providerConfig = aiService.providers[provider];
    if (!providerConfig || !providerConfig.apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          message: `${provider} API key is not configured`,
          code: 'API_KEY_NOT_CONFIGURED'
        }
      });
    }

    console.log(`Refreshing models for ${provider}...`);

    // Refresh models from provider API
    const models = await aiService.refreshModels(provider);

    console.log(`Successfully refreshed ${models.length} models for ${provider}`);

    res.json({
      success: true,
      data: {
        provider,
        models,
        message: `Models refreshed successfully for ${provider}`
      }
    });

  } catch (error) {
    console.error(`Error refreshing models for ${req.params.provider}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to refresh ${req.params.provider} models: ${error.message}`,
        code: 'MODELS_REFRESH_ERROR',
        details: error.message
      }
    });
  }
});

// GET /api/ai/director/models - Get comprehensive model information
router.get('/director/models', async (req, res) => {
  try {
    console.log('AI Director models endpoint called');
    const result = await aiDirectorService.collectModelInformation();

    console.log('AI Director result success:', result.success);
    console.log('AI Director result data keys:', result.data ? Object.keys(result.data) : 'No data');

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      console.error('AI Director failed:', result.error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to collect model information',
          code: 'DIRECTOR_MODELS_ERROR',
          details: result.error?.details || 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('AI Director models endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to collect model information',
        code: 'DIRECTOR_MODELS_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/director/analyze-cost - Analyze cost for a specific prompt
router.post('/director/analyze-cost', async (req, res) => {
  try {
    const { prompt, expectedResponseLength = 1000 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prompt is required',
          code: 'MISSING_PROMPT'
        }
      });
    }

    const result = await aiDirectorService.getCostAnalysis(prompt, expectedResponseLength);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to analyze cost',
        code: 'DIRECTOR_COST_ANALYSIS_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/director/recommend - Get provider recommendations
router.post('/director/recommend', async (req, res) => {
  try {
    const { task, budget, priority = 'cost', requirements = {} } = req.body;

    if (!task) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Task description is required',
          code: 'MISSING_TASK'
        }
      });
    }

    const result = await aiDirectorService.recommendProvider(task, budget, priority, requirements);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get recommendations',
        code: 'DIRECTOR_RECOMMEND_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/director/seed-pricing - Seed initial pricing data
router.post('/director/seed-pricing', async (req, res) => {
  try {
    await aiDirectorService.seedInitialPricing();

    res.json({
      success: true,
      data: {
        message: 'Initial pricing data seeded successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to seed pricing data',
        code: 'SEED_PRICING_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/director/seed-free-tier - Seed free tier information
router.post('/director/seed-free-tier', async (req, res) => {
  try {
    await aiDirectorService.seedFreeTierInformation();

    res.json({
      success: true,
      data: {
        message: 'Free tier information seeded successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to seed free tier data',
        code: 'SEED_FREE_TIER_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/director/force-refresh - Force refresh all providers
router.post('/director/force-refresh', async (req, res) => {
  try {
    const providers = ['anthropic', 'groq', 'gemini', 'together'];
    const results = {};

    for (const provider of providers) {
      try {
        const hasApiKey = !!aiService.providers[provider]?.apiKey;
        const isEnabled = aiService.providers[provider]?.enabled || false;

        if (hasApiKey && isEnabled) {
          console.log(`Force refreshing ${provider}...`);
          await aiService.refreshModels(provider);
          results[provider] = 'success';
        } else {
          results[provider] = 'skipped (no API key or disabled)';
        }
      } catch (error) {
        console.error(`Failed to force refresh ${provider}:`, error);
        results[provider] = `error: ${error.message}`;
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Force refresh completed',
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to force refresh',
        code: 'FORCE_REFRESH_ERROR',
        details: error.message
      }
    });
  }
});

// GET /api/ai/usage/:provider/:modelId - Get usage status for a specific model
router.get('/usage/:provider/:modelId', async (req, res) => {
  try {
    const { provider, modelId } = req.params;
    const userId = req.user.id;

    const usageStatus = await aiUsageService.getUsageStatus(provider, modelId, userId);

    if (usageStatus.success) {
      res.json({
        success: true,
        data: usageStatus.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get usage status',
          code: 'USAGE_STATUS_ERROR',
          details: usageStatus.error
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get usage status',
        code: 'USAGE_STATUS_ERROR',
        details: error.message
      }
    });
  }
});

// GET /api/ai/usage/:provider - Get usage summary for a provider
router.get('/usage/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.query.userId || req.user.id; // Allow session-level tracking

    const usageSummary = await aiUsageService.getProviderUsageSummary(provider, userId);

    if (usageSummary.success) {
      res.json({
        success: true,
        data: usageSummary.summary
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get usage summary',
          code: 'USAGE_SUMMARY_ERROR',
          details: usageSummary.error
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get usage summary',
        code: 'USAGE_SUMMARY_ERROR',
        details: error.message
      }
    });
  }
});

// POST /api/ai/reset-stats - Reset AI statistics
router.post('/reset-stats', async (req, res) => {
  try {
    aiService.resetSessionStats();

    res.json({
      success: true,
      data: {
        message: 'AI statistics reset successfully'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reset statistics',
        code: 'RESET_STATS_ERROR'
      }
    });
  }
});

// GET /api/ai/config - Get AI configuration
router.get('/config', async (req, res) => {
  try {
    const configs = await AIConfig.find({});
    const config = {
      anthropic: { apiKey: '', enabled: false },
      groq: { apiKey: '', enabled: false },
      gemini: { apiKey: '', enabled: false },
      together: { apiKey: '', enabled: false }
    };

    // Load configurations from database
    for (const dbConfig of configs) {
      if (config[dbConfig.provider]) {
        config[dbConfig.provider].apiKey = dbConfig.apiKey;
        config[dbConfig.provider].enabled = dbConfig.enabled;
      }
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get AI configuration',
        code: 'CONFIG_GET_ERROR'
      }
    });
  }
});

// POST /api/ai/config - Update AI configuration
router.post('/config', async (req, res) => {
  try {
    const { anthropic, groq, gemini, together } = req.body;

    // Update configurations in database
    const configs = [
      { provider: 'anthropic', ...anthropic },
      { provider: 'groq', ...groq },
      { provider: 'gemini', ...gemini },
      { provider: 'together', ...together }
    ];

    for (const config of configs) {
      if (config.apiKey && config.apiKey !== '***') {
        await AIConfig.findOneAndUpdate(
          { provider: config.provider },
          {
            apiKey: config.apiKey,
            enabled: config.enabled || false
          },
          { upsert: true, new: true }
        );
      }
    }

    // Reload AI service configuration
    await aiService.loadConfigurations();

    res.json({
      success: true,
      data: {
        message: 'AI configuration updated successfully'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update AI configuration',
        code: 'CONFIG_UPDATE_ERROR'
      }
    });
  }
});

// POST /api/ai/test - Test AI provider API key
router.post('/test', async (req, res) => {
  try {
    const { provider, appName = 'test' } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Provider is required',
          code: 'MISSING_PROVIDER'
        }
      });
    }

    // Check if API key is configured
    const providerConfig = aiService.providers[provider];
    if (!providerConfig || !providerConfig.apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          message: `${provider} API key is not configured`,
          code: 'API_KEY_NOT_CONFIGURED'
        }
      });
    }

    // Test the provider with a simple prompt
    const testPrompt = 'Hello, this is a test message. Please respond with "OK" if you receive this.';
    const result = await aiService.callProvider(provider, testPrompt, { maxTokens: 10, appName });

    if (result && result.toLowerCase().includes('ok')) {
      res.json({
        success: true,
        data: {
          message: `${provider} API key is valid`,
          appName
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: `${provider} API key test failed`,
          code: 'API_KEY_TEST_FAILED'
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to test API key',
        code: 'API_KEY_TEST_ERROR',
        details: error.message
      }
    });
  }
});



export default router;
