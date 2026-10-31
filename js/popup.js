const usernameInput = document.getElementById("usernameInput");
const sourceInput = document.getElementById("sourceInput");
const addButton = document.getElementById("addButton");

const bulkInput = document.getElementById("bulkInput");
const importButton = document.getElementById("importButton");
const fileInput = document.getElementById("fileInput");

const backupButton = document.getElementById("backupButton");
const restoreInput = document.getElementById("restoreInput");

const searchInput = document.getElementById("searchInput");
const userList = document.getElementById("userList");
const emptyMessage = document.getElementById("emptyMessage");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const requestedCount = document.getElementById("requestedCount");
const followingCount = document.getElementById("followingCount");
const visibleCount = document.getElementById("visibleCount");

const exportButton = document.getElementById("exportButton");

let activeFilter = "all";

const STATUS_LABELS = {
    pending: "Bekliyor",
    requested: "İstek gönderildi",
    following: "Takip ediliyor"
};

const HISTORY_SOURCE_LABELS = {
    manual: "Manuel değişiklik",
    instagram: "Instagram üzerinden algılandı",
    migration: "Eski kayıttan aktarıldı"
};

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Bilinmeyen tarih";
    }

    return date.toLocaleString("tr-TR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

async function renderUsers() {
    const users = await StorageManager.getUsers();

    totalCount.textContent = users.length;

    pendingCount.textContent = users.filter(
        user => user.status === "pending"
    ).length;

    requestedCount.textContent = users.filter(
        user => user.status === "requested"
    ).length;

    followingCount.textContent = users.filter(
        user => user.status === "following"
    ).length;

    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.includes(searchTerm) ||
            (user.sourcePage || "").toLowerCase().includes(searchTerm);

        const matchesFilter =
            activeFilter === "all" ||
            user.status === activeFilter;

        return matchesSearch && matchesFilter;
    });

    userList.innerHTML = "";

    visibleCount.textContent = `${filteredUsers.length} kayıt`;

    emptyMessage.style.display =
        filteredUsers.length === 0 ? "block" : "none";

    emptyMessage.textContent = users.length === 0
        ? "Henüz kullanıcı eklenmedi."
        : "Bu filtrede kullanıcı bulunamadı.";

    for (const user of filteredUsers) {
        const item = createElement("div", "user-item");

        const info = createElement("div", "user-info");

        const username = createElement(
            "strong",
            "",
            "@" + user.username
        );

        const source = createElement(
            "small",
            "",
            user.sourcePage || "Kaynak belirtilmedi"
        );

        info.append(username, source);

        const actions = createElement("div", "user-actions");

        // Durum seçimi
        const statusSelect = createElement(
            "select",
            `status-select ${user.status}`
        );

        for (const [value, label] of Object.entries(STATUS_LABELS)) {
            const option = createElement("option", "", label);

            option.value = value;
            option.selected = user.status === value;

            statusSelect.appendChild(option);
        }

        statusSelect.title = "Kullanıcı durumunu değiştir";

        statusSelect.addEventListener("change", async () => {
            statusSelect.disabled = true;

            await StorageManager.setStatus(
                user.id,
                statusSelect.value,
                "manual"
            );

            await renderUsers();
        });

        // Geçmiş butonu
        const historyButton = createElement(
            "button",
            "history-button",
            "Geçmiş"
        );

        historyButton.addEventListener("click", () => {
            const historyPanel = item.querySelector(".history-panel");

            if (!historyPanel) return;

            historyPanel.classList.toggle("visible");

            historyButton.textContent =
                historyPanel.classList.contains("visible")
                    ? "Gizle"
                    : "Geçmiş";
        });

        // Silme butonu
        const deleteButton = createElement(
            "button",
            "delete-button",
            "Sil"
        );

        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                `@${user.username} kullanıcısını silmek istiyor musun?`
            );

            if (!confirmed) return;

            await StorageManager.deleteUser(user.id);

            await renderUsers();
        });

        actions.append(
            statusSelect,
            historyButton,
            deleteButton
        );

        item.append(info, actions);

        // Durum geçmişi
        const historyPanel = createElement(
            "div",
            "history-panel"
        );

        const historyTitle = createElement(
            "strong",
            "history-title",
            "Durum geçmişi"
        );

        historyPanel.appendChild(historyTitle);

        const historyEntries = [...user.history].reverse();

        for (const entry of historyEntries) {
            const historyItem = createElement(
                "div",
                "history-entry"
            );

            const statusLabel = createElement(
                "span",
                "history-status",
                STATUS_LABELS[entry.status] || entry.status
            );

            const sourceLabel = createElement(
                "small",
                "history-source",
                HISTORY_SOURCE_LABELS[entry.source] || entry.source
            );

            const dateLabel = createElement(
                "small",
                "history-date",
                formatDate(entry.date)
            );

            historyItem.append(
                statusLabel,
                sourceLabel,
                dateLabel
            );

            historyPanel.appendChild(historyItem);
        }

        item.appendChild(historyPanel);

        userList.appendChild(item);
    }
}

// CSV metnini virgül ve tırnak kurallarına göre ayrıştır.
function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
            field += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
            row.push(field);
            field = "";
        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {
            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            row.push(field);

            if (row.some(value => value.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    row.push(field);

    if (row.some(value => value.trim() !== "")) {
        rows.push(row);
    }

    return rows;
}

// Manuel kullanıcı ekleme
addButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
        alert("Lütfen bir kullanıcı adı gir.");
        return;
    }

    const added = await StorageManager.addUser(
        username,
        sourceInput.value
    );

    if (!added) {
        alert("Kullanıcı adı geçersiz veya zaten kayıtlı.");
        return;
    }

    usernameInput.value = "";
    sourceInput.value = "";

    await renderUsers();
});

usernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addButton.click();
    }
});

// Toplu kullanıcı aktarımı
importButton.addEventListener("click", async () => {
    const text = bulkInput.value;

    if (!text.trim()) {
        alert("Lütfen aktarılacak kullanıcı adlarını gir.");
        return;
    }

    const usernames = text
        .split(/[\n,;]+/)
        .map(item => item.trim())
        .filter(Boolean);

    let addedCount = 0;

    for (const username of usernames) {
        const added = await StorageManager.addUser(
            username,
            sourceInput.value
        );

        if (added) addedCount++;
    }

    bulkInput.value = "";

    await renderUsers();

    alert(`${addedCount} yeni kullanıcı eklendi.`);
});

// CSV veya TXT dosyası seçme
fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];

    if (!file) return;

    try {
        const text = await file.text();

        if (file.name.toLowerCase().endsWith(".csv")) {
            const rows = parseCSV(text);

            if (rows.length === 0) {
                throw new Error("CSV dosyası boş.");
            }

            const headers = rows[0].map(
                value => value.trim().toLowerCase()
            );

            const usernameIndex = headers.indexOf("username");
            const sourceIndex = headers.indexOf("sourcepage");
            const statusIndex = headers.indexOf("status");

            const hasHeader = usernameIndex !== -1;

            let addedCount = 0;
            let updatedCount = 0;

            const dataRows = hasHeader ? rows.slice(1) : rows;

            for (const row of dataRows) {
                const username = row[
                    hasHeader ? usernameIndex : 0
                ]?.trim();

                if (!username) continue;

                const existing = (
                    await StorageManager.getUsers()
                ).find(user =>
                    user.username === StorageManager.normalizeUsername(username)
                );

                if (existing) {
                    if (
                        hasHeader &&
                        statusIndex !== -1 &&
                        StorageManager.VALID_STATUSES.includes(
                            row[statusIndex]?.trim()
                        )
                    ) {
                        const updated = await StorageManager.setStatus(
                            existing.id,
                            row[statusIndex].trim(),
                            "manual"
                        );

                        if (updated) updatedCount++;
                    }

                    continue;
                }

                const source = sourceIndex !== -1
                    ? row[sourceIndex] || ""
                    : sourceInput.value;

                const added = await StorageManager.addUser(
                    username,
                    source
                );

                if (added) {
                    addedCount++;

                    const newUser = (
                        await StorageManager.getUsers()
                    ).find(user =>
                        user.username === StorageManager.normalizeUsername(username)
                    );

                    const importedStatus = statusIndex !== -1
                        ? row[statusIndex]?.trim()
                        : null;

                    if (
                        newUser &&
                        StorageManager.VALID_STATUSES.includes(importedStatus) &&
                        importedStatus !== "pending"
                    ) {
                        await StorageManager.setStatus(
                            newUser.id,
                            importedStatus,
                            "manual"
                        );
                    }
                }
            }

            await renderUsers();

            alert(
                `${addedCount} kullanıcı eklendi.\n${updatedCount} kullanıcının durumu güncellendi.`
            );
        } else {
            bulkInput.value = text;
            alert("Kullanıcı listesi metin alanına aktarıldı.");
        }
    } catch (error) {
        alert("Dosya okunamadı: " + error.message);
    } finally {
        fileInput.value = "";
    }
});

// JSON yedekleme
backupButton.addEventListener("click", async () => {
    const backup = await StorageManager.exportBackup();

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "instagram-tracker-backup.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// JSON yedeğini geri yükleme
restoreInput.addEventListener("change", async () => {
    const file = restoreInput.files[0];

    if (!file) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        const mode = confirm(
            "Mevcut kayıtları koruyarak yedekten yeni kullanıcılar eklensin mi?\n\n" +
            "Tamam: Birleştir\n" +
            "İptal: Mevcut kayıtları yedekle değiştir"
        )
            ? "merge"
            : "replace";

        const confirmed = confirm(
            mode === "replace"
                ? "DİKKAT: Mevcut kayıtların tamamı yedek dosyasındaki kayıtlarla değiştirilecek. Devam edilsin mi?"
                : "Yedek dosyasındaki kullanıcılar mevcut listeye eklensin mi?"
        );

        if (!confirmed) return;

        const count = await StorageManager.importBackup(
            backup,
            mode
        );

        await renderUsers();

        alert(
            mode === "merge"
                ? `${count} yeni kullanıcı geri yüklendi.`
                : `${count} kullanıcı geri yüklendi.`
        );
    } catch (error) {
        alert("Yedek yüklenemedi: " + error.message);
    } finally {
        restoreInput.value = "";
    }
});

// CSV dışa aktarma
exportButton.addEventListener("click", async () => {
    const users = await StorageManager.getUsers();

    if (users.length === 0) {
        alert("Dışa aktarılacak kullanıcı bulunamadı.");
        return;
    }

    const headers = [
        "username",
        "sourcePage",
        "status",
        "createdAt",
        "updatedAt"
    ];

    const rows = users.map(user => [
        user.username,
        user.sourcePage || "",
        user.status,
        user.createdAt,
        user.updatedAt
    ]);

    const escapeCSV = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "instagram-tracker-users.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Arama
searchInput.addEventListener("input", renderUsers);

// Filtreler
document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".filter").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        activeFilter = button.dataset.filter;

        renderUsers();
    });
});

// Diğer pencerelerdeki değişiklikleri yansıt.
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.users) {
        renderUsers();
    }
});

renderUsers();