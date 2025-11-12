# QuoSonaV2 - Chrome Extension

A Chrome extension that helps Quo users build Jobs for SONA by extracting conversation transcripts and creating agent job definitions.

## Overview

This extension allows Quo users to:
- **Extract conversation transcripts** from Quo/OpenPhone conversations
- **Download activity data** as JSON files for analysis
- **Create SONA Jobs** directly from the extension with conversation context
- **Automatically manage authentication** tokens without manual updates

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `openphone-downloader` folder
5. The extension icon will appear in your toolbar

## Usage

### Getting Conversation Transcripts

1. Click the extension icon in your Chrome toolbar
2. A popup will open with:
   - **Conversation ID** field - Enter the conversation ID you want to fetch
   - **Last (count)** field - Number of activities to retrieve
   - **Authorization Token** field - Your API authorization token (auto-captured)
   - **Download JSON** button - Downloads the conversation data as a JSON file
   - **Fetch & Show** button - Fetches and displays the data in a new tab

### Creating SONA Jobs

1. Click the **"Create Job"** button in the extension popup
2. The extension will automatically:
   - Use your current authorization token
   - Create a job definition with the configured template
   - Show success/error feedback with the job ID

## Automatic Token Capture

The extension **automatically captures and saves tokens** in multiple ways:

1. **Network Request Interception**: When you or the Quo website makes API requests, the extension automatically captures the authorization token from the request headers
2. **Cookie Detection**: Checks cookies from Quo/OpenPhone domains for JWT tokens
3. **Storage Detection**: Scans localStorage/sessionStorage from open Quo tabs for tokens
4. **Response Headers**: Captures tokens from API response headers

**You don't need to manually update tokens anymore!** Just:
- Keep `https://my.quo.com/` open in a tab
- Click the extension buttons
- The token will be automatically captured and updated

### Manual Token Update (if needed)

If automatic capture doesn't work:

1. Go to `https://my.quo.com/` (or your Quo dashboard)
2. Open Chrome DevTools (F12 or Right-click → Inspect)
3. Go to the **Network** tab
4. Make a request that calls the activity API (or refresh the page)
5. Find the request to `communication.openphoneapi.com/v2/activity`
6. Click on it to view details
7. In the **Headers** section, find the `authorization` header
8. Copy the entire token value (it's a long JWT string)
9. Paste it into the **Authorization Token** field in the extension popup
10. The token will be saved automatically for future use

## Features

- ✅ **Extract Conversation Transcripts** - Download activity data as JSON for analysis
- ✅ **Create SONA Jobs** - Build job definitions directly from the extension
- ✅ **Automatic Token Management** - Tokens are captured and refreshed automatically
- ✅ **Customizable Parameters** - Adjust conversation ID and activity count
- ✅ **Persistent Settings** - All values are saved automatically
- ✅ **Dynamic Headers** - Request IDs and device IDs are generated dynamically
- ✅ **Error Handling** - Clear feedback for success and failure cases

## Workflow: Building SONA Jobs from Transcripts

1. **Get Transcripts**: Use "Download JSON" or "Fetch & Show" to get conversation transcripts
2. **Analyze Data**: Review the conversation activities to understand patterns
3. **Create Job**: Click "Create Job" to create a SONA job definition based on the conversation context
4. **Customize**: (Coming soon) Edit job parameters before creating

## Technical Details

### API Endpoints Used

- `https://communication.openphoneapi.com/v2/activity` - Get conversation activities/transcripts
- `https://ai.openphoneapi.com/v1/agent-job-definitions` - Create SONA job definitions

### Permissions

The extension requires:
- `downloads` - To download JSON files
- `storage` - To save user preferences and tokens
- `tabs` - To access open Quo tabs for token capture
- `cookies` - To read authentication cookies
- `scripting` - To read localStorage/sessionStorage from tabs
- `webRequest` - To intercept network requests and capture tokens
- `notifications` - To show error notifications

## Notes

- **Automatic Token Refresh**: Tokens are automatically captured from network requests, cookies, and storage. You rarely need to manually update them!
- Authorization tokens expire after some time (usually 1 hour). The extension will try to refresh them automatically when you click buttons.
- All values (conversation ID, count, token) are saved automatically in Chrome's local storage.
- The extension intercepts requests to `*.openphoneapi.com` to capture fresh tokens automatically.

## Development

### Project Structure

```
openphone-downloader/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI
├── popup.js            # Popup logic and API calls
├── background.js       # Background service worker for token capture
└── README.md           # This file
```

### Future Enhancements

- [ ] Customizable job body parameters
- [ ] Job templates based on conversation analysis
- [ ] Bulk job creation from multiple conversations
- [ ] Export/import job configurations
