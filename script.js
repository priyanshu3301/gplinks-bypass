document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const Url = decodeURIComponent(urlParams.get('Url'));

  // Validate finalUrl
  if (!Url) {
    document.querySelector('.message').textContent = "Error: No destination URL found.";
    document.querySelector('.message').style.color = "#ef4444";
    document.getElementById('countdown').textContent = "!";
    return;
  }

  console.log("Received URL:", Url);
  const url = new URL(Url);
  const lid = atob(url.searchParams.get('lid'));
  const pid = atob(url.searchParams.get('pid'));
  const vid = url.searchParams.get('vid');
  const pages = atob(url.searchParams.get('pages'));

  const finalUrl = `https://gplinks.co/${lid}?pid=${pid}&vid=${vid}`;
  console.log("Final URL:", finalUrl);


  let timeLeft = pages * 30;
  const totalTime = timeLeft;
  const countdownEl = document.getElementById('countdown');
  const circle = document.querySelector('.progress-ring__circle');
  const circumference = 2 * Math.PI * 60; // r=60

  // Initialize circle
  circle.style.strokeDasharray = `${circumference} ${circumference}`;

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  const timer = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = timeLeft;

    // Update progress ring
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const remainingPercent = (timeLeft / totalTime) * 100;
    const newOffset = circumference - (remainingPercent / 100) * circumference;
    circle.style.strokeDashoffset = newOffset;

    if (timeLeft <= 0) {
      clearInterval(timer);
      document.getElementById('status').classList.add('visible');
      // Small delay to show 0
      setTimeout(() => {
        processLink(pages, vid, url).then(() => {
          window.location.href = finalUrl;
        }).catch(err => {
          console.error("Error processing link:", err);
          document.querySelector('.message').textContent = "An error occurred. Please try again.";
          document.querySelector('.message').style.color = "#ef4444";
        });
      }, 500);
    }
  }, 1000);


});

function proxyFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    let body = options.body;
    let headers = options.headers || {};

    if (body instanceof URLSearchParams) {
      body = body.toString();
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    } else if (body instanceof FormData) {
      // Convert FormData to URLSearchParams for simple text fields
      // Note: File uploads are not supported via this simple proxy method
      const params = new URLSearchParams();
      for (const [key, value] of body.entries()) {
        if (typeof value === 'string') {
          params.append(key, value);
        } else {
          console.warn(`FormData entry "${key}" is not a string and will be ignored.`);
        }
      }
      body = params.toString();
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }


    chrome.runtime.sendMessage(
      {
        type: "FETCH_PROXY",
        url,
        method: options.method,
        headers: headers,
        body: body
      },
      response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve(response);
      }
    );
  });
}

/**
 * Helper function to create a delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processLink(pages, vid, url) {
  for (let i = 1; i <= pages; i++) {
    const formData = new URLSearchParams({
      form_name: "ads-track-data",
      step_id: i.toString(),
      ad_impressions: "2",
      visitor_id: vid,
      next_target: ""
    });

    const response = await proxyFetch(url.origin + url.pathname, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    await delay(1000);
  }
}