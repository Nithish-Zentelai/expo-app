/**
 * Environment variables configuration
 */

// OpenAI API Key for Whisper transcription
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

// Validate critical configuration
if (!OPENAI_API_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_OPENAI_API_KEY is not set. Voice search will not work.');
}

