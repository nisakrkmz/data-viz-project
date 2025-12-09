# DataViz AI - R Backend API

## 📋 Genel Bakış

Bu backend, React frontend için veri analizi, grafik önerileri ve AI destekli içgörüler sağlayan bir R Plumber API'sidir.

## 🏗️ Proje Yapısı

```
backend/
├── plumber.R              # Ana API router
├── run_server.R           # Server başlatma scripti
├── .env                   # Environment variables
├── R/                     # R modülleri
│   ├── data_processor.R   # Veri okuma ve analiz
│   ├── chart_recommender.R # Grafik öneri motoru
│   ├── gemini_client.R    # Gemini API entegrasyonu
│   └── utils.R            # Yardımcı fonksiyonlar
├── uploads/               # Yüklenen dosyalar (geçici)
└── logs/                  # Log dosyaları
```

## 🚀 Kurulum

### Gereksinimler

- R >= 4.0.0
- RStudio (önerilen)

### Paket Kurulumu

Server ilk çalıştırıldığında gerekli paketler otomatik yüklenecektir. Manuel yüklemek için:

```r
install.packages(c(
  "plumber",
  "jsonlite",
  "logger",
  "readr",
  "readxl",
  "data.table",
  "dplyr",
  "lubridate",
  "httr2"
))
```

### API Key Yapılandırması

`.env` dosyasında Gemini API key'inizi ayarlayın:

```
GEMINI_API_KEY=your_api_key_here
```

## ▶️ Server'ı Başlatma

```r
# R console veya RStudio'da
source("run_server.R")
```

Server başladığında:
- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/__docs__/`

## 📡 API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Açıklama:** Server sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-06T10:30:00Z",
  "version": "1.0.0",
  "r_version": "R version 4.3.0"
}
```

---

### 2. Upload Data

**Endpoint:** `POST /upload-data`

**Açıklama:** CSV veya Excel dosyası yükle ve analiz et

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (CSV veya Excel dosyası)

**Response:**
```json
{
  "error": false,
  "filename": "sales_data.csv",
  "n_rows": 1000,
  "n_cols": 5,
  "columns": [
    {
      "name": "price",
      "type": "numeric",
      "unique_count": 120,
      "na_count": 3,
      "summary": {
        "min": 10,
        "max": 300,
        "mean": 85.2,
        "median": 74.5,
        "sd": 45.3
      }
    },
    {
      "name": "category",
      "type": "categorical",
      "unique_count": 5,
      "na_count": 0,
      "value_counts": {
        "A": 200,
        "B": 300,
        "C": 500
      }
    }
  ],
  "has_time_series": false,
  "has_geographic": false,
  "sample_data": [...]
}
```

**Desteklenen Formatlar:**
- `.csv`
- `.xlsx`
- `.xls`

---

### 3. Suggest Plots

**Endpoint:** `POST /suggest-plots`

**Açıklama:** Veri yapısına göre grafik önerileri üret

**Request:**
```json
{
  "columns": [
    {
      "name": "price",
      "type": "numeric"
    },
    {
      "name": "category",
      "type": "categorical"
    }
  ],
  "n_rows": 1000,
  "n_cols": 2,
  "has_time_series": false
}
```

**Response:**
```json
{
  "recommended": [
    {
      "type": "grouped_bar",
      "score": 0.95,
      "reason": "Kategorilere göre sayısal değerleri karşılaştırmak için",
      "variables": {
        "x": "category",
        "y": "price"
      },
      "ggplot_code": "ggplot(df, aes(x = category, y = price)) +\n  geom_col(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = 'price by category')"
    },
    {
      "type": "boxplot_grouped",
      "score": 0.85,
      "reason": "Kategorilere göre dağılım analizi",
      "variables": {
        "x": "category",
        "y": "price"
      },
      "ggplot_code": "..."
    }
  ],
  "total_count": 3
}
```

**Grafik Öneri Mantığı (data-to-viz):**

| Veri Yapısı | Önerilen Grafikler |
|-------------|-------------------|
| 1 numeric | histogram, boxplot, density |
| 1 categorical | bar, pie |
| 2 numeric | scatter, hexbin |
| 2 numeric + time series | line, area |
| 1 numeric + 1 categorical | grouped_bar, boxplot_grouped, violin |
| 3+ numeric | bubble (scatter with size) |
| Multiple time series | multi_line |

---

### 4. Gemini Insight

**Endpoint:** `POST /gemini-insight`

**Açıklama:** Google Gemini AI ile veri analizi ve içgörüler

**Request:**
```json
{
  "columns": [...],
  "n_rows": 1000,
  "n_cols": 5,
  "has_time_series": true,
  "has_geographic": false
}
```

**Response:**
```json
{
  "error": false,
  "analysis_text": "Bu veri seti aylık satış verilerini içeriyor. Zaman içinde artan bir trend gözlemleniyor. En yüksek satışlar Aralık ayında gerçekleşmiş...",
  "suggested_chart_types": [
    "line",
    "area",
    "bar"
  ],
  "confidence": 0.92,
  "raw_response": "..."
}
```

**Not:** Gemini API key `.env` dosyasında tanımlanmalıdır.

---

## 🔧 Yapılandırma

### Environment Variables (.env)

```bash
# Gemini API
GEMINI_API_KEY=your_key_here

# Server
API_PORT=8000
API_HOST=0.0.0.0

# Upload
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/api.log

# CORS
CORS_ALLOW_ORIGIN=*
```

## 📊 Veri Tipleri

Backend şu veri tiplerini tanır:

- **numeric**: Sayısal değerler
- **categorical**: Kategorik/string değerler
- **date**: Tarih/zaman değerleri
- **boolean**: TRUE/FALSE değerleri

## 🎨 ggplot2 Kod Şablonları

Her grafik önerisi ile birlikte kullanıma hazır ggplot2 kodu döner:

```r
# Örnek: Histogram
ggplot(df, aes(x = price)) +
  geom_histogram(bins = 30, fill = '#667eea', alpha = 0.7) +
  theme_minimal() +
  labs(title = 'Distribution of price')
```

Placeholder'lar:
- `df`: Veri frame'iniz
- `price`, `category` vb.: Gerçek sütun isimleri

## 🐛 Hata Yönetimi

Tüm endpoint'ler standart hata formatı döner:

```json
{
  "error": true,
  "message": "Hata açıklaması",
  "code": "ERROR_CODE"
}
```

## 📝 Logging

Loglar `logs/api.log` dosyasına yazılır:

```
2024-12-06 10:30:15 INFO Received file upload request
2024-12-06 10:30:16 INFO Processing file: sales_data.csv
2024-12-06 10:30:17 INFO File processed successfully
```

## 🔒 Güvenlik

- API key'ler environment variable'larda saklanır
- Yüklenen dosyalar geçici dizinde tutulur
- CORS yapılandırması aktif
- File upload size limiti var

## 🧪 Test

### cURL ile Test

```bash
# Health check
curl http://localhost:8000/health

# Upload file
curl -X POST http://localhost:8000/upload-data \
  -F "file=@data.csv"

# Get chart suggestions
curl -X POST http://localhost:8000/suggest-plots \
  -H "Content-Type: application/json" \
  -d '{"columns": [{"name": "x", "type": "numeric"}], "n_rows": 100}'
```

### R ile Test

```r
library(httr)

# Upload file
response <- POST(
  "http://localhost:8000/upload-data",
  body = list(file = upload_file("data.csv"))
)

content(response)
```

## 📚 Referanslar

- [Plumber Documentation](https://www.rplumber.io/)
- [data-to-viz.com](https://www.data-to-viz.com/) - Grafik seçim rehberi
- [R Graph Gallery](https://r-graph-gallery.com/) - ggplot2 örnekleri
- [Google Gemini API](https://ai.google.dev/docs)

## 🤝 Frontend Entegrasyonu

Frontend'den örnek istek:

```javascript
// Upload data
const formData = new FormData();
formData.append('file', file);

const response = await fetch('http://localhost:8000/upload-data', {
  method: 'POST',
  body: formData
});

const data = await response.json();

// Get chart suggestions
const suggestions = await fetch('http://localhost:8000/suggest-plots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

---

**Geliştirici:** DataViz AI Team  
**Versiyon:** 1.0.0  
**Son Güncelleme:** Aralık 2024
