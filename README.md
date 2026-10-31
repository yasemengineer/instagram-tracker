# instagram-tracker
A Chrome extension for tracking Instagram users and managing follow statuses.

# Instagram Unfollowers & Followers Tracker

A lightweight, privacy-focused Chrome extension that locally compares your Instagram followers and following lists to safely analyze who doesn't follow you back (*unfollowers*), as well as track new and lost followers.

---

## Features

-**Find Unfollowers:** Instantly lists users you follow who do not follow you back.
- **Fans:** Displays accounts that follow you, but you do not follow back.
- **Lost & New Followers:** Locally analyzes changes and differences between two scans or imports.
- **Import / Export:** Easily backup or import your follower lists in JSON format.
- **100% Client-Side (Local-Only):** Never transmits your password, username, or account data to any external server; all data is stored securely in your browser (`chrome.storage.local`).
- **No API Ban Risk:** Does not execute suspicious background API calls; safely reads DOM data directly from your active, logged-in Instagram tab.
  
---

## Project Directory Structure

```text
instagram-tracker/
├── manifest.json
├── popup.html
├── css/
│   └── style.css
├── js/
│   ├── content.js
│   ├── popup.js
│   ├── storage.js
│   └── import.js
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

Developer Setup (Manual Installation)
1. Clone this repository or extract the project ZIP archive:
git clone https://github.com/yasemengineer/instagram-tracker.git

2. Open Google Chrome and navigate to:
chrome://extensions/

3. Enable Developer mode using the toggle switch in the top-right corner.

4. Click Load unpacked.

5. Select the root folder of the project.

6. The extension icon will be added to your Chrome toolbar.

---

Security & Permissions
storage: Used solely to persist scan history and snapshot lists locally on your device.

activeTab / host_permissions (*://*.instagram.com/*): Required exclusively to read follower and following lists on the Instagram web page upon user request.

No External Requests: The codebase contains zero third-party analytics libraries, telemetry tools, or remote server connections.
