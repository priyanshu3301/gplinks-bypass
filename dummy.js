document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const finalUrl = decodeURIComponent(urlParams.get('finalUrl'));
    console.log(finalUrl);

    // Validate finalUrl
    if (!finalUrl) {
        document.querySelector('.message').textContent = "Error: No destination URL found.";
        document.querySelector('.message').style.color = "#ef4444";
        document.getElementById('countdown').textContent = "!";
        return;
    }

    let timeLeft = 90;
    const totalTime = 90;
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
                window.location.href = finalUrl;
            }, 500);
        }
    }, 1000);
});
