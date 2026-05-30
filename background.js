const REQUIRED = ["lid", "pid", "vid", "pages", "step_count", "imps"];

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  try {
    const cookies = await chrome.cookies.getAll({ url: details.url });

    const cookieMap = {};
    for (const cookie of cookies) {
      cookieMap[cookie.name] = cookie.value;
    }

    if (!REQUIRED.every(name => cookieMap[name] !== undefined)) return;

    console.log("Matching cookies found:", cookieMap);

    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(
        `index.html?url=${encodeURIComponent(details.url)}&data=${encodeURIComponent(JSON.stringify(cookieMap))}`
      )
    });

  } catch (err) {
    console.error(err);
  }
});


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
      sendResponse({ ok: false, error: err.message });
    });

  return true; // keeps message channel open
});
