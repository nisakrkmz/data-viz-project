"""
DataViz AI - Python Backend
FastAPI backend for data visualization with Gemini AI integration
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import os
from datetime import datetime
import google.generativeai as genai

# Initialize FastAPI
app = FastAPI(
    title="DataViz AI Backend",
    description="Python backend for intelligent data visualization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDb9AAtZ1L5dEjLfPmj27PhBLxPS1iU3Xs")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Models
class ColumnInfo(BaseModel):
    name: str
    type: str
    unique_count: int
    na_count: int
    summary: Optional[Dict[str, Any]] = None

class DataAnalysis(BaseModel):
    error: bool = False
    filename: Optional[str] = None
    n_rows: Optional[int] = None
    n_cols: Optional[int] = None
    columns: Optional[List[ColumnInfo]] = None
    has_time_series: Optional[bool] = None
    has_geographic: Optional[bool] = None
    sample_data: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None

class ChartRecommendation(BaseModel):
    type: str
    score: float
    reason: str
    priority: str
    title: str
    description: str
    use_case: str

# Helper Functions
def analyze_column(df: pd.DataFrame, col_name: str) -> Dict[str, Any]:
    """Analyze a single column"""
    col = df[col_name]
    
    result = {
        "name": col_name,
        "unique_count": int(col.nunique()),
        "na_count": int(col.isna().sum())
    }
    
    # Determine type and add statistics
    if pd.api.types.is_numeric_dtype(col):
        result["type"] = "numeric"
        result["summary"] = {
            "min": float(col.min()) if not col.isna().all() else None,
            "max": float(col.max()) if not col.isna().all() else None,
            "mean": float(col.mean()) if not col.isna().all() else None,
            "median": float(col.median()) if not col.isna().all() else None,
            "std": float(col.std()) if not col.isna().all() else None
        }
    elif pd.api.types.is_datetime64_any_dtype(col):
        result["type"] = "date"
        result["summary"] = {
            "min_date": str(col.min()) if not col.isna().all() else None,
            "max_date": str(col.max()) if not col.isna().all() else None
        }
    elif pd.api.types.is_bool_dtype(col):
        result["type"] = "boolean"
        result["summary"] = {
            "true_count": int(col.sum()) if not col.isna().all() else 0,
            "false_count": int((~col).sum()) if not col.isna().all() else 0
        }
    else:
        result["type"] = "categorical"
        if result["unique_count"] <= 50:
            value_counts = col.value_counts().to_dict()
            result["value_counts"] = {str(k): int(v) for k, v in value_counts.items()}
    
    return result

def recommend_charts_from_data(columns: List[Dict[str, Any]], has_time_series: bool) -> List[Dict[str, Any]]:
    """Recommend charts with specific variable suggestions based on data structure"""
    recommendations = []
    
    numeric_cols = [c for c in columns if c["type"] == "numeric"]
    categorical_cols = [c for c in columns if c["type"] == "categorical"]
    date_cols = [c for c in columns if c["type"] == "date"]
    
    n_numeric = len(numeric_cols)
    n_categorical = len(categorical_cols)
    n_total = len(columns)
    
    # Check if data is suitable for visualization
    if n_total == 0:
        return [{
            "type": "error",
            "score": 0,
            "reason": "Veri seti boş - görselleştirme yapılamaz",
            "priority": "error",
            "title": "Hata",
            "description": "Veri bulunamadı",
            "use_case": "Lütfen geçerli bir veri dosyası yükleyin",
            "variables": {}
        }]
    
    # Helper to get column names
    def get_col_names(cols): return [c["name"] for c in cols]
    
    numeric_names = get_col_names(numeric_cols)
    categorical_names = get_col_names(categorical_cols)
    date_names = get_col_names(date_cols)
    
    # 1 Numeric Column - Distribution Charts
    if n_numeric >= 1:
        recommendations.extend([
            {
                "type": "box",
                "score": 0.90,
                "reason": "Medyan, çeyrekler ve aykırı değerleri gösterir",
                "priority": "best",
                "title": "Box Plot (Kutu Grafiği)",
                "description": "İstatistiksel özet",
                "use_case": "Veri dağılımını ve aykırı değerleri tespit etmek için",
                "variables": {
                    "y_axis": numeric_names[0] if numeric_names else None,
                    "group_by": categorical_names[0] if categorical_names else None,
                    "numeric_options": numeric_names,
                    "group_options": categorical_names
                }
            },
            {
                "type": "violin",
                "score": 0.85,
                "reason": "Dağılım yoğunluğunu detaylı gösterir",
                "priority": "good",
                "title": "Violin Plot",
                "description": "Yoğunluk dağılımı",
                "use_case": "Box plot'tan daha detaylı dağılım analizi için",
                "variables": {
                    "y_axis": numeric_names[0] if numeric_names else None,
                    "options": numeric_names
                }
            }
        ])
    
    # Time Series Data
    if has_time_series or len(date_cols) > 0:
        date_col = date_names[0] if date_names else None
        recommendations.extend([
            {
                "type": "line",
                "score": 0.98,
                "reason": f"Zaman içindeki ({date_col}) trendi gösterir",
                "priority": "best",
                "title": "Line Chart (Çizgi Grafiği)",
                "description": "Zaman serisi trendi",
                "use_case": "Zaman içindeki değişimi ve trendi görmek için",
                "variables": {
                    "x_axis": date_col,
                    "y_axis": numeric_names[0] if numeric_names else None,
                    "y_options": numeric_names
                }
            },
            {
                "type": "area",
                "score": 0.92,
                "reason": "Hacimsel değişimi vurgular",
                "priority": "best",
                "title": "Area Chart (Alan Grafiği)",
                "description": "Kümülatif trend",
                "use_case": "Zaman içindeki hacimsel değişimi göstermek için",
                "variables": {
                    "x_axis": date_col,
                    "y_axis": numeric_names[0] if numeric_names else None,
                    "y_options": numeric_names
                }
            },
            {
                "type": "multi-line",
                "score": 0.88,
                "reason": "Birden fazla zaman serisini karşılaştırır",
                "priority": "good",
                "title": "Multi-Line Chart",
                "description": "Çoklu trend karşılaştırması",
                "use_case": "Birden fazla değişkenin zaman içindeki değişimini karşılaştırmak için",
                "variables": {
                    "x_axis": date_col,
                    "y_axes": numeric_names[:3],
                    "group_by": categorical_names[0] if categorical_names else None,
                    "y_options": numeric_names,
                    "group_options": categorical_names
                }
            }
        ])
    
    # 2+ Numeric Columns (Correlation)
    if n_numeric >= 2:
        recommendations.extend([
            {
                "type": "scatter",
                "score": 0.95,
                "reason": f"İki değişken ({numeric_names[0]} vs {numeric_names[1]}) arasındaki ilişkiyi gösterir",
                "priority": "best",
                "title": "Scatter Plot (Dağılım Grafiği)",
                "description": "Korelasyon analizi",
                "use_case": "İki sayısal değişken arasındaki ilişkiyi keşfetmek için",
                "variables": {
                    "x_axis": numeric_names[0],
                    "y_axis": numeric_names[1],
                    "color_by": categorical_names[0] if categorical_names else None,
                    "x_options": numeric_names,
                    "y_options": numeric_names,
                    "color_options": categorical_names
                }
            }
        ])
        
        if n_numeric >= 3:
            recommendations.append({
                "type": "bubble",
                "score": 0.85,
                "reason": f"Üç boyutlu ilişkiyi gösterir ({numeric_names[0]}, {numeric_names[1]}, {numeric_names[2]})",
                "priority": "good",
                "title": "Bubble Chart (Balon Grafiği)",
                "description": "3D korelasyon",
                "use_case": "Üç değişken arasındaki ilişkiyi göstermek için",
                "variables": {
                    "x_axis": numeric_names[0],
                    "y_axis": numeric_names[1],
                    "size": numeric_names[2],
                    "color_by": categorical_names[0] if categorical_names else None,
                    "x_options": numeric_names,
                    "y_options": numeric_names,
                    "size_options": numeric_names,
                    "color_options": categorical_names
                }
            })
        
        recommendations.append({
            "type": "heatmap",
            "score": 0.88,
            "reason": f"Tüm sayısal değişkenler arası korelasyonu gösterir",
            "priority": "good",
            "title": "Heatmap (Isı Haritası)",
            "description": "Korelasyon matrisi",
            "use_case": "Tüm değişkenler arası korelasyonu görmek için",
            "variables": {
                "columns": numeric_names[:10],  # Max 10 columns for readability
                "all_options": numeric_names
            }
        })
    
    # Categorical Data
    if n_categorical >= 1:
        cat_col = categorical_names[0]
        recommendations.extend([
            {
                "type": "bar",
                "score": 0.95,
                "reason": f"Kategorileri ({cat_col}) karşılaştırır",
                "priority": "best",
                "title": "Bar Chart (Çubuk Grafiği)",
                "description": "Kategorik karşılaştırma",
                "use_case": "Kategoriler arası farkları görmek için",
                "variables": {
                    "x_axis": cat_col,
                    "y_axis": numeric_names[0] if numeric_names else "count",
                    "x_options": categorical_names,
                    "y_options": ["count"] + numeric_names
                }
            },
            {
                "type": "horizontal-bar",
                "score": 0.90,
                "reason": "Uzun kategori isimleri için ideal",
                "priority": "good",
                "title": "Horizontal Bar Chart",
                "description": "Yatay çubuk grafiği",
                "use_case": "Çok sayıda kategori veya uzun isimler için",
                "variables": {
                    "y_axis": cat_col,
                    "x_axis": numeric_names[0] if numeric_names else "count",
                    "y_options": categorical_names,
                    "x_options": ["count"] + numeric_names
                }
            },
            {
                "type": "pie",
                "score": 0.82,
                "reason": f"Kategorilerin ({cat_col}) oransal dağılımı",
                "priority": "good",
                "title": "Pie Chart (Pasta Grafiği)",
                "description": "Yüzdesel dağılım",
                "use_case": "Kategorilerin toplam içindeki payını görmek için (max 7 kategori)",
                "variables": {
                    "category": cat_col,
                    "value": numeric_names[0] if numeric_names else "count",
                    "category_options": categorical_names,
                    "value_options": ["count"] + numeric_names
                }
            },
            {
                "type": "donut",
                "score": 0.80,
                "reason": "Pie chart'ın modern versiyonu",
                "priority": "alternative",
                "title": "Donut Chart (Halka Grafiği)",
                "description": "Modern pasta grafiği",
                "use_case": "Oransal dağılımı daha şık göstermek için",
                "variables": {
                    "category": cat_col,
                    "value": numeric_names[0] if numeric_names else "count",
                    "category_options": categorical_names,
                    "value_options": ["count"] + numeric_names
                }
            }
        ])
    
    # Categorical + Numeric
    if n_categorical >= 1 and n_numeric >= 1:
        cat_col = categorical_names[0]
        subcat_col = categorical_names[1] if n_categorical >= 2 else None
        
        recommendations.extend([
            {
                "type": "grouped-bar",
                "score": 0.92,
                "reason": f"Kategorilere ({cat_col}) göre gruplu karşılaştırma",
                "priority": "best",
                "title": "Grouped Bar Chart",
                "description": "Gruplu çubuk grafiği",
                "use_case": "Alt kategorilere göre karşılaştırma yapmak için",
                "variables": {
                    "x_axis": cat_col,
                    "y_axis": numeric_names[0],
                    "group_by": subcat_col,
                    "x_options": categorical_names,
                    "y_options": numeric_names,
                    "group_options": categorical_names
                }
            },
            {
                "type": "stacked-bar",
                "score": 0.88,
                "reason": "Kümülatif değerleri gösterir",
                "priority": "good",
                "title": "Stacked Bar Chart",
                "description": "Yığılmış çubuk grafiği",
                "use_case": "Kategorilerin toplam içindeki katkısını görmek için",
                "variables": {
                    "x_axis": cat_col,
                    "y_axis": numeric_names[0],
                    "stack_by": subcat_col,
                    "x_options": categorical_names,
                    "y_options": numeric_names,
                    "stack_options": categorical_names
                }
            },
            {
                "type": "boxplot-grouped",
                "score": 0.85,
                "reason": f"Kategorilere ({cat_col}) göre dağılım karşılaştırması",
                "priority": "good",
                "title": "Grouped Box Plot",
                "description": "Gruplu kutu grafiği",
                "use_case": "Farklı kategorilerdeki dağılımları karşılaştırmak için",
                "variables": {
                    "x_axis": cat_col,
                    "y_axis": numeric_names[0],
                    "x_options": categorical_names,
                    "y_options": numeric_names
                }
            }
        ])
    
    # Multiple Numeric Columns (3+) - Advanced Charts
    if n_numeric >= 3:
        score_cols = [c for c in numeric_names if 'score' in c.lower() or 'rating' in c.lower()]
        
        recommendations.extend([
            {
                "type": "radar",
                "score": 0.80,
                "reason": f"Çok boyutlu karşılaştırma ({', '.join(score_cols[:5] if score_cols else numeric_names[:5])})",
                "priority": "alternative",
                "title": "Radar Chart (Örümcek Ağı)",
                "description": "Çok değişkenli profil",
                "use_case": "Birden fazla metriği aynı anda karşılaştırmak için",
                "variables": {
                    "metrics": score_cols[:6] if score_cols else numeric_names[:6],
                    "group_by": categorical_names[0] if categorical_names else None,
                    "metric_options": numeric_names,
                    "group_options": categorical_names
                }
            },
            {
                "type": "parallel",
                "score": 0.75,
                "reason": "Çok değişkenli ilişkileri gösterir",
                "priority": "alternative",
                "title": "Parallel Coordinates",
                "description": "Paralel koordinatlar",
                "use_case": "Çok boyutlu veri setlerinde pattern keşfi için",
                "variables": {
                    "axes": numeric_names[:8],
                    "color_by": categorical_names[0] if categorical_names else None,
                    "axis_options": numeric_names,
                    "color_options": categorical_names
                }
            }
        ])
    
    # Additional Chart Types for Rich Datasets
    if n_numeric >= 1:
        # Density Plot
        recommendations.append({
            "type": "density",
            "score": 0.78,
            "reason": "Sürekli dağılım yoğunluğunu gösterir",
            "priority": "alternative",
            "title": "Density Plot (Yoğunluk Grafiği)",
            "description": "Kernel yoğunluk tahmini",
            "use_case": "Histogram'dan daha pürüzsüz dağılım analizi için",
            "variables": {
                "x_axis": numeric_names[0],
                "group_by": categorical_names[0] if categorical_names else None,
                "x_options": numeric_names,
                "group_options": categorical_names
            }
        })
    
    # Ridgeline Plot (for multiple categories)
    if n_categorical >= 1 and n_numeric >= 1:
        recommendations.append({
            "type": "ridgeline",
            "score": 0.76,
            "reason": f"Kategorilere ({categorical_names[0]}) göre dağılım karşılaştırması",
            "priority": "alternative",
            "title": "Ridgeline Plot (Sırt Çizgisi)",
            "description": "Çoklu yoğunluk dağılımları",
            "use_case": "Birden fazla grubun dağılımını aynı anda görmek için",
            "variables": {
                "x_axis": numeric_names[0],
                "category": categorical_names[0],
                "x_options": numeric_names,
                "category_options": categorical_names
            }
        })
    
    # Treemap (for hierarchical categorical data)
    if n_categorical >= 1:
        recommendations.append({
            "type": "treemap",
            "score": 0.74,
            "reason": "Hiyerarşik kategorik yapıyı gösterir",
            "priority": "alternative",
            "title": "Treemap (Ağaç Haritası)",
            "description": "Hiyerarşik dikdörtgen harita",
            "use_case": "Kategorilerin oransal büyüklüğünü alan olarak göstermek için",
            "variables": {
                "category": categorical_names[0],
                "subcategory": categorical_names[1] if n_categorical >= 2 else None,
                "value": numeric_names[0] if numeric_names else "count",
                "category_options": categorical_names,
                "value_options": ["count"] + numeric_names
            }
        })
    
    # Sunburst (hierarchical pie chart)
    if n_categorical >= 2:
        recommendations.append({
            "type": "sunburst",
            "score": 0.72,
            "reason": f"Çok seviyeli kategori yapısı ({categorical_names[0]}, {categorical_names[1]})",
            "priority": "alternative",
            "title": "Sunburst Chart (Güneş Patlaması)",
            "description": "Hiyerarşik pasta grafiği",
            "use_case": "İç içe kategorilerin oranlarını göstermek için",
            "variables": {
                "level1": categorical_names[0],
                "level2": categorical_names[1],
                "level3": categorical_names[2] if n_categorical >= 3 else None,
                "value": numeric_names[0] if numeric_names else "count",
                "category_options": categorical_names,
                "value_options": ["count"] + numeric_names
            }
        })
    
    # Waterfall Chart (for cumulative changes)
    if n_numeric >= 1 and (has_time_series or n_categorical >= 1):
        recommendations.append({
            "type": "waterfall",
            "score": 0.70,
            "reason": "Kümülatif değişimleri adım adım gösterir",
            "priority": "alternative",
            "title": "Waterfall Chart (Şelale Grafiği)",
            "description": "Kümülatif değişim analizi",
            "use_case": "Başlangıçtan sona toplam değişimi görmek için",
            "variables": {
                "category": categorical_names[0] if categorical_names else date_names[0] if date_names else None,
                "value": numeric_names[0],
                "category_options": categorical_names + date_names,
                "value_options": numeric_names
            }
        })
    
    # Funnel Chart (for conversion/process data)
    if n_categorical >= 1 and n_numeric >= 1:
        recommendations.append({
            "type": "funnel",
            "score": 0.68,
            "reason": "Aşamalı süreç veya dönüşüm hunisini gösterir",
            "priority": "alternative",
            "title": "Funnel Chart (Huni Grafiği)",
            "description": "Süreç aşamaları",
            "use_case": "Satış hunisi, kullanıcı akışı gibi aşamalı süreçler için",
            "variables": {
                "stage": categorical_names[0],
                "value": numeric_names[0],
                "stage_options": categorical_names,
                "value_options": numeric_names
            }
        })
    
    # Candlestick (for OHLC data)
    if n_numeric >= 4 and has_time_series:
        # Check if we have OHLC-like columns
        ohlc_candidates = [c for c in numeric_names if any(x in c.lower() for x in ['open', 'high', 'low', 'close', 'value'])]
        if len(ohlc_candidates) >= 4 or n_numeric >= 4:
            recommendations.append({
                "type": "candlestick",
                "score": 0.66,
                "reason": "Açılış, en yüksek, en düşük, kapanış değerlerini gösterir",
                "priority": "alternative",
                "title": "Candlestick Chart (Mum Grafiği)",
                "description": "OHLC finansal grafik",
                "use_case": "Finansal veriler ve fiyat hareketleri için",
                "variables": {
                    "date": date_names[0] if date_names else None,
                    "open": numeric_names[0] if len(numeric_names) > 0 else None,
                    "high": numeric_names[1] if len(numeric_names) > 1 else None,
                    "low": numeric_names[2] if len(numeric_names) > 2 else None,
                    "close": numeric_names[3] if len(numeric_names) > 3 else None,
                    "numeric_options": numeric_names
                }
            })
    
    # 3D Scatter (for 3 numeric variables)
    if n_numeric >= 3:
        recommendations.append({
            "type": "scatter-3d",
            "score": 0.64,
            "reason": f"Üç boyutlu ilişki ({numeric_names[0]}, {numeric_names[1]}, {numeric_names[2]})",
            "priority": "alternative",
            "title": "3D Scatter Plot",
            "description": "Üç boyutlu dağılım",
            "use_case": "Üç sayısal değişken arasındaki ilişkiyi 3D'de görmek için",
            "variables": {
                "x_axis": numeric_names[0],
                "y_axis": numeric_names[1],
                "z_axis": numeric_names[2],
                "color_by": categorical_names[0] if categorical_names else None,
                "x_options": numeric_names,
                "y_options": numeric_names,
                "z_options": numeric_names,
                "color_options": categorical_names
            }
        })
    
    # Sort by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    # Add info message if limited options
    if len(recommendations) < 5:
        recommendations.append({
            "type": "info",
            "score": 0,
            "reason": f"Veri seti yapısı ({n_numeric} sayısal, {n_categorical} kategorik sütun) sınırlı görselleştirme seçeneği sunuyor",
            "priority": "info",
            "title": "Bilgi",
            "description": "Daha fazla grafik için veri setinize farklı tipte sütunlar ekleyin",
            "use_case": "Örnek: Tarih sütunu ekleyerek zaman serisi grafikleri oluşturabilirsiniz",
            "variables": {
                "suggestion": "Veri setinize daha fazla sayısal veya kategorik sütun ekleyin"
            }
        })
    
    return recommendations[:20]  # Maximum 20 recommendations

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/upload-data", response_model=DataAnalysis)
async def upload_data(file: UploadFile = File(...)):
    """Upload and analyze data file"""
    try:
        # Read file
        contents = await file.read()
        
        # Determine file type and read
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Analyze columns
        columns = [analyze_column(df, col) for col in df.columns]
        
        # Detect time series
        has_time_series = any(
            col["type"] == "date" or 
            any(keyword in col["name"].lower() for keyword in ["date", "time", "year", "month"])
            for col in columns
        )
        
        # Detect geographic
        has_geographic = any(
            any(keyword in col["name"].lower() for keyword in ["country", "city", "region", "location", "lat", "lon"])
            for col in columns
        )
        
        # Sample data
        sample_data = df.head(5).to_dict('records')
        
        # Convert NaN to None for JSON
        for row in sample_data:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
        
        return DataAnalysis(
            error=False,
            filename=file.filename,
            n_rows=len(df),
            n_cols=len(df.columns),
            columns=columns,
            has_time_series=has_time_series,
            has_geographic=has_geographic,
            sample_data=sample_data
        )
        
    except Exception as e:
        return DataAnalysis(
            error=True,
            message=str(e)
        )

@app.post("/suggest-plots")
async def suggest_plots(data: Dict[str, Any]):
    """Get chart recommendations"""
    try:
        columns = data.get("columns", [])
        has_time_series = data.get("has_time_series", False)
        
        recommendations = recommend_charts_from_data(columns, has_time_series)
        
        return {
            "recommended": recommendations,
            "total_count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gemini-insight")
async def gemini_insight(data: Dict[str, Any]):
    """Get AI insights using Gemini"""
    try:
        # Build prompt
        columns_info = "\n".join([
            f"  - {col['name']} ({col['type']})"
            for col in data.get("columns", [])
        ])
        
        prompt = f"""Analyze this dataset and provide insights in Turkish:

Dataset Overview:
- Total Rows: {data.get('n_rows', 0)}
- Total Columns: {data.get('n_cols', 0)}
- Has Time Series: {'Yes' if data.get('has_time_series') else 'No'}

Columns:
{columns_info}

Please provide:
1. A brief description of what this dataset contains
2. Key patterns or observations
3. Recommended chart types (choose from: bar, line, scatter, pie, area, histogram)

Respond in JSON format:
{{
  "analysis": "Your analysis in Turkish",
  "chart_types": ["chart1", "chart2"],
  "confidence": 0.85
}}
"""
        
        # Call Gemini
        # model = genai.GenerativeModel('gemini-2.0-flash-exp') # Use global model instead
        response = model.generate_content(prompt)
        
        # Parse response
        import json
        import re
        
        text = response.text
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text)
        
        if json_match:
            result = json.loads(json_match.group())
            return {
                "error": False,
                "analysis_text": result.get("analysis", text),
                "suggested_chart_types": result.get("chart_types", []),
                "confidence": result.get("confidence", 0.7)
            }
        else:
            return {
                "error": False,
                "analysis_text": text,
                "suggested_chart_types": [],
                "confidence": 0.5
            }
            
    except Exception as e:
        return {
            "error": True,
            "message": str(e)
        }


# Request model for R code generation
class RCodeRequest(BaseModel):
    image: str
    columns: List[str]
    chartType: Optional[str] = None

@app.post("/generate-r-code")
async def generate_r_code(request: RCodeRequest):
    """
    Generate R ggplot2 code based on an image and available columns.
    """
    try:
        # Create prompt for Gemini
        prompt = f"""
        You are an expert R developer and data visualization specialist.
        
        Task: Write R code using 'ggplot2' to recreate the chart style shown in the image, adapted for the user's dataset.
        
        Context:
        - The user has provided an image of a chart they want to replicate.
        - The user's dataset has the following columns: {', '.join(request.columns)}
        - {f"The detected chart type is: {request.chartType}" if request.chartType else ""}
        
        Instructions:
        1. Assume the data is already loaded into a dataframe called `data`.
        2. Use the most appropriate columns from the provided list to map to x, y, color, size, etc.
        3. Try to match the visual style (theme, colors, labels) of the image as closely as possible.
        4. Use 'ggplot2' and 'dplyr' libraries.
        5. Return ONLY the raw R code without markdown formatting (no ```r or ```).
        6. Do not include any data loading or library installation code. Just the plot generation.
        7. The code must assume the data is in a dataframe variable named `data`.
        8. The last line of the code MUST be the plot object itself (e.g., `p`). Do NOT call `print(p)`.
        
        Example Output:
        library(ggplot2)
        p <- ggplot(data, aes(x=Category, y=Value, fill=Region)) +
          geom_bar(stat="identity", position="dodge") +
          theme_minimal() +
          labs(title="Chart Title")
        p
          geom_bar(stat="identity", position="dodge") +
          theme_minimal() +
          labs(title="Chart Title")
        p
        """
        
        contents = [prompt]
        
        # Add image if provided
        if request.image:
            image_data = request.image.split(",")[1] if "," in request.image else request.image
            contents.append({
                "mime_type": "image/png", # Assuming PNG, Gemini is flexible
                "data": image_data
            })
            
        # Call Gemini
        # Ensure model is initialized (it should be global, but if not re-init)
        # Using the same configuration as startup
        if 'model' not in globals():
             # Should be global, but just in case
             pass
        
        response = model.generate_content(contents)
        r_code = response.text
        
        # Clean up markdown if present
        r_code = r_code.replace("```r", "").replace("```", "").strip()
        
        return {"code": r_code, "status": "success"}
        
    except Exception as e:
        print(f"Error generating R code: {str(e)}")
        return {"code": "", "status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
