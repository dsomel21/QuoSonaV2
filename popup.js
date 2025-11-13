// Popup script for OpenPhone Activity Downloader

const conversationIdInput = document.getElementById('conversationId');
const lastInput = document.getElementById('last');
const authTokenInput = document.getElementById('authToken');
const btnDownload = document.getElementById('btnDownload');
const btnFetch = document.getElementById('btnFetch');
const btnCreateJob = document.getElementById('btnCreateJob');
const btnSettings = document.getElementById('btnSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const settingsSection = document.getElementById('settingsSection');
const openaiApiKeyInput = document.getElementById('openaiApiKey');
const statusDiv = document.getElementById('status');
const responseDisplay = document.getElementById('responseDisplay');

// Default token (will be replaced by saved value)
const DEFAULT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImhFVk1YenFXbk10c2RfOVJQVTV2QSJ9.eyJpbnRlcm5hbF91c2VyX2lkIjoiVVNTVDVreUZhZCIsImludGVybmFsX29yZ19pZCI6Ik9SWEppc1BCTFkiLCJpbnRlcm5hbF9vcmdfcm9sZSI6Im93bmVyIiwiZW1haWwiOiJkc29tZWwyMUBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NpZ25pbi5vcGVucGhvbmUuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE3NTY5ODc1ODY1OTM2ODM5Mzg4IiwiYXVkIjpbImh0dHBzOi8vKi5vcGVucGhvbmVhcGkuY29tIiwiaHR0cHM6Ly9vcGVucGhvbmUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc2Mjk3NDc4MiwiZXhwIjoxNzYyOTc4MzgyLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiUjBHOWRMd01EWGdqR0hpOWNFTVVIb2VZang0TnNoWWYiLCJwZXJtaXNzaW9ucyI6W119.VzZGUG_chDIjpll5fQuFoAC0So_iC-D3dpCHbHdCPU6E68UxzReZUYAuwSjedeXOvThf5btgPWpeAyFKYF9jC4lEvpe5bdVUP3dP4Un26gQ9LkAxffgbPYfy2ffu0AqM5ZqZoVlf615PUa9cpYBbLNxVDLYU9z9YAvI-12wGYWgRTQ3uYsoEgR-10LXyVPntUPDX70SELEmJlNvYT3IZo4e_Lqj88YHio1o4XEKgY98Tnugy-zyepNfPPgZoqjgloJXFSAX8274UwKsrTU5yOtuwE812IvstXZ7hfunhstovQlqGR66pV081WkFrYtz3uwQ_CYwpbmc9gd2AFWEcGA';

// Load saved values
chrome.storage.local.get(['conversationId', 'last', 'authToken', 'openaiApiKey'], (result) => {
  if (result.conversationId) {
    conversationIdInput.value = result.conversationId;
  }
  if (result.last) {
    lastInput.value = result.last;
  }
  if (result.authToken) {
    authTokenInput.value = result.authToken;
  } else {
    // Use default token if none saved
    authTokenInput.value = DEFAULT_TOKEN;
  }
  if (result.openaiApiKey) {
    openaiApiKeyInput.value = result.openaiApiKey;
  }
});

// Save values when they change
conversationIdInput.addEventListener('change', () => {
  chrome.storage.local.set({ conversationId: conversationIdInput.value });
});

lastInput.addEventListener('change', () => {
  chrome.storage.local.set({ last: lastInput.value });
});

authTokenInput.addEventListener('change', () => {
  chrome.storage.local.set({ authToken: authTokenInput.value });
});

// Settings toggle
btnSettings.addEventListener('click', () => {
  const isVisible = settingsSection.style.display !== 'none';
  settingsSection.style.display = isVisible ? 'none' : 'block';
});

// Save settings
btnSaveSettings.addEventListener('click', () => {
  const apiKey = openaiApiKeyInput.value.trim();
  chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
    showStatus('Settings saved!', 'success');
    setTimeout(() => {
      settingsSection.style.display = 'none';
    }, 1500);
  });
});

// Show response display
function showResponse(data, title = 'Response') {
  const existing = responseDisplay.textContent;
  const newContent = `${title}:\n\n${JSON.stringify(data, null, 2)}`;
  if (existing) {
    responseDisplay.textContent = `${existing}\n\n${'='.repeat(50)}\n\n${newContent}`;
  } else {
    responseDisplay.textContent = newContent;
  }
  responseDisplay.classList.add('show');
}

// Hide response display
function hideResponse() {
  responseDisplay.classList.remove('show');
}

// Listen for token updates from background script (network interception)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.authToken && changes.authToken.newValue) {
    const newToken = changes.authToken.newValue;
    if (newToken !== authTokenInput.value.trim()) {
      authTokenInput.value = newToken;
      showStatus('Token updated from network request!', 'success');
    }
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type !== 'loading') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

function setButtonsEnabled(enabled) {
  btnDownload.disabled = !enabled;
  btnFetch.disabled = !enabled;
  btnCreateJob.disabled = !enabled;
}

// Generate a random request ID (24 hex characters)
function generateRequestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a UUID v4 for device ID
function generateDeviceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get dynamic headers for API requests
function getDynamicHeaders(authToken) {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "authorization": authToken,
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-op-app": "web",
    "x-op-device": "browser",
    "x-op-device-id": generateDeviceId(),
    "x-op-env": "production",
    "x-op-requestid": generateRequestId(),
    "x-op-version": "3.278.6",
    "Referer": "https://my.quo.com/"
  };
}

// Function to automatically capture and update the token
async function refreshTokenFromBrowser() {
  try {
    // Method 1: Check cookies from OpenPhone domains
    const cookies = await chrome.cookies.getAll({ domain: '.openphoneapi.com' });
    const quoCookies = await chrome.cookies.getAll({ domain: '.quo.com' });
    const allCookies = [...cookies, ...quoCookies];
    
    // Look for JWT-like tokens in cookies (usually named 'token', 'auth', 'jwt', 'access_token', etc.)
    for (const cookie of allCookies) {
      const value = cookie.value;
      // JWT tokens start with 'eyJ' (base64 encoded JSON header)
      if (value && value.startsWith('eyJ') && value.length > 100) {
        console.log('Found token in cookie:', cookie.name);
        return value;
      }
    }
    
    // Method 2: Check localStorage/sessionStorage from open OpenPhone tabs
    const tabs = await chrome.tabs.query({ url: ['https://my.quo.com/*', 'https://*.quo.com/*'] });
    
    for (const tab of tabs) {
      try {
        // Try to read from localStorage
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Check common token storage keys
            const keys = ['token', 'authToken', 'jwt', 'access_token', 'authorization', 'auth'];
            for (const key of keys) {
              const value = localStorage.getItem(key) || sessionStorage.getItem(key);
              if (value && value.startsWith('eyJ') && value.length > 100) {
                return value;
              }
            }
            // Also check all localStorage keys for JWT-like values
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const value = localStorage.getItem(key);
              if (value && typeof value === 'string' && value.startsWith('eyJ') && value.length > 100) {
                return value;
              }
            }
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              const value = sessionStorage.getItem(key);
              if (value && typeof value === 'string' && value.startsWith('eyJ') && value.length > 100) {
                return value;
              }
            }
            return null;
          }
        });
        
        if (results && results[0] && results[0].result) {
          console.log('Found token in storage from tab:', tab.id);
          return results[0].result;
        }
      } catch (e) {
        // Tab might not be accessible, continue
        console.log('Could not access tab:', tab.id, e.message);
      }
    }
    
    // Method 3: Try to intercept from network requests by checking cookies after a request
    // This is a fallback - we'll capture it on the next request
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Function to update token if found
async function tryUpdateToken() {
  const newToken = await refreshTokenFromBrowser();
  if (newToken && newToken !== authTokenInput.value.trim()) {
    authTokenInput.value = newToken;
    await chrome.storage.local.set({ authToken: newToken });
    showStatus('Token updated automatically!', 'success');
    return true;
  }
  return false;
}

async function fetchActivity() {
  const conversationId = conversationIdInput.value.trim();
  const last = lastInput.value.trim();
  let authToken = authTokenInput.value.trim();
  
  if (!conversationId) {
    showStatus('Please enter a Conversation ID', 'error');
    return null;
  }
  
  if (!last || parseInt(last) < 1) {
    showStatus('Please enter a valid count (>= 1)', 'error');
    return null;
  }
  
  // Try to refresh token automatically before making request
  showStatus('Checking for fresh token...', 'loading');
  const tokenUpdated = await tryUpdateToken();
  if (tokenUpdated) {
    authToken = authTokenInput.value.trim();
  }
  
  if (!authToken) {
    showStatus('Please enter an Authorization Token', 'error');
    return null;
  }
  
  const url = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=${last}`;
  
  try {
    showStatus('Fetching...', 'loading');
    setButtonsEnabled(false);
    
    // Get dynamic headers with fresh token
    const headers = getDynamicHeaders(authToken);
    // Remove content-type for GET requests
    delete headers['content-type'];
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Check for token expiration
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === 'REFRESH_TOKEN' || errorJson.message?.includes('Token')) {
          errorMessage = 'Token expired! Please update your Authorization Token.';
          showStatus(errorMessage, 'error');
          // Highlight the token field
          authTokenInput.style.borderColor = '#ea4335';
          setTimeout(() => {
            authTokenInput.style.borderColor = '#ddd';
          }, 3000);
        }
      } catch (e) {
        // Not JSON, use original error
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // After successful request, check if token was updated by background script
    const storedToken = await chrome.storage.local.get(['authToken']);
    if (storedToken.authToken && storedToken.authToken !== authToken) {
      authTokenInput.value = storedToken.authToken;
      console.log('Token updated from storage (captured by background)');
    }
    
    // Also try to capture any fresh token from response headers
    const responseAuthHeader = response.headers.get('authorization');
    if (responseAuthHeader && responseAuthHeader !== authToken) {
      authTokenInput.value = responseAuthHeader;
      await chrome.storage.local.set({ authToken: responseAuthHeader });
      console.log('Token updated from response header');
    }
    
    return data;
    
  } catch (error) {
    console.error('Fetch error:', error);
    
    // If token expired, try to refresh it one more time
    if (error.message.includes('Token') || error.message.includes('Unauthorized')) {
      showStatus('Token expired, trying to refresh...', 'loading');
      const refreshed = await tryUpdateToken();
      if (refreshed) {
        showStatus('Token refreshed! Try again.', 'success');
        return null; // Return null so user can retry
      }
    }
    
    showStatus(`Error: ${error.message}`, 'error');
    return null;
  } finally {
    setButtonsEnabled(true);
  }
}

// Download button
btnDownload.addEventListener('click', async () => {
  const data = await fetchActivity();
  
  if (!data) {
    return;
  }
  
  try {
    showStatus('Preparing download...', 'loading');
    
    const jsonString = JSON.stringify(data, null, 2);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    const dataUrl = `data:application/json;base64,${base64}`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const conversationId = conversationIdInput.value.trim();
    const filename = `openphone-activity-${conversationId}-${timestamp}.json`;
    
    // Send message to background script to handle download
    chrome.runtime.sendMessage({
      action: 'download',
      url: dataUrl,
      filename: filename
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus(`Download error: ${chrome.runtime.lastError.message}`, 'error');
      } else if (response && response.success) {
        showStatus('Download started!', 'success');
      } else {
        showStatus('Download failed', 'error');
      }
    });
    
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
});

// Fetch & Show button
btnFetch.addEventListener('click', async () => {
  const data = await fetchActivity();
  
  if (!data) {
    return;
  }
  
  try {
    showStatus('Opening in new tab...', 'loading');
    
    // Create a new tab with the JSON data
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    
    chrome.tabs.create({
      url: blobUrl
    }, (tab) => {
      showStatus(`Fetched ${data.result?.length || 0} activities`, 'success');
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    });
    
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
});

// Create Job button
btnCreateJob.addEventListener('click', async () => {
  let authToken = authTokenInput.value.trim();
  
  if (!authToken) {
    showStatus('Please enter an Authorization Token', 'error');
    return;
  }
  
  // Check for OpenAI API key
  const stored = await chrome.storage.local.get(['openaiApiKey']);
  const openaiApiKey = stored.openaiApiKey;
  
  if (!openaiApiKey || !openaiApiKey.trim()) {
    showStatus('Please add your OpenAI API key in Settings', 'error');
    settingsSection.style.display = 'block';
    return;
  }
  
  try {
    hideResponse();
    showStatus('Fetching conversation transcript...', 'loading');
    setButtonsEnabled(false);
    
    // Step 1: Fetch conversation data
    const conversationData = await fetchActivity();
    if (!conversationData) {
      showStatus('Failed to fetch conversation data', 'error');
      return;
    }
    
    // Step 2: Call OpenAI to generate job definition
    showStatus('Analyzing transcript with OpenAI...', 'loading');
    
    const openaiPrompt = `Look at this call transcript.

${JSON.stringify(conversationData, null, 2)}

Do you think you can try and extract out the intent of the call and if you believe this is something that can be "jobified", then we should Jobify it. This is the documentation for jobs in Sona:

How Sona jobs work

Job architecture
Job structure:
Job library: Your entire collection of jobs, available to all Sona steps across the workspace
Jobs: Step-by-step instruction that guide how Sona should respond to callers in specific scenarios
Job limits and fields:
You can attach up to 10 jobs per Sona step
You can create unlimited jobs in your workspace
Each job contains:
Name (100 characters)
Description (optional, 500 characters)
Trigger (caller intent, up to 500 characters)
Instructions (step-by-step guidance, up to 10,000 characters)

----

THIS IS THE INFORMATION I NEED FOR A JOB

Job Name
Description...

Trigger
Describe what the caller says or asks for what should trigger this job.
Example The caller wants to schedule, reschedule, or cancel an appointment

Instructions

Describe how Sona should navigate this job, as if you're guiding a real person. Use clear, step-by-step language.

I need in this following format:

Can you give me this information in the following format in a JSON:
- emoji (with a single character emoji)
- name (a basic string, max 100 characters)
- description (optional string, max 500 characters, use \\n for line breaks)
- trigger (a string describing caller intent, max 500 characters)
- instructions (Markdown format with line breaks, max 10,000 characters - this will be the long one)

Return only valid JSON. Do not include any markdown code blocks or extra text. The JSON will be used directly as the body of an HTTP request.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: openaiPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `OpenAI: ${errorJson.error.message}`;
        }
      } catch (e) {
        errorMessage += ` - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }
    
    const openaiData = await openaiResponse.json();
    const openaiContent = openaiData.choices?.[0]?.message?.content;
    
    if (!openaiContent) {
      throw new Error('No content returned from OpenAI');
    }
    
    // Parse OpenAI JSON response
    let jobBody;
    try {
      jobBody = JSON.parse(openaiContent);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = openaiContent.match(/```json\s*([\s\S]*?)\s*```/) || openaiContent.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jobBody = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse JSON from OpenAI response');
      }
    }
    
    // Show OpenAI response
    showResponse(openaiData, 'OpenAI Response');
    
    // Validate required fields
    if (!jobBody.emoji || !jobBody.name || !jobBody.trigger || !jobBody.instructions) {
      throw new Error('OpenAI response missing required fields (emoji, name, trigger, instructions). Got: ' + JSON.stringify(Object.keys(jobBody)));
    }
    
    // Ensure description exists (even if empty)
    if (!jobBody.description) {
      jobBody.description = '';
    }
    
    // Step 3: Create job with OpenAI-generated definition
    showStatus('Creating job with AI-generated definition...', 'loading');
    
    const url = 'https://ai.openphoneapi.com/v1/agent-job-definitions';
    const headers = getDynamicHeaders(authToken);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(jobBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Check for token expiration
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === 'REFRESH_TOKEN' || errorJson.message?.includes('Token')) {
          errorMessage = 'Token expired! Please update your Authorization Token.';
          showStatus(errorMessage, 'error');
          authTokenInput.style.borderColor = '#ea4335';
          setTimeout(() => {
            authTokenInput.style.borderColor = '#ddd';
          }, 3000);
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // Not JSON, use original error
        if (errorText) {
          errorMessage += ` - ${errorText.substring(0, 100)}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const jobData = await response.json();
    
    // After successful request, check if token was updated
    const storedToken = await chrome.storage.local.get(['authToken']);
    if (storedToken.authToken && storedToken.authToken !== authToken) {
      authTokenInput.value = storedToken.authToken;
      console.log('Token updated from storage (captured by background)');
    }
    
    // Show success message with job details
    const jobId = jobData.id || 'unknown';
    showStatus(`✅ Job created successfully! ID: ${jobId}`, 'success');
    
    // Show job creation response
    showResponse(jobData, 'Job Created');
    
    // Log full response for debugging
    console.log('Job created:', jobData);
    console.log('OpenAI response:', openaiData);
    
    return jobData;
    
  } catch (error) {
    console.error('Create job error:', error);
    
    // If token expired, try to refresh it one more time
    if (error.message.includes('Token') || error.message.includes('Unauthorized')) {
      showStatus('Token expired, trying to refresh...', 'loading');
      const refreshed = await tryUpdateToken();
      if (refreshed) {
        showStatus('Token refreshed! Try again.', 'success');
        return null; // Return null so user can retry
      }
    }
    
    showStatus(`❌ Error: ${error.message}`, 'error');
    showResponse({ error: error.message }, 'Error');
    return null;
  } finally {
    setButtonsEnabled(true);
  }
});
