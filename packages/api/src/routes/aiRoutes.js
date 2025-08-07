import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

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
    const config = {
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY ? '***' : '',
        enabled: !!process.env.ANTHROPIC_API_KEY
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY ? '***' : '',
        enabled: !!process.env.GROQ_API_KEY
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY ? '***' : '',
        enabled: !!process.env.GEMINI_API_KEY
      }
    };

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
    const { anthropic, groq, gemini } = req.body;

    // Update environment variables (in production, this would be stored in database)
    if (anthropic?.apiKey && anthropic.apiKey !== '***') {
      process.env.ANTHROPIC_API_KEY = anthropic.apiKey;
    }
    if (groq?.apiKey && groq.apiKey !== '***') {
      process.env.GROQ_API_KEY = groq.apiKey;
    }
    if (gemini?.apiKey && gemini.apiKey !== '***') {
      process.env.GEMINI_API_KEY = gemini.apiKey;
    }

    // Reload AI service configuration
    aiService.logApiKeyStatus();

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

    // Test the provider with a simple prompt
    const testPrompt = 'Hello, this is a test message. Please respond with "OK" if you receive this.';
    const result = await aiService.callProvider(provider, testPrompt, { maxTokens: 10 });

    if (result && result.toLowerCase().includes('ok')) {
      res.json({
        success: true,
        data: {
          message: `${provider} API key is valid`
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
