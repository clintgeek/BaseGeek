#!/usr/bin/env node

/**
 * Test script for API Key authentication with aiGeek system
 *
 * Usage:
 * 1. First, create an API key through the BaseGeek UI at /api-keys
 * 2. Run this script with your API key:
 *    node test-api-key.js YOUR_API_KEY_HERE
 *
 * This script demonstrates:
 * - API key authentication
 * - Making AI calls with API key
 * - Checking providers and models
 * - Viewing usage statistics
 */

import axios from 'axios';

const BASE_URL = process.env.BASEGEEK_API_URL || 'http://localhost:3000';
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('❌ Please provide an API key as an argument');
  console.error('Usage: node test-api-key.js YOUR_API_KEY_HERE');
  process.exit(1);
}

// Create axios instance with API key authentication
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Test functions
async function testAPIKeyAuth() {
  console.log('🔑 Testing API Key Authentication...');
  console.log(`Using API key: ${API_KEY.substring(0, 15)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');
}

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  console.log('');
}

async function testGetProviders() {
  try {
    console.log('🔍 Testing get providers...');
    const response = await api.get('/ai/providers');
    console.log('✅ Providers retrieved successfully:');
    console.log('Current provider:', response.data.data.currentProvider);
    console.log('Available providers:', response.data.data.providers.map(p => p.name).join(', '));
  } catch (error) {
    console.error('❌ Get providers failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testGetModels() {
  try {
    console.log('🤖 Testing get models for OpenAI...');
    const response = await api.get('/ai/models/openai');
    console.log('✅ Models retrieved successfully:');
    console.log(`Found ${response.data.data.models.length} models for OpenAI`);
    if (response.data.data.models.length > 0) {
      console.log('Sample models:', response.data.data.models.slice(0, 3).map(m => m.name).join(', '));
    }
  } catch (error) {
    console.error('❌ Get models failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testAICall() {
  try {
    console.log('🧠 Testing AI call...');
    const response = await api.post('/ai/call', {
      prompt: 'Say hello and confirm that API key authentication is working. Keep it brief.',
      config: {
        maxTokens: 50
      }
    });
    console.log('✅ AI call successful:');
    console.log('Provider:', response.data.data.provider);
    console.log('Response:', response.data.data.response);
  } catch (error) {
    console.error('❌ AI call failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testGetStats() {
  try {
    console.log('📊 Testing get stats...');
    const response = await api.get('/ai/stats');
    console.log('✅ Stats retrieved successfully:');
    console.log('Session stats:', JSON.stringify(response.data.data, null, 2));
  } catch (error) {
    console.error('❌ Get stats failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testDirectorModels() {
  try {
    console.log('🎯 Testing AI Director models...');
    const response = await api.get('/ai/director/models');
    console.log('✅ Director models retrieved successfully:');
    const data = response.data.data;
    console.log(`Found ${Object.keys(data.providers || {}).length} providers with model data`);
    if (data.summary) {
      console.log('Summary:', data.summary);
    }
  } catch (error) {
    console.error('❌ Director models failed:', error.response?.data || error.message);
  }
  console.log('');
}

async function testRateLimiting() {
  console.log('⚡ Testing rate limiting (making 3 quick requests)...');
  for (let i = 1; i <= 3; i++) {
    try {
      const start = Date.now();
      const response = await api.get('/ai/providers');
      const duration = Date.now() - start;
      console.log(`✅ Request ${i} successful (${duration}ms)`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`⚠️  Request ${i} rate limited:`, error.response.data.error.message);
      } else {
        console.error(`❌ Request ${i} failed:`, error.response?.data || error.message);
      }
    }
  }
  console.log('');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Key Authentication Tests');
  console.log('==========================================');
  console.log('');

  await testAPIKeyAuth();
  await testHealthCheck();
  await testGetProviders();
  await testGetModels();
  await testAICall();
  await testGetStats();
  await testDirectorModels();
  await testRateLimiting();

  console.log('🏁 Tests completed!');
  console.log('');
  console.log('💡 Tips:');
  console.log('- Create API keys through the BaseGeek UI at /api-keys');
  console.log('- API keys can be used in Authorization header: Bearer YOUR_KEY');
  console.log('- Or in x-api-key header: YOUR_KEY');
  console.log('- Check rate limits and permissions in the UI');
  console.log('- Monitor usage statistics in the API Keys dashboard');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(console.error);