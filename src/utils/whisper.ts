/**
 * OpenAI Whisper API integration
 * Handles audio transcription using Whisper API
 */

import { Platform } from 'react-native';
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
        throw new Error('OpenAI API key is not configured. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment.');
    }

    try {
        console.log('Starting transcription for URI:', audioUri);
        
        // Get the audio blob based on platform
        let blob: Blob;
        
        if (Platform.OS === 'web') {
            // Web: fetch from URI directly
            const response = await fetch(audioUri);
            blob = await response.blob();
        } else {
            // Native: read file and convert to blob
            const response = await fetch(`file://${audioUri.startsWith('file://') ? audioUri.slice(7) : audioUri}`);
            blob = await response.blob();
        }

        console.log('Audio blob size:', blob.size, 'bytes');

        // Create FormData with audio file
        const formData = new FormData();
        formData.append('file', blob, 'audio.m4a');
        formData.append('model', 'whisper-1');
        formData.append('language', language);

        console.log('Sending request to Whisper API...');

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

        console.log('Whisper API response status:', whisperResponse.status);

        if (!whisperResponse.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error = await whisperResponse.json();
                errorMessage = error.error?.message || error.message || 'Unknown error';
            } catch {
                errorMessage = `HTTP ${whisperResponse.status}: ${whisperResponse.statusText}`;
            }
            throw new Error(`Whisper API error: ${errorMessage}`);
        }

        const data: WhisperResponse = await whisperResponse.json();
        console.log('Transcription result:', data.text);
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
