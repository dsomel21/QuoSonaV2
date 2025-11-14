// QuoJobBuilderExtension - Background Script

console.log('QuoJobBuilderExtension loaded');

// Intercept network requests to capture authorization tokens
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Look for authorization header in requests to OpenPhone API
    if (details.url.includes('openphoneapi.com')) {
      const headers = details.requestHeaders || [];
      for (const header of headers) {
        if (header.name.toLowerCase() === 'authorization' && header.value) {
          const token = header.value;
          // Save token automatically
          chrome.storage.local.set({ authToken: token }, () => {
            console.log('Token captured from network request:', token.substring(0, 50) + '...');
          });
          break;
        }
      }
    }
  },
  {
    urls: ['https://*.openphoneapi.com/*']
  },
  ['requestHeaders']
);

// Also intercept response headers to capture tokens from responses
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.url.includes('openphoneapi.com')) {
      const headers = details.responseHeaders || [];
      for (const header of headers) {
        if (header.name.toLowerCase() === 'authorization' && header.value) {
          const token = header.value;
          // Save token automatically
          chrome.storage.local.set({ authToken: token }, () => {
            console.log('Token captured from response:', token.substring(0, 50) + '...');
          });
          break;
        }
      }
    }
  },
  {
    urls: ['https://*.openphoneapi.com/*']
  },
  ['responseHeaders']
);

// Handle download messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle token refresh request from popup
  if (request.action === 'refreshToken') {
    refreshTokenFromBrowser().then(token => {
      sendResponse({ success: true, token: token });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Helper function to refresh token (shared with popup logic)
async function refreshTokenFromBrowser() {
  try {
    // Method 1: Check cookies from OpenPhone domains
    const cookies = await chrome.cookies.getAll({ domain: '.openphoneapi.com' });
    const quoCookies = await chrome.cookies.getAll({ domain: '.quo.com' });
    const allCookies = [...cookies, ...quoCookies];
    
    // Look for JWT-like tokens in cookies
    for (const cookie of allCookies) {
      const value = cookie.value;
      if (value && value.startsWith('eyJ') && value.length > 100) {
        console.log('Found token in cookie:', cookie.name);
        return value;
      }
    }
    
    // Method 2: Check localStorage/sessionStorage from open OpenPhone tabs
    const tabs = await chrome.tabs.query({ url: ['https://my.quo.com/*', 'https://*.quo.com/*'] });
    
    for (const tab of tabs) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const keys = ['token', 'authToken', 'jwt', 'access_token', 'authorization', 'auth'];
            for (const key of keys) {
              const value = localStorage.getItem(key) || sessionStorage.getItem(key);
              if (value && value.startsWith('eyJ') && value.length > 100) {
                return value;
              }
            }
            // Check all localStorage/sessionStorage values
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
        console.log('Could not access tab:', tab.id, e.message);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Keep the old click handler as fallback (if popup doesn't open)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked');
  // Default values - you can modify these
  const conversationId = 'CN115a0a2e031e4379add8fed4c374d9cc';
  const last = '51';
  
  const url = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=${last}`;
  
  try {
    // Show loading badge
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImhFVk1YenFXbk10c2RfOVJQVTV2QSJ9.eyJpbnRlcm5hbF91c2VyX2lkIjoiVVNTVDVreUZhZCIsImludGVybmFsX29yZ19pZCI6Ik9SWEppc1BCTFkiLCJpbnRlcm5hbF9vcmdfcm9sZSI6Im93bmVyIiwiZW1haWwiOiJkc29tZWwyMUBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NpZ25pbi5vcGVucGhvbmUuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE3NTY5ODc1ODY1OTM2ODM5Mzg4IiwiYXVkIjpbImh0dHBzOi8vKi5vcGVucGhvbmVhcGkuY29tIiwiaHR0cHM6Ly9vcGVucGhvbmUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc2Mjk3NDc4MiwiZXhwIjoxNzYyOTc4MzgyLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiUjBHOWRMd01EWGdqR0hpOWNFTVVIb2VZang0TnNoWWYiLCJwZXJtaXNzaW9ucyI6W119.VzZGUG_chDIjpll5fQuFoAC0So_iC-D3dpCHbHdCPU6E68UxzReZUYAuwSjedeXOvThf5btgPWpeAyFKYF9jC4lEvpe5bdVUP3dP4Un26gQ9LkAxffgbPYfy2ffu0AqM5ZqZoVlf615PUa9cpYBbLNxVDLYU9z9YAvI-12wGYWgRTQ3uYsoEgR-10LXyVPntUPDX70SELEmJlNvYT3IZo4e_Lqj88YHio1o4XEKgY98Tnugy-zyepNfPPgZoqjgloJXFSAX8274UwKsrTU5yOtuwE812IvstXZ7hfunhstovQlqGR66pV081WkFrYtz3uwQ_CYwpbmc9gd2AFWEcGA",
        // Removed if-none-match header to avoid 304 Not Modified responses
        "priority": "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-op-app": "web",
        "x-op-device": "browser",
        "x-op-device-id": "479ee825-efc8-49f0-adda-3a4db4e251fd",
        "x-op-env": "production",
        "x-op-requestid": "6914dcce2ef6d1d77946101f",
        "x-op-version": "3.278.5",
        "Referer": "https://my.quo.com/"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const text = await response.text();
      throw new Error(`Failed to parse JSON response: ${jsonError.message}\nResponse: ${text.substring(0, 200)}`);
    }
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create data URL for download
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quo-activity-${conversationId}-${timestamp}.json`;
    
    // Check if data URL is too large (Chrome has ~2MB limit for data URLs)
    if (dataUrl.length > 2000000) {
      throw new Error('File too large for data URL. Size: ' + jsonString.length + ' characters');
    }
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        try {
          chrome.action.setBadgeText({ text: 'ERR' });
          chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
        } catch (e) {
          console.error('Failed to set badge:', e);
        }
      } else {
        console.log('Download started successfully, ID:', downloadId);
        try {
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#34a853' });
          
          // Clear badge after 2 seconds - wrapped in try/catch for service worker termination
          setTimeout(() => {
            try {
              chrome.action.setBadgeText({ text: '' });
            } catch (e) {
              // Service worker may have terminated, ignore
            }
          }, 2000);
        } catch (e) {
          console.error('Failed to set success badge:', e);
        }
      }
    });
    
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
    
    // Show notification with error details
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'QuoJobBuilderExtension Error',
      message: error.message || 'Unknown error occurred. Check console for details.'
    });
    
    setTimeout(() => {
      try {
        chrome.action.setBadgeText({ text: '' });
      } catch (e) {
        // Service worker may have terminated, ignore
      }
    }, 3000);
  }
});
