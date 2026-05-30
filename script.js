document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rawUrl  = urlParams.get('url');
  const rawData = urlParams.get('data');

  // Validate params
  if (!rawUrl || !rawData) {
    document.querySelector('.message').textContent = "Error: No destination data found.";
    document.querySelector('.message').style.color = "#ef4444";
    document.getElementById('countdown').textContent = "!";
    return;
  }

  const postUrl = decodeURIComponent(rawUrl);

  let data;
  try {
    data = JSON.parse(decodeURIComponent(rawData));
  } catch (e) {
    document.querySelector('.message').textContent = "Error: Invalid data format.";
    document.querySelector('.message').style.color = "#ef4444";
    document.getElementById('countdown').textContent = "!";
    return;
  }

  const lid   = data.lid;
  const pid   = data.pid;
  const vid   = data.vid;
  const pages = parseInt(data.pages, 10);

  console.log("Parsed data:", { lid, pid, vid, pages });
  console.log("Post URL:", postUrl);

  if (!lid || !pid || !vid || isNaN(pages)) {
    document.querySelector('.message').textContent = "Error: Missing required link parameters.";
    document.querySelector('.message').style.color = "#ef4444";
    document.getElementById('countdown').textContent = "!";
    return;
  }

  const finalUrl = `https://gplinks.co/${lid}?pid=${pid}&vid=${vid}`;
  console.log("Final URL:", finalUrl);

  let timeLeft = pages * 30;
  const totalTime = timeLeft;
  const countdownEl = document.getElementById('countdown');
  const circle = document.querySelector('.progress-ring__circle');
  const circumference = 2 * Math.PI * 60; // r=60

  // Initialize circle
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  const timer = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = timeLeft;

    // Update progress ring
    const remainingPercent = (timeLeft / totalTime) * 100;
    const newOffset = circumference - (remainingPercent / 100) * circumference;
    circle.style.strokeDashoffset = newOffset;

    if (timeLeft <= 0) {
      clearInterval(timer);
      document.getElementById('status').classList.add('visible');
      // Small delay to show 0
      setTimeout(() => {
        processLink(pages, vid, postUrl).then(() => {
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

async function processLink(pages, vid, postUrl) {
  for (let i = 1; i <= pages; i++) {
    const formData = new URLSearchParams({
      form_name: "ads-track-data",
      step_id: i.toString(),
      ad_impressions: "2",
      visitor_id: vid,
      next_target: ""
    });

    const response = await proxyFetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    await delay(1000);
  }
}