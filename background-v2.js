// OpenPhone Activity Downloader - Background Script (Alternative version for large files)

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
        "if-none-match": "W/\"123fd-/C77sZdBISO/sbzpP+lCzz+zdj8\"",
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('Data received, size:', JSON.stringify(data).length, 'chars');
    } catch (jsonError) {
      const text = await response.text();
      console.error('JSON parse error:', jsonError);
      throw new Error(`Failed to parse JSON response: ${jsonError.message}\nResponse: ${text.substring(0, 200)}`);
    }
    
    const jsonString = JSON.stringify(data, null, 2);
    console.log('JSON string length:', jsonString.length);
    
    // Use Blob with FileReader for large files
    const blob = new Blob([jsonString], { type: 'application/json' });
    const reader = new FileReader();
    
    reader.onloadend = function() {
      const base64data = reader.result;
      const dataUrl = base64data;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `openphone-activity-${conversationId}-${timestamp}.json`;
      
      console.log('Starting download:', filename);
      
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          chrome.action.setBadgeText({ text: 'ERR' });
          chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
          
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            title: 'Download Failed',
            message: chrome.runtime.lastError.message || 'Check console for details'
          });
        } else {
          console.log('Download started, ID:', downloadId);
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#34a853' });
          
          setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
          }, 2000);
        }
      });
    };
    
    reader.onerror = function(error) {
      console.error('FileReader error:', error);
      throw new Error('Failed to read blob: ' + error);
    };
    
    reader.readAsDataURL(blob);
    
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'OpenPhone Downloader Error',
      message: error.message || 'Unknown error occurred. Check console for details.'
    });
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }
});
