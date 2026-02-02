# Voice Search Setup with OpenAI Whisper

This guide explains how to set up voice search in the app using OpenAI's Whisper API.

## Prerequisites

- OpenAI API account
- OpenAI API key (get it from https://platform.openai.com/api-keys)

## Installation & Configuration

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (you won't be able to see it again)

### 2. Set Up Environment Variable

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```
EXPO_PUBLIC_OPENAI_API_KEY=sk_test_...your_api_key_here...
```

**Important**: 
- The `EXPO_PUBLIC_` prefix makes it available to the app
- Never commit `.env` to version control
- Add `.env` to `.gitignore` if not already there

### 3. For EAS Build

When building with EAS, add the API key as a secret:

```bash
eas secret create
```

Follow the prompts to add `EXPO_PUBLIC_OPENAI_API_KEY` as a secret.

Then reference it in `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_OPENAI_API_KEY": "@env EXPO_PUBLIC_OPENAI_API_KEY"
      }
    }
  }
}
```

## How It Works

### Web Platform
- Uses native Web Speech API (browser support required)
- No API calls needed for web

### Native (iOS/Android)
- Records audio using `expo-av`
- Sends recording to OpenAI Whisper API
- Displays transcribed text in search

## Voice Search Flow

1. User taps the microphone button
2. App records audio (shows "recording" state with filled mic icon)
3. User taps mic again to stop recording
4. App sends audio to Whisper API
5. Transcribed text is added to search query automatically

## Costs

- Whisper API charges $0.02 per minute of audio (rounded to nearest 0.01 min)
- Monitor usage on https://platform.openai.com/account/usage/overview

## Troubleshooting

### Voice search button is disabled
- Check that `EXPO_PUBLIC_OPENAI_API_KEY` is set correctly
- Verify the API key has access to the Whisper API
- Check console logs for configuration warnings

### Recording fails
- Ensure microphone permissions are granted
- For Android: Make sure "Record Audio" permission is enabled
- For iOS: Check app permissions in Settings

### Transcription errors
- Check your OpenAI API key is valid
- Verify audio quality (background noise can affect accuracy)
- Ensure API key has sufficient quota

### "Could not fetch" errors
- Check internet connection
- Verify API endpoint is accessible
- Check OpenAI service status: https://status.openai.com
