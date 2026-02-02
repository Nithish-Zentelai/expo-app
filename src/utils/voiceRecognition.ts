/**
 * Voice Recognition Utility
 * Uses react-native-voice for native speech-to-text (cross-platform)
 * Uses Web Speech API for web platform
 */

import { Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

// Web Speech API setup for web platform
const initWebSpeechRecognition = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    const SpeechRecognitionImpl = (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionImpl) {
        console.warn('Web Speech API not supported');
        return null;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    return recognition;
};

export class VoiceRecognizer {
    private isListening = false;
    private webRecognition: any = null;
    private resultCallback: ((transcript: string) => void) | null = null;

    constructor() {
        if (Platform.OS === 'web') {
            this.webRecognition = initWebSpeechRecognition();
        } else {
            // Setup Voice module for native platforms
            Voice.onSpeechStart = this.onSpeechStart;
            Voice.onSpeechRecognized = this.onSpeechRecognized;
            Voice.onSpeechEnd = this.onSpeechEnd;
            Voice.onSpeechError = this.onSpeechError;
            Voice.onSpeechResults = this.onSpeechResults;
            Voice.onSpeechPartialResults = this.onSpeechPartialResults;
        }
    }

    onSpeechStart = () => {
        console.log('[Voice] Speech started');
        this.isListening = true;
    };

    onSpeechRecognized = () => {
        console.log('[Voice] Speech recognized');
    };

    onSpeechEnd = () => {
        console.log('[Voice] Speech ended');
        this.isListening = false;
    };

    onSpeechError = (e: any) => {
        console.error('[Voice] Speech error:', e);
        this.isListening = false;
    };

    onSpeechResults = (e: any) => {
        console.log('[Voice] Results:', e.value);
        if (this.resultCallback && e.value && e.value.length > 0) {
            const transcript = e.value[0];
            if (transcript.trim()) {
                this.resultCallback(transcript);
            }
        }
    };

    onSpeechPartialResults = (e: any) => {
        console.log('[Voice] Partial results:', e.value);
    };

    async start(onResult: (transcript: string) => void): Promise<void> {
        try {
            // Store the callback for use in onSpeechResults
            this.resultCallback = onResult;

            if (Platform.OS === 'web') {
                // Web Speech API
                if (!this.webRecognition) {
                    throw new Error('Web Speech API not available');
                }

                this.webRecognition.onresult = (event: any) => {
                    const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
                    if (transcript.trim()) {
                        onResult(transcript);
                    }
                };

                this.webRecognition.onend = () => {
                    this.isListening = false;
                };

                this.webRecognition.onerror = () => {
                    this.isListening = false;
                };

                this.webRecognition.start();
                this.isListening = true;
            } else {
                // Native Voice module - start listening
                await Voice.start('en-US');
                this.isListening = true;
            }
        } catch (error) {
            console.error('[Voice] Start error:', error);
            this.isListening = false;
            this.resultCallback = null;
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                if (this.webRecognition) {
                    this.webRecognition.stop();
                }
            } else {
                await Voice.stop();
            }
            this.isListening = false;
            this.resultCallback = null;
        } catch (error) {
            console.error('[Voice] Stop error:', error);
            this.isListening = false;
            this.resultCallback = null;
            throw error;
        }
    }

    async cancel(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                if (this.webRecognition) {
                    this.webRecognition.abort();
                }
            } else {
                await Voice.cancel();
            }
            this.isListening = false;
            this.resultCallback = null;
        } catch (error) {
            console.error('[Voice] Cancel error:', error);
            this.isListening = false;
            this.resultCallback = null;
        }
    }

    destroy(): void {
        try {
            if (Platform.OS === 'web') {
                if (this.webRecognition) {
                    this.webRecognition.abort();
                }
            } else {
                Voice.destroy();
            }
            this.resultCallback = null;
        } catch (error) {
            console.error('[Voice] Destroy error:', error);
        }
    }

    getIsListening(): boolean {
        return this.isListening;
    }

    isSupported(): boolean {
        if (Platform.OS === 'web') {
            return this.webRecognition !== null;
        }
        return true; // Native platforms support Voice module
    }
}
