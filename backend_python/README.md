# DataViz AI - Python Backend

## 🚀 Kurulum

### 1. Virtual Environment Oluşturun
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 2. Paketleri Yükleyin
```bash
pip install -r requirements.txt
```

### 3. Backend'i Başlatın
```bash
python main.py
```

Backend `http://localhost:8000` adresinde çalışacak.

## 📡 API Endpoints

- `GET /health` - Sağlık kontrolü
- `POST /upload-data` - Dosya yükleme ve analiz
- `POST /suggest-plots` - Grafik önerileri
- `POST /gemini-insight` - AI içgörüleri

## 📚 API Dokümantasyonu

Backend başladıktan sonra:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔑 Gemini API Key

`.env` dosyasında `GEMINI_API_KEY` değişkenini ayarlayın.
