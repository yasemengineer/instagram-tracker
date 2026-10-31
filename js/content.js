const USERNAME_PATTERN = /^[a-z0-9._]{1,30}$/i;

const STATUS_CONFIG = {
    pending: {
        symbol: "✓",
        color: "#168451",
        title: "Takip edilmemiş - Bekliyor"
    },

    requested: {
        symbol: "✕",
        color: "#d64545",
        title: "Takip isteği gönderildi"
    },

    following: {
        symbol: "✓",
        color: "#3478d4",
        title: "Takip ediliyor"
    },

    unknown: {
        symbol: "—",
        color: "#888888",
        title: "Henüz kayıtlı değil"
    }
};

function normalizeUsername(value) {
    return value.trim().replace(/^@/, "").toLowerCase();
}

function getUsernameFromLink(link) {
    try {
        const url = new URL(link.href);

        const isInstagram = url.hostname === "www.instagram.com";
        const isLocalTest = url.hostname === "localhost";

        if (!isInstagram && !isLocalTest) return null;

        const parts = url.pathname.split("/").filter(Boolean);

        if (parts.length !== 1) return null;

        const username = normalizeUsername(parts[0]);

        return USERNAME_PATTERN.test(username) ? username : null;
    } catch {
        return null;
    }
}

function getButtonStatus(row) {
    const controls = row.querySelectorAll(
        'button, [role="button"]'
    );

    for (const control of controls) {
        const text = control.textContent
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("tr-TR");

        if (text === "takip et") {
            return "pending";
        }

        if (text === "istek gönderildi") {
            return "requested";
        }

        if (text === "takiptesin") {
            return "following";
        }
    }

    return null;
}

function findUserRow(profileLink, username) {
    let current = profileLink;

    for (let level = 0; level < 10 && current; level++) {
        const links = current.querySelectorAll
            ? current.querySelectorAll(
                'a[href*="instagram.com"], a[href^="/"]'
            )
            : [];

        const usernames = new Set();

        for (const link of links) {
            const foundUsername = getUsernameFromLink(link);

            if (foundUsername) {
                usernames.add(foundUsername);
            }
        }

        if (
            usernames.size === 1 &&
            usernames.has(username)
        ) {
            const status = getButtonStatus(current);

            if (status) {
                return {
                    element: current,
                    status
                };
            }
        }

        current = current.parentElement;
    }

    return null;
}

function getUsernameElement(profileLink, username) {
    const spans = profileLink.querySelectorAll(
        'span[dir="auto"]'
    );

    for (const span of spans) {
        const directText = Array.from(span.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join("")
            .trim();

        if (normalizeUsername(directText) === username) {
            return span;
        }
    }

    return spans[0] || profileLink;
}

function updateStatusBadge(element, status) {
    let badge = element.querySelector(
        ":scope > .instagram-tracker-badge"
    );

    if (!badge) {
        badge = document.createElement("span");
        badge.className = "instagram-tracker-badge";

        badge.style.cssText = `
            display: inline-block;
            margin-left: 7px;
            font-weight: bold;
            font-size: 14px;
            vertical-align: middle;
        `;

        element.appendChild(badge);
    }

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

    const nextText = config.symbol;

    if (
        badge.textContent === nextText &&
        badge.title === config.title
    ) {
        return;
    }

    badge.textContent = nextText;
    badge.title = config.title;
    badge.style.color = config.color;
}

async function scanInstagramUsers() {
    const dialog = document.querySelector('[role="dialog"]');

    if (!dialog) return;

    const profileLinks = dialog.querySelectorAll(
        'a[href*="instagram.com"], a[href^="/"]'
    );

    const observedUsers = new Map();

    for (const link of profileLinks) {
        const username = getUsernameFromLink(link);

        if (!username) continue;

        const row = findUserRow(link, username);

        if (!row) continue;

        observedUsers.set(username, {
            status: row.status,
            element: getUsernameElement(link, username)
        });
    }

    for (const [username, observed] of observedUsers) {
        await StorageManager.addOrUpdateObservedUser(
            username,
            observed.status,
            window.location.pathname
        );
    }

    const result = await chrome.storage.local.get("users");
    const users = result.users || [];

    const statusMap = new Map(
        users.map(user => [
            normalizeUsername(user.username),
            user.status
        ])
    );

    for (const [username, observed] of observedUsers) {
        const status = statusMap.get(username) || "unknown";

        updateStatusBadge(observed.element, status);
    }
}

let scanTimeout = null;
let isScanning = false;

function scheduleScan() {
    clearTimeout(scanTimeout);

    scanTimeout = setTimeout(async () => {
        if (isScanning) return;

        isScanning = true;

        try {
            await scanInstagramUsers();
        } catch (error) {
            console.error(
                "Instagram Tracker tarama hatası:",
                error
            );
        } finally {
            isScanning = false;
        }
    }, 500);
}

function shouldIgnoreMutation(mutation) {
    // Rozetin kendi içindeki değişiklikleri dikkate alma.
    if (
        mutation.target.nodeType === Node.ELEMENT_NODE &&
        mutation.target.closest(".instagram-tracker-badge")
    ) {
        return true;
    }

    if (
        mutation.target.parentElement?.closest(
            ".instagram-tracker-badge"
        )
    ) {
        return true;
    }

    // Sadece bizim eklediğimiz rozetleri göz ardı et.
    if (mutation.addedNodes.length > 0) {
        const onlyBadges = Array.from(mutation.addedNodes)
            .every(node =>
                node.nodeType === Node.ELEMENT_NODE &&
                (
                    node.matches?.(".instagram-tracker-badge") ||
                    node.querySelector?.(".instagram-tracker-badge")
                )
            );

        if (onlyBadges) return true;
    }

    return false;
}

const observer = new MutationObserver(mutations => {
    const relevantMutation = mutations.some(
        mutation => !shouldIgnoreMutation(mutation)
    );

    if (relevantMutation) {
        scheduleScan();
    }
});

if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

scheduleScan();

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.users) {
        scheduleScan();
    }
});