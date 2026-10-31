### 2. PRIVACY_POLICY.md

```markdown
# Privacy Policy for Instagram Unfollowers & Followers Tracker

**Son Güncelleme:** 31 Ekim 2026

Bu Gizlilik Politikası, **Instagram Unfollowers & Followers Tracker** ("Uzantı") tarafından kullanıcı verilerinin nasıl ele alındığını açıklamaktadır. Uzantı, kullanıcı gizliliğini en üst düzeyde korumak üzere **Local-First** (Yalnızca Yerel) mimari ile geliştirilmiştir.

---

### 1. Toplanan / İşlenen Veriler

Uzantı yalnızca kullanıcının talebi doğrultusunda şu verileri işler:
- Instagram kullanıcı adları ve profil kimlikleri (sadece takip edilen / takipçi listeleri).
- Taramalar arasındaki farkları (yeni takipçiler, takipten çıkanlar) tespit etmek için oluşturulan zaman damgalı yerel anlık görüntüler (snapshots).

### 2. Verilerin Saklanması ve Aktarımı

- **Sunucuya Aktarım Yok:** Uzantı, toplanan veya işlenen hiçbir veriyi harici bir sunucuya, bulut veritabanına veya üçüncü taraf analiz aracına göndermez.
- **Yerel Depolama:** Tüm analiz ve takip verileri yalnızca kullanıcının kendi cihazında, Google Chrome'un yerel depolama mekanizması olan `chrome.storage.local` üzerinde şifrelenmemiş/düz yerel kayıt olarak saklanır.
- **Hesap Bilgileri:** Uzantı Instagram şifrenizi, e-posta adresinizi, özel mesajlarınızı veya ödeme bilgilerinizi asla istemez, okumaz veya kaydetmez.

### 3. Kullanılan İzinlerin Amacı (Permissions Justification)

- `storage`: Takipçi listelerinin sonraki taramalarla karşılaştırılabilmesi için yerel olarak saklanması.
- `instagram.com` erişimi: Yalnızca kullanıcının açıkça başlattığı tarama esnasında Instagram web sayfası üzerindeki takipçi listesini okuyabilmek.

### 4. Üçüncü Taraf Hizmetleri

Uzantı; Google Analytics, Mixpanel, Firebase veya reklam ağları gibi herhangi bir üçüncü taraf izleme veya telemetri servisi barındırmaz.

### 5. Verilerin Silinmesi

Kullanıcı, uzantı arayüzündeki verileri temizleme butonunu kullanarak ya da uzantıyı Chrome üzerinden kaldırarak (`chrome://extensions`) cihazda depolanan tüm yerel verileri anında ve kalıcı olarak silebilir.

### 6. İletişim

Gizlilik politikasıyla ilgili soru veya geri bildirimleriniz için geliştirici iletişim kanalları üzerinden ulaşabilirsiniz.
