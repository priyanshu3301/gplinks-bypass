# Gplink Bypasser Extension (Jan 2026)

## Overview
**Gplink Bypasser** is a Chrome extension designed to automatically handle and bypass `gplinks.co` intermediate pages. It intercepts navigation to Gplinks URLs, processes the necessary verification steps in the background, and provides a clean, automated countdown interface before redirecting you to your final destination.

## Features
- **Automatic Interception**: Detects and intercepts navigation to `https://gplinks.co/*`.
- **Background Processing**: Automatically handles the multi-step form submissions and cookie generation required by the link provider in the background.
- **Clean Interface**: Replaces the ad-heavy intermediate page with a clean, dark-themed waiting screen featuring a progress ring and countdown.
- **Automated Redirection**: Automatically redirects to the final destination URL after the wait time (90 seconds).

## How It Works
1. When you visit a supported Gplink URL, the extension's **Service Worker** (`background.js`) intercepts the request.
2. It pauses the original request and extracts the necessary parameters (`lid`, `pid`, `vid`).
3. The tab is redirected to a local `dummy.html` page displaying a timer.
4. Simultaneously, the Service Worker simulates the required 3-step verification process (sending POST requests and setting cookies) to the server to ensure the final link is valid.
5. Once the countdown on the dummy page finishes, the browser automatically navigates to the final destination URL.

## Installation
Since this extension is not in the Chrome Web Store, you must install it manually:

1. Download or clone this repository to a folder on your computer.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the folder containing these files (`manifest.json`, `background.js`, `dummy.html`, etc.).
6. The extension is now installed and active.

## Permissions
- **`webRequest`**: To intercept network requests to `gplinks.co`.
- **`cookies`**: To set the necessary verification cookies for the bypass process.
- **`tabs`**: To update the tab URL to the waiting page and the final destination.
- **`host_permissions` (<all_urls>)**: Required to ensure it can intercept navigation and interact with the necessary domains.

## Disclaimer
This extension is for educational purposes only. Users are responsible for ensuring their usage complies with the terms of service of any third-party websites they visit.
