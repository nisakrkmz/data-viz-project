# DataViz 📊

**DataViz**, veri görselleştirme süreçlerini democratize eden, yapay zeka destekli akıllı bir analiz platformudur. Kullanıcıların Excel/CSV dosyalarını yükleyerek saniyeler içinde zengin görselleştirmeler elde etmesini sağlar. Ayrıca, **Antigravity Manager** AI asistanı ile süreç boyunca rehberlik eder ve yüklenen grafik görsellerini analiz ederek (Image-to-Chart) en uygun grafik türünü önerir.

Bu proje, **Samsun Üniversitesi Yazılım Mühendisliği Bölümü Yazılım Gerçekleme ve Test** dersi kapsamında **Dr. Öğr. Üyesi Nurettin Şenyer**'in başlattığı challenge için geliştirilmiştir.

## 🚀 Özellikler

### 📊 Geniş Grafik Kütüphanesi (15+ Tür)
Veri setinizin yapısına göre otomatik olarak önerilen ve render edilen 16 farklı grafik türü:

**✅ Tam Fonksiyonel (12 Grafik)**
*   **Bar & Horizontal Bar Charts:** Kategorik karşılaştırmalar için.
*   **Line & Multi-line Charts:** Zaman serisi ve trend analizleri için.
*   **Area Chart:** Hacimsel değişimler için.
*   **Scatter Plot:** Değişkenler arası ilişki analizi.
*   **Pie & Donut Charts:** Oransal dağılımlar.
*   **Histogram:** Frekans dağılımı analizi (Görsel yükleme ile otomatik tespit edilir!).
*   **Box Plot:** İstatistiksel dağılım ve aykırı değer analizi.
*   **Stacked & Grouped Bar Charts:** Çok boyutlu karşılaştırmalar.

**⚠️ Deneysel / Ek Özellikler**
*   **Bubble Chart:** 3 boyutlu veri analizi.
*   **Violin Plot:** Yoğunluk bazlı dağılım.
*   **Heatmap & Radar Chart:** (Geliştirme aşamasında)

### 🧠 AI Destekli Analiz & İletişim
*   **Antigravity Manager:** Veri analizi konusunda uzmanlaşmış AI chatbot (Gemini 2.5 Flash destekli).
*   **Akıllı Grafik Önerisi:** Yüklenen veriyi analiz eder (sayısal/kategorik sütunlar, zaman serisi vb.) ve en uygun grafikleri "En Uygun", "Uygun", "Alternatif" olarak derecelendirir.
*   **Görselden Grafik Tanıma:** Elinizdeki bir grafik görselini yükleyin, AI türünü tanısın ve veriniz için uygunluğunu kontrol edip otomatik olarak çizsin.

### 🛠 Teknoloji Yığını
Proje, hibrit bir mimari üzerine kurulmuştur:
*   **Frontend:** React, TypeScript, Tailwind CSS, Recharts, Lucide React
*   **Backend (Orchestration & AI):** Python (FastAPI), Google Gemini 2.5 Flash API
*   **Backend (Data Viz Engine):** R (Plumber, ggplot2) - *Yüksek kaliteli istatistiksel grafikler için*

## 📦 Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
*   Node.js (v18+)
*   Python (3.9+)
*   R (4.0+)

### Adım 1: Depoyu Klonlayın
```bash
git clone https://github.com/nisakrkmz/data-viz-project.git
cd data-viz-project
```

### Adım 2: Frontend Kurulumu
```bash
cd frontend_new
npm install
npm run dev
```

### Adım 3: Python Backend Kurulumu
```bash
cd backend_python
python -m venv venv
# Windows için:
venv\Scripts\activate
# Mac/Linux için:
# source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Adım 4: R Backend Kurulumu
R konsolunda veya terminalde:
```bash
Rscript backend/run_server.R
```

Tarayıcınızda **http://localhost:5173** adresine giderek uygulamayı kullanmaya başlayabilirsiniz!

## 📝 Lisans
MIT License
