// chrome.webRequest.onHeadersReceived.addListener(
//   (details) => {
//     if (details.tabId === -1) return;

//     const locationHeader = details.responseHeaders?.find(
//       h => h.name.toLowerCase() === "location"
//     );

//     if (!locationHeader) return;

//     const originalLocation = locationHeader.value;
//     console.log("Location detected:", originalLocation);
//     // 🔁 Replace the tab URL
//     chrome.tabs.update(details.tabId, {
//       url: chrome.runtime.getURL(`index.html?Url=${encodeURIComponent(originalLocation)}`)
//     });
//     // 🚫 Block the original request}
//     return { cancel: true };
//   },
//   {
//     urls: ["https://gplinks.co/*"],
//     types: ["main_frame"]
//   },
//   ["responseHeaders", "extraHeaders"]
// );

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const cookies = {};

    for (const header of details.responseHeaders || []) {
      if (header.name.toLowerCase() !== "set-cookie") continue;

      const firstPart = header.value?.split(";")[0];

      if (!firstPart) continue;

      const idx = firstPart.indexOf("=");

      if (idx === -1) continue;

      const name = firstPart.substring(0, idx).trim();
      const value = firstPart.substring(idx + 1).trim();

      cookies[name] = value;
    }

    const required = [
      "lid",
      "pid",
      "vid",
      "pages",
      "step_count",
      "imps"
    ];

    const allFound = required.every(name => cookies[name]);

    if (!allFound) return;

    console.log("Cookies:", cookies);

    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(
        `index.html?url=${encodeURIComponent(details.url)}&data=${encodeURIComponent(
          JSON.stringify(cookies)
        )}`
      )
    });
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  },
  ["responseHeaders", "extraHeaders"]
);


chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  try {
    const url = details.url;

    const cookies = await chrome.cookies.getAll({
      url: url
    });

    const cookieMap = {};

    for (const cookie of cookies) {
      cookieMap[cookie.name] = cookie.value;
    }

    const required = [
      "lid",
      "pid",
      "vid",
      "pages",
      "step_count",
      "imps"
    ];

    const allFound = required.every(
      name => cookieMap[name] !== undefined
    );

    if (!allFound) return;

    console.log("Matching cookies found:", cookieMap);

    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(
        `index.html?url=${encodeURIComponent(details.url)}&data=${encodeURIComponent(
          JSON.stringify({
            lid: cookieMap.lid,
            pid: cookieMap.pid,
            vid: cookieMap.vid,
            pages: cookieMap.pages,
            step_count: cookieMap.step_count,
            imps: cookieMap.imps
          })
        )}`
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
      sendResponse({
        ok: false,
        error: err.message
      });
    });

  // ⛔ VERY IMPORTANT
  return true; // keeps message channel open
});


