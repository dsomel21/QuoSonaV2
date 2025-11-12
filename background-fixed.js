// OpenPhone Activity Downloader - Background Script (Fixed version)

console.log('OpenPhone Downloader extension loaded');

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
    
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImhFVk1YenFXbk10c2RfOVJQVTV2QSJ9.eyJpbnRlcm5hbF91c2VyX2lkIjoiVVNTVDVreUZhZCIsImludGVybmFsX29yZ19pZCI6Ik9SWEppc1BCTFkiLCJpbnRlcm5hbF9vcmdfcm9sZSI6Im93bmVyIiwiZW1haWwiOiJkc29tZWwyMUBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NpZ25pbi5vcGVucGhvbmUuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE3NTY5ODc1ODY1OTM2ODM5Mzg4IiwiYXVkIjpbImh0dHBzOi8vKi5vcGVucGhvbmVhcGkuY29tIiwiaHR0cHM6Ly9vcGVucGhvbmUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc2Mjk3NDc4MiwiZXhwIjoxNzYyOTc4MzgyLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiUjBHOWRMd01EWGdqR0hpOWNFTVVIb2VZang0TnNoWWYiLCJwZXJtaXNzaW9ucyI6W119.VzZGUG_chDIjpll5fQuFoAC0So_iC-D3dpCHbHdCPU6E68UxzReZUYAuwSjedeXOvThf5btgPWpeAyFKYF9jC4lEvpe5bdVUP3dP4Un26gQ9LkAxffgbPYfy2ffu0AqM5ZqZoVlf615PUa9cpYBbLNxVDLYU9z9YAvI-12wGYWgRTQ3uYsoEgR-10LXyVPntUPDX70SELEmJlNvYT3IZo4e_Lqj88YHio1o4XEKgY98Tnugy-zyepNfPPgZoqjgloJXFSAX8274UwKsrTU5yOtuwE812IvstXZ7hfunhstovQlqGR66pV081WkFrYtz3uwQ_CYwpbmc9gd2AFWEcGA",
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

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText.substring(0, 500)}`);
    }

    const data = await response.json();
    console.log('Data received, activities:', data.result?.length || 0);
    
    const jsonString = JSON.stringify(data, null, 2);
    console.log('JSON string length:', jsonString.length);
    
    // Use base64 data URL - more reliable than encodeURIComponent for large files
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    const dataUrl = `data:application/json;base64,${base64}`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `openphone-activity-${conversationId}-${timestamp}.json`;
    
    console.log('Starting download:', filename);
    console.log('Data URL length:', dataUrl.length);
    
    // Use a promise wrapper for better error handling
    await new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('Download started, ID:', downloadId);
          resolve(downloadId);
        }
      });
    });
    
    // Success - set badge
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#34a853' });
    
    // Clear badge after 2 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' }).catch(() => {});
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    chrome.action.setBadgeText({ text: 'ERR' }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({ color: '#ea4335' }).catch(() => {});
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'OpenPhone Downloader Error',
      message: error.message || 'Unknown error. Check console.'
    }).catch(() => {});
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' }).catch(() => {});
    }, 3000);
  }
});
