function showError(msg) {
  document.querySelector('.message').textContent = msg;
  document.querySelector('.message').style.color = "#ef4444";
  document.getElementById('countdown').textContent = "!";
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rawUrl = urlParams.get('url');
  const rawData = urlParams.get('data');

  if (!rawUrl || !rawData) {
    showError("Error: No destination data found.");
    return;
  }

  const postUrl = decodeURIComponent(rawUrl);

  let data;
  try {
    data = JSON.parse(decodeURIComponent(rawData));
  } catch (e) {
    showError("Error: Invalid data format.");
    return;
  }

  const { lid, pid, vid } = data;
  const pages = parseInt(data.pages, 10);

  console.log("Parsed data:", { lid, pid, vid, pages });
  console.log("Post URL:", postUrl);

  if (!lid || !pid || !vid || isNaN(pages)) {
    showError("Error: Missing required link parameters.");
    return;
  }

  const finalUrl = `https://gplinks.co/${lid}?pid=${pid}&vid=${vid}`;
  console.log("Final URL:", finalUrl);

  let timeLeft = pages * 30;
  const totalTime = timeLeft;

  const countdownEl = document.getElementById('countdown');
  const circle = document.querySelector('.progress-ring__circle');
  const circumference = 2 * Math.PI * 60; // r=60

  // Set initial state: circle fully empty, no transition
  circle.style.transition = 'none';
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  // After one paint frame, animate circle fill to FULL in 1s
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1s ease';
      circle.style.strokeDashoffset = 0;
    });
  });

  // After fill animation completes (1s), begin countdown drain
  setTimeout(() => {
    const timer = setInterval(() => {
      timeLeft--;
      countdownEl.textContent = timeLeft;

      // Set transition before each update so every step animates smoothly
      circle.style.transition = 'stroke-dashoffset 1s linear';
      circle.style.strokeDashoffset = circumference * (1 - timeLeft / totalTime);

      if (timeLeft <= 0) {
        clearInterval(timer);
        document.getElementById('status').classList.add('visible');
        setTimeout(() => {
          processLink(pages, vid, postUrl)
            .then(() => {
              window.location.href = finalUrl;
            })
            .catch(err => {
              console.error("Error processing link:", err);
              showError("An error occurred. Please try again.");
            });
        }, 500);
      }
    }, 1000);
  }, 1000);
});


function proxyFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    let body = options.body;
    const headers = options.headers || {};

    if (body instanceof URLSearchParams) {
      body = body.toString();
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    chrome.runtime.sendMessage(
      { type: "FETCH_PROXY", url, method: options.method, headers, body },
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processLink(pages, vid, postUrl) {
  for (let i = 1; i <= pages; i++) {
    await proxyFetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        form_name: "ads-track-data",
        step_id: i.toString(),
        ad_impressions: "2",
        visitor_id: vid,
        next_target: ""
      })
    });
    await delay(1000);
  }
}