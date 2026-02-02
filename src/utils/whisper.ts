/**
 * OpenAI Whisper API integration
 * Handles audio transcription using Whisper API
 */

import { OPENAI_API_KEY } from './env';

interface WhisperResponse {
    text: string;
}

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param audioUri - URI of the audio file to transcribe
 * @param language - Language code (default: 'en')
 * @returns Transcribed text
 */
export async function transcribeAudio(
    audioUri: string,
    language: string = 'en'
): Promise<string> {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in your environment.');
    }

    try {
        // Convert URI to blob for FormData
        const response = await fetch(audioUri);
        const blob = await response.blob();

        // Create FormData with audio file
        const formData = new FormData();
        formData.append('file', blob, 'audio.m4a');
        formData.append('model', 'whisper-1');
        formData.append('language', language);

        // Send to Whisper API
        const whisperResponse = await fetch(
            'https://api.openai.com/v1/audio/transcriptions',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
            }
        );

        if (!whisperResponse.ok) {
            const error = await whisperResponse.json();
            throw new Error(
                `Whisper API error: ${error.error?.message || 'Unknown error'}`
            );
        }

        const data: WhisperResponse = await whisperResponse.json();
        return data.text.trim();
    } catch (error) {
        console.error('Whisper transcription error:', error);
        throw error;
    }
}

/**
 * Validate API key is configured
 */
export function isWhisperConfigured(): boolean {
    return !!OPENAI_API_KEY;
}
