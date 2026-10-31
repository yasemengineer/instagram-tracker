const StorageManager = {
    VALID_STATUSES: ["pending", "requested", "following"],

    BACKUP_VERSION: 1,

    USERNAME_PATTERN: /^[a-z0-9._]{1,30}$/i,

    normalizeUsername(username) {
        if (typeof username !== "string") return "";

        return username
            .trim()
            .replace(/^@/, "")
            .toLowerCase();
    },

    isValidUsername(username) {
        return this.USERNAME_PATTERN.test(
            this.normalizeUsername(username)
        );
    },

    createHistoryEntry(status, source = "manual") {
        return {
            status,
            source,
            date: new Date().toISOString()
        };
    },

    normalizeUser(user) {
        const username = this.normalizeUsername(user.username);

        if (!this.isValidUsername(username)) {
            return null;
        }

        const status = this.VALID_STATUSES.includes(user.status)
            ? user.status
            : "pending";

        const createdAt = user.createdAt || new Date().toISOString();

        let history = Array.isArray(user.history)
            ? user.history
                .filter(entry =>
                    entry &&
                    this.VALID_STATUSES.includes(entry.status) &&
                    typeof entry.date === "string"
                )
                .map(entry => ({
                    status: entry.status,
                    source: entry.source || "manual",
                    date: entry.date
                }))
            : [];

        // Eski kayıtların geçmişi yoksa ilk durumlarını ekle.
        if (history.length === 0) {
            history.push({
                status,
                source: "migration",
                date: createdAt
            });
        }

        return {
            id: user.id || crypto.randomUUID(),
            username,
            sourcePage: typeof user.sourcePage === "string"
                ? user.sourcePage
                : "",
            status,
            createdAt,
            updatedAt: user.updatedAt || createdAt,
            history
        };
    },

    async getUsers() {
        const result = await chrome.storage.local.get("users");

        const rawUsers = Array.isArray(result.users)
            ? result.users
            : [];

        const users = rawUsers
            .map(user => this.normalizeUser(user))
            .filter(Boolean);

        // Eski kayıtların yeni veri yapısına dönüşümünü kaydet.
        if (
            JSON.stringify(rawUsers) !== JSON.stringify(users)
        ) {
            await chrome.storage.local.set({ users });
        }

        return users;
    },

    async saveUsers(users) {
        await chrome.storage.local.set({ users });
    },

    async addUser(username, sourcePage = "") {
        const normalized = this.normalizeUsername(username);

        if (!this.isValidUsername(normalized)) {
            return false;
        }

        const users = await this.getUsers();

        const exists = users.some(
            user => user.username === normalized
        );

        if (exists) return false;

        const now = new Date().toISOString();

        users.push({
            id: crypto.randomUUID(),
            username: normalized,
            sourcePage: sourcePage.trim(),
            status: "pending",
            createdAt: now,
            updatedAt: now,
            history: [
                {
                    status: "pending",
                    source: "manual",
                    date: now
                }
            ]
        });

        await this.saveUsers(users);

        return true;
    },

    async addOrUpdateObservedUser(
        username,
        observedStatus,
        sourcePage = ""
    ) {
        const normalized = this.normalizeUsername(username);

        if (
            !this.isValidUsername(normalized) ||
            !this.VALID_STATUSES.includes(observedStatus)
        ) {
            return false;
        }

        const users = await this.getUsers();

        const existingUser = users.find(
            user => user.username === normalized
        );

        if (!existingUser) {
            const now = new Date().toISOString();

            users.push({
                id: crypto.randomUUID(),
                username: normalized,
                sourcePage,
                status: observedStatus,
                createdAt: now,
                updatedAt: now,
                history: [
                    {
                        status: observedStatus,
                        source: "instagram",
                        date: now
                    }
                ]
            });

            await this.saveUsers(users);

            return true;
        }

        // Daha önce istek gönderilmiş kullanıcıyı koru.
        if (
            existingUser.status === "requested" &&
            observedStatus === "pending"
        ) {
            return false;
        }

        if (existingUser.status === observedStatus) {
            return false;
        }

        return this.setStatus(
            existingUser.id,
            observedStatus,
            "instagram"
        );
    },

    async setStatus(id, status, source = "manual") {
        if (!this.VALID_STATUSES.includes(status)) {
            return false;
        }

        const users = await this.getUsers();

        const userIndex = users.findIndex(
            user => user.id === id
        );

        if (userIndex === -1) return false;

        const user = users[userIndex];

        if (user.status === status) return false;

        const now = new Date().toISOString();

        users[userIndex] = {
            ...user,
            status,
            updatedAt: now,
            history: [
                ...user.history,
                this.createHistoryEntry(status, source)
            ]
        };

        await this.saveUsers(users);

        return true;
    },

    async deleteUser(id) {
        const users = await this.getUsers();

        const updatedUsers = users.filter(
            user => user.id !== id
        );

        await this.saveUsers(updatedUsers);
    },

    async exportBackup() {
        const users = await this.getUsers();

        return {
            app: "Instagram Tracker",
            version: this.BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            users
        };
    },

    async importBackup(backup, mode = "merge") {
        if (
            !backup ||
            backup.app !== "Instagram Tracker" ||
            !Array.isArray(backup.users)
        ) {
            throw new Error("Geçersiz Instagram Tracker yedek dosyası.");
        }

        const importedUsers = backup.users
            .map(user => this.normalizeUser(user))
            .filter(Boolean);

        if (importedUsers.length !== backup.users.length) {
            throw new Error(
                "Yedek dosyasında geçersiz kullanıcı kayıtları bulunuyor."
            );
        }

        if (mode === "replace") {
            await this.saveUsers(importedUsers);

            return importedUsers.length;
        }

        const existingUsers = await this.getUsers();

        const userMap = new Map(
            existingUsers.map(user => [user.username, user])
        );

        let addedCount = 0;

        for (const importedUser of importedUsers) {
            if (!userMap.has(importedUser.username)) {
                userMap.set(importedUser.username, importedUser);
                addedCount++;
            }
        }

        await this.saveUsers(Array.from(userMap.values()));

        return addedCount;
    }
};