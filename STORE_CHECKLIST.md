# Chrome Web Store Yayın ve Beyan Kontrol Listesi

## 1. Paketleme Öncesi Kod Denetimi (Kod Temizliği)
- [ ] `test/` klasörü (örn. `instagram-test.html`) dağıtım paketinden çıkarıldı mı?
- [ ] `.gitignore`, `.git`, README veya kaynak kontrol dosyaları zip dışında bırakıldı mı?
- [ ] `console.log` hata ayıklama çıktıları ve kullanılmayan değişkenler temizlendi mi?
- [ ] Kodda herhangi bir harici `http://` veya `https://` endpoint'ine veri gönderen (`fetch`, `XMLHttpRequest`, `navigator.sendBeacon`) kod bulunmadığı doğrulandı mı?

## 2. Manifest Doğrulaması (Manifest V3)
- [ ] `manifest_version: 3` olarak ayarlandı.
- [ ] `permissions`: Yalnızca `storage` tanımlandı (İhtiyaç fazlası `cookies`, `webRequest`, `all_urls` vb. eklenmedi).
- [ ] `host_permissions`: Yalnızca `*://*.instagram.com/*` ile sınırlandırıldı.
- [ ] İkonlar eksiksiz (16x16, 32x32, 48x48, 128x128 px) ve yolları doğru tanımlandı.

## 3. Chrome Web Store Geliştirici Paneli Form Beyanları

### A. Tek Amaç İlkesi (Single Purpose)
- **Açıklama:** "This extension has a single purpose: to compare a user's Instagram followers and following lists locally to display relationship differences (e.g. unfollowers)."

### B. İzin Gerekçeleri (Permission Justifications)
- **storage:** "Required to save followers and following snapshots on the user's local browser to detect changes between scans."
- ***://*.instagram.com/*:** "Required to access the user's opened Instagram page DOM to read follower and following lists upon user request."

### C. Veri Kullanımı (Data Usage & Privacy Tab)
- **Veri Toplama Beyanı:** "No" (Harici sunuculara veri aktarımı yapılmadığı için *Does not collect or transmit user data* işaretlenmeli).
- **Kimlik Doğrulama / Şifre:** Toplanmıyor.
- **Kişisel Veri Satışı:** "I certify that I do not sell user data to third parties." kutucuğu işaretlenmeli.
- **Gizlilik Politikası Linki (Privacy Policy URL):** Hazırlanan `PRIVACY_POLICY.md` içeriğinin yayınlandığı public URL (GitHub Pages, Notion veya web sitesi linki) girilmeli.

---

## 4. Gerekli Görsel Materyaller
- [ ] **Mağaza Simgesi:** 128x128 px PNG formatında şeffaf arka planlı logo.
- [ ] **Ekran Görüntüsü (Screenshot 1):** 1280x800 veya 640x400 px - Ana arayüz ve analiz özeti.
- [ ] **Ekran Görüntüsü (Screenshot 2):** 1280x800 veya 640x400 px - Geri takip etmeyenler listesi görünümü.
- [ ] **Tanıtım Görseli (Küçük Promosyon Karosu - Opsiyonel):** 440x280 px PNG/JPG.