# SECURITY & MAINTENANCE LOG

Dokumentasi perubahan dan perbaikan keamanan yang telah dilakukan pada proyek AI-MAINTENANCE.

## Change Log - [2026-01-02]

### Security Hardening (Pengerasan Keamanan)
*   **[13:15] Credential Leak Prevention**: Menambahkan `.env` ke `.gitignore` untuk mencegah kebocoran API Key dan Secret.
*   **[13:20] Session Guard**: Menambahkan waktu kedaluwarsa token (8 jam) pada `api/_session.js`.
*   **[13:25] Anti-Brute Force**: Mengimplementasikan *Randomized Delay* (500ms - 1000ms) pada `api/login.js` untuk memperlambat serangan tebak password.
*   **[13:30] Anti-XSS**: Sanitasi input user pada Frontend untuk mencegah serangan Cross-Site Scripting.
*   **[13:35] Secure Signing**: Implementasi `SESSION_SECRET` acak untuk penandatanganan token yang lebih kuat.

### UI/UX & Formatting (Tampilan)
*   **[13:40] FOUC Fix**: Memperbaiki *Flash of Unauthenticated Content* dengan metode *Hard-Blocking* (`display: none` pada body) yang dibuka oleh `auth-guard.js`.
*   **[13:45] Chat Interface**: Memperlebar container chat menjadi **95%** layar untuk visibilitas maksimal.
*   **[13:48] Avatar Repair**: Memberikan *Safe Zone* (Margin 50px) pada bubble chat agar avatar User dan AI tidak terpotong.

### Refactoring (Struktur Kode)
*   **[13:50] JS Modularization**: Memisahkan logika JavaScript inline ke file terpisah (`js/app.js` dan `js/auth-guard.js`).
*   **[13:55] CSS Separation**: Memecah CSS menjadi dua file modular:
    *   `css/style.css`: Layout utama dan tema global.
    *   `css/chat.css`: Komponen spesifik chat (bubble, input, animasi).

---
> *"Security is not a product, but a process."*

**Last Updated:** 2026-01-02 13:58:00
**Signed by:** -versaagonon
