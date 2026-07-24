# Topical Authority — automate.codev.id

## Role and boundary

This domain supports users of Automate Studio, an authenticated interface for turning permitted media links into files, transcripts, captions, clips, images, and multi-step outputs. The knowledge plan explains preparation, tool choice, settings, result handling, and troubleshooting. It does not promise universal source compatibility, guaranteed AI accuracy, permanent storage, platform-rule exceptions, or rights to download, transform, or publish third-party material.

## Context used

- Homepage H1: **Turn media links into useful files.** Supporting copy emphasizes pasting a video or audio link, choosing an output, and avoiding technical setup.
- Visible feature groups are convert/trim media, useful outputs such as transcripts and download links, and readiness checks before longer jobs.
- The dashboard exposes 26 task labels in seven groups: Quick tools, Audio and text, Video editing, Captions, Images and pages, Creative recipes, and History.
- Representative tools include file details, save/upload from link, MP3 and format conversion, transcription, audio/video joining, silence, trim/cut, thumbnails, captions, subtitle style files, image-to-video, webpage screenshots, AI clip planning, and job status.
- The repository has 63 tracked files, three page routes (`/`, `/sign-in`, `/sign-up`), and 23 API route files: media 7, video 5, toolkit 4, AI 2, image 2, audio 1, storage 1, and health 1.
- No sitemap or robots file is tracked, so the route-file inventory is the compact route evidence. No existing editorial corpus was found.

## Ignored template noise

- Authentication components, middleware, tests, styles, icons, framework configuration, and deployment notes were counted as implementation context but not treated as editorial coverage.
- API implementation bodies and backend infrastructure details were excluded; visible tool names and route-family counts were sufficient to define the taxonomy.
- Generated build output, dependencies, environment values, and local deployment artifacts are excluded by the repository and were not inspected.

## Topical map

| Topic ID | Parent topic | Reader outcome | Boundary | Article target |
|---|---|---|---|---:|
| AUT-01 | Tautan sumber, izin, dan privasi | Memilih tautan yang dapat diproses sambil menjaga izin, cookie, dan data sensitif. | Membahas kesiapan dan hak atas sumber; cara menyimpan hasil dimiliki AUT-03 dan tidak menjanjikan bypass pembatasan platform. | 6 |
| AUT-02 | Pemeriksaan file dan kesiapan tugas | Membaca metadata, memeriksa kesiapan aplikasi, dan menentukan langkah sebelum proses berat. | Berfokus pada diagnosis awal; format konversi dimiliki AUT-04 dan pemantauan pekerjaan berjalan dimiliki AUT-14. | 6 |
| AUT-03 | Unduh, unggah, dan pengelolaan hasil | Memahami alur membawa sumber ke aplikasi, membuka hasil, dan mengelola file keluaran. | Berfokus pada perpindahan serta hasil file; izin sumber dimiliki AUT-01 dan perubahan format dimiliki AUT-04. | 6 |
| AUT-04 | Format media dan konversi | Memilih format keluaran, memahami trade-off dasar, dan menghindari konversi yang tidak perlu. | Membahas container/format lintas media; pengaturan audio khusus dimiliki AUT-05 dan editing video dimiliki AUT-09/AUT-10. | 6 |
| AUT-05 | Audio, MP3, dan kualitas suara | Mengekstrak atau mengonversi audio dengan pilihan bitrate, sample rate, dan tujuan penggunaan yang masuk akal. | Khusus kualitas dan ekstraksi audio; perakitan audio dimiliki AUT-08 dan transkripsi dimiliki AUT-06. | 6 |
| AUT-06 | Transkripsi dan paket teks | Menyiapkan sumber ucapan, memilih keluaran teks/subtitel, dan meninjau hasil transkripsi. | Berfokus pada speech-to-text dan koreksi; pembakaran serta gaya caption dimiliki AUT-07. | 6 |
| AUT-07 | Subtitle, caption, dan keterbacaan | Membuat, menata, dan memeriksa subtitle atau caption untuk berbagai kebutuhan penonton. | Membahas teks yang tampil bersama video; pembuatan transkrip dimiliki AUT-06 dan pemotongan video dimiliki AUT-09. | 6 |
| AUT-08 | Editing audio dan perakitan podcast | Menggabungkan audio, menambah jeda, menormalkan format kerja, dan memeriksa hasil episode. | Khusus urutan dan struktur audio; kualitas encoding dimiliki AUT-05 dan video gabungan dimiliki AUT-10. | 6 |
| AUT-09 | Trim, cut, dan pemilihan segmen video | Memilih rentang waktu dan menghasilkan potongan video yang tepat. | Berfokus pada satu atau beberapa segmen dari sumber; penggabungan banyak klip dimiliki AUT-10 dan pemilihan AI dimiliki AUT-13. | 6 |
| AUT-10 | Penggabungan video dan highlight reel | Mengurutkan, menggabungkan, dan memeriksa beberapa klip menjadi satu hasil. | Berfokus pada assembly lintas klip; pemilihan rentang awal dimiliki AUT-09 dan caption dimiliki AUT-07. | 6 |
| AUT-11 | Thumbnail, screenshot, dan image-to-video | Membuat aset visual dari video, halaman yang diizinkan, atau gambar sumber. | Khusus aset visual dan preview; editing klip video dimiliki AUT-09 dan workflow short lengkap dimiliki AUT-12. | 6 |
| AUT-12 | Workflow short-form dan repurposing | Menyusun urutan kerja untuk short bercaption, transcript pack, batch caption, dan preview halaman. | Membahas orkestrasi manual dari tool yang terlihat; keputusan tiap tool tetap dimiliki topik spesialis dan bukan janji one-click automation. | 6 |
| AUT-13 | AI Clip Factory dan pengarahan kreatif | Menyiapkan transkrip bertimestamp, konteks brand, dan kriteria review untuk klip yang dipilih AI. | Khusus perencanaan klip berbantuan AI; cut manual dimiliki AUT-09 dan hasil AI selalu memerlukan review manusia. | 6 |
| AUT-14 | Batch, status pekerjaan, dan troubleshooting | Menjalankan banyak tautan, memantau pekerjaan panjang, membaca kegagalan, dan mencoba ulang dengan aman. | Berfokus pada eksekusi dan pemulihan; pemeriksaan sumber awal dimiliki AUT-02 dan detail kreatif dimiliki topik tool terkait. | 6 |

## Internal-link rule

Setiap artikel menaut ke hub topiknya dan ke langkah berikutnya dalam alur sumber → pemeriksaan → transformasi → review → hasil. Artikel resep menaut ke artikel pengaturan tool spesialis, artikel error menaut ke pemeriksaan sumber serta status pekerjaan, dan artikel AI menaut ke review manusia. Tautan ke aplikasi hanya ditempatkan ketika pembaca sudah memahami izin, input, output, dan batas kemampuan yang relevan.

## First publication wave

Gelombang pertama berisi 12 aset: `AUT-01-01`, `AUT-01-02`, `AUT-02-01`, `AUT-02-02`, `AUT-03-01`, `AUT-04-01`, `AUT-06-01`, `AUT-07-01`, `AUT-09-01`, `AUT-12-01`, `AUT-13-01`, dan `AUT-14-01`. Cluster ini membentuk jalur dasar dari sumber yang diizinkan, pemeriksaan kesiapan, pemilihan transformasi, review hasil, sampai pemantauan pekerjaan tanpa mengasumsikan bahwa setiap tautan atau keluaran selalu didukung.
