chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId === -1) return;

    const locationHeader = details.responseHeaders?.find(
      h => h.name.toLowerCase() === "location"
    );

    if (!locationHeader) return;

    const originalLocation = locationHeader.value;
    console.log("Location detected:", originalLocation);

    processLink(originalLocation, details);
  },
  {
    urls: ["https://gplinks.co/*"],
    types: ["main_frame"]
  },
  ["responseHeaders", "extraHeaders"]
);

/**
 * Helper function to create a delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to set cookies using chrome.cookies API
 * @param {string} url - The URL to set cookies for
 * @param {string} cookieString - The cookie string (e.g., "key=value; key2=value2")
 */
async function setCookies(url, cookieString) {
  const cookies = cookieString.split(';').map(c => c.trim());
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  const promises = cookies.map(cookie => {
    const [name, value] = cookie.split('=');
    if (!name) return Promise.resolve();

    return chrome.cookies.set({
      url: url,
      domain: domain,
      name: name,
      value: value || '',
      path: '/'
    });
  });

  await Promise.all(promises);
}



async function processLink(gplinkUrl, details) {
  try {
    const url = new URL(gplinkUrl);
    const lid = atob(url.searchParams.get('lid'));
    const pid = atob(url.searchParams.get('pid'));
    const vid = url.searchParams.get('vid');

    const finalUrl = `https://gplinks.co/${lid}?pid=${pid}&vid=${vid}`;
    console.log("Final URL:", finalUrl);

    // 🔁 Replace the tab URL
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(`dummy.html?finalUrl=${encodeURIComponent(finalUrl)}`)
    });

    for (let i = 1; i <= 3; i++) {
      const formData = new URLSearchParams({
        form_name: "ads-track-data",
        step_id: i.toString(),
        ad_impressions: "0",
        visitor_id: vid,
        next_target: ""
      });

      // Construct the cookie string
      const cookie = `lid=${lid}; pid=${pid}; pages=${i}; imps=0; vid=${vid}; step_count=${i}`;

      // Set cookies using API because 'Cookie' header is unsafe in fetch
      await setCookies(url.origin, cookie);

      const response = await fetch(url.origin + url.pathname, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // "User-Agent": "Mozilla/5.0...", // Browser sets this automatically
          // "Referer": redirectUrl, // Browser might set this or block it. 
        },
        body: formData,
        redirect: "manual"
      });

      await delay(1000);
    }

  } catch (e) {
    console.error("Processing error:", e);
    return null; // Or return original URL?
  }
}