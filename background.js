chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId === -1) return;

    const locationHeader = details.responseHeaders?.find(
      h => h.name.toLowerCase() === "location"
    );

    if (!locationHeader) return;

    const originalLocation = locationHeader.value;
    console.log("Location detected:", originalLocation);
    // 🔁 Replace the tab URL
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(`index.html?Url=${encodeURIComponent(originalLocation)}`)
    });
    // 🚫 Block the original request}
    return { cancel: true };
  },
  {
    urls: ["https://gplinks.co/*"],
    types: ["main_frame"]
  },
  ["responseHeaders", "extraHeaders"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "FETCH_PROXY") return;

  console.log(`[FETCH_PROXY] ${msg.method} ${msg.url}`, {
    headers: msg.headers,
    body: msg.body
  });

  fetch(msg.url, {
    method: msg.method || "GET",
    headers: msg.headers || {},
    body: msg.body || null,
    credentials: 'include'
  })
    .then(async res => {
      const text = await res.text();
      sendResponse({
        ok: res.ok,
        status: res.status,
        body: text,
        headers: Object.fromEntries(res.headers.entries())
      });
    })
    .catch(err => {
      sendResponse({
        ok: false,
        error: err.message
      });
    });

  // ⛔ VERY IMPORTANT
  return true; // keeps message channel open
});


