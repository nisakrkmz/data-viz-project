import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DataRow, ColumnInfo, DataAnalysis, ChartRecommendation, ChartType } from '../types';

// Dosya okuma fonksiyonları
export const parseCSV = (file: File): Promise<{ data: DataRow[], meta: any }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically convert numbers and booleans
            complete: (results: any) => {
                resolve({
                    data: results.data,
                    meta: results.meta
                });
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
};

export const parseExcel = (file: File): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet) as DataRow[];
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Dosya okuma hatası'));
        reader.readAsBinaryString(file);
    });
};

// Veri analizi fonksiyonları
export const analyzeColumn = (data: DataRow[], columnName: string): ColumnInfo => {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined);
    const uniqueValues = [...new Set(values)];
    const nullCount = data.length - values.length;

    // Veri tipini belirle
    // Check for numbers (including string numbers)
    const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v) && typeof v === 'number');
    // If > 80% are valid numbers, treat as numeric (but only if original wasn't clearly non-numeric text)
    // If dynamicTyping is on, they should already be numbers. If not, this helps.
    const rawNumericCount = values.filter(v => typeof v === 'number').length;
    const isNumeric = rawNumericCount > values.length * 0.8 || numericValues.length > values.length * 0.8;

    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
    const isDate = values.some(v => typeof v === 'string' && datePattern.test(v));

    const isBoolean = uniqueValues.length <= 2 &&
        uniqueValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 0 || v === 1);

    let type: ColumnInfo['type'] = 'categorical';
    if (isNumeric) type = 'numeric';
    else if (isDate) type = 'date';
    else if (isBoolean) type = 'boolean';

    const columnInfo: ColumnInfo = {
        name: columnName,
        type,
        uniqueCount: uniqueValues.length,
        nullCount,
    };

    // Sayısal değerler için istatistikler
    if (type === 'numeric' && numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        columnInfo.min = sorted[0];
        columnInfo.max = sorted[sorted.length - 1];
        columnInfo.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        columnInfo.median = sorted[Math.floor(sorted.length / 2)];
    }

    // Kategorik değerler için değer listesi
    if (type === 'categorical' && uniqueValues.length < 50) {
        columnInfo.values = uniqueValues as (string | number)[];
    }

    return columnInfo;
};

export const analyzeData = (data: DataRow[]): DataAnalysis => {
    if (!data || data.length === 0) {
        return {
            rowCount: 0,
            columnCount: 0,
            columns: [],
            hasTimeSeries: false,
            hasGeographic: false,
            hasHierarchical: false,
        };
    }

    const columnNames = Object.keys(data[0]);
    const columns = columnNames.map(name => analyzeColumn(data, name));

    // Zaman serisi kontrolü
    const hasTimeSeries = columns.some(col =>
        col.type === 'date' ||
        col.name.toLowerCase().includes('date') ||
        col.name.toLowerCase().includes('time') ||
        col.name.toLowerCase().includes('year')
    );

    // Coğrafi veri kontrolü
    const hasGeographic = columns.some(col =>
        col.name.toLowerCase().includes('country') ||
        col.name.toLowerCase().includes('city') ||
        col.name.toLowerCase().includes('region') ||
        col.name.toLowerCase().includes('location')
    );

    // Hiyerarşik veri kontrolü (parent-child ilişkisi)
    const hasHierarchical = columns.some(col =>
        col.name.toLowerCase().includes('parent') ||
        col.name.toLowerCase().includes('category') ||
        col.name.toLowerCase().includes('group')
    );

    return {
        rowCount: data.length,
        columnCount: columns.length,
        columns,
        hasTimeSeries,
        hasGeographic,
        hasHierarchical,
    };
};

// Grafik önerisi motoru
export const recommendCharts = (analysis: DataAnalysis): ChartRecommendation[] => {
    const recommendations: ChartRecommendation[] = [];
    const { columns, hasTimeSeries } = analysis;

    const numericColumns = columns.filter(c => c.type === 'numeric');
    const categoricalColumns = columns.filter(c => c.type === 'categorical');

    // 1 sayısal değişken
    if (numericColumns.length === 1 && categoricalColumns.length === 0) {
        recommendations.push({
            type: 'histogram',
            title: 'Histogram',
            description: 'Sayısal verilerin dağılımını gösterir',
            useCase: 'Tek bir sayısal değişkenin frekans dağılımını analiz etmek için idealdir',
            priority: 'best',
        });
        recommendations.push({
            type: 'box',
            title: 'Box Plot',
            description: 'Veri dağılımı ve aykırı değerleri gösterir',
            useCase: 'Medyan, çeyrekler ve aykırı değerleri görselleştirmek için kullanılır',
            priority: 'good',
        });
    }

    // 1 kategorik değişken
    if (categoricalColumns.length === 1 && numericColumns.length === 0) {
        recommendations.push({
            type: 'bar',
            title: 'Bar Chart',
            description: 'Kategorileri karşılaştırır',
            useCase: 'Farklı kategorilerin değerlerini yan yana karşılaştırmak için kullanılır',
            priority: 'best',
        });
        recommendations.push({
            type: 'pie',
            title: 'Pie Chart',
            description: 'Oransal dağılımı gösterir',
            useCase: 'Kategorilerin toplam içindeki payını göstermek için idealdir',
            priority: 'good',
        });
    }

    // 2 sayısal değişken
    if (numericColumns.length >= 2) {
        if (hasTimeSeries) {
            recommendations.push({
                type: 'line',
                title: 'Line Chart',
                description: 'Zaman içindeki değişimi gösterir',
                useCase: 'Zaman serisi verilerinde trend analizi için en uygun grafiktir',
                priority: 'best',
            });
            recommendations.push({
                type: 'area',
                title: 'Area Chart',
                description: 'Zaman içindeki hacimsel değişimi gösterir',
                useCase: 'Kümülatif değerleri ve zaman içindeki büyümeyi vurgulamak için kullanılır',
                priority: 'good',
            });
        } else {
            recommendations.push({
                type: 'scatter',
                title: 'Scatter Plot',
                description: 'İki değişken arasındaki ilişkiyi gösterir',
                useCase: 'Korelasyon analizi ve pattern tespiti için idealdir',
                priority: 'best',
            });
            recommendations.push({
                type: 'heatmap',
                title: 'Heatmap',
                description: 'Değerleri renk yoğunluğu ile gösterir',
                useCase: 'Çok sayıda veri noktasındaki pattern\'leri görselleştirmek için kullanılır',
                priority: 'alternative',
            });
        }
    }

    // 1 sayısal + 1 kategorik
    if (numericColumns.length >= 1 && categoricalColumns.length >= 1) {
        recommendations.push({
            type: 'bar',
            title: 'Grouped Bar Chart',
            description: 'Kategorilere göre gruplandırılmış değerleri gösterir',
            useCase: 'Farklı kategorilerdeki sayısal değerleri karşılaştırmak için kullanılır',
            priority: 'best',
        });
        recommendations.push({
            type: 'stacked-bar',
            title: 'Stacked Bar Chart',
            description: 'Kategorilerin toplam içindeki dağılımını gösterir',
            useCase: 'Hem kategori karşılaştırması hem de toplam içindeki pay analizi için idealdir',
            priority: 'good',
        });
    }

    // 3+ sayısal değişken
    if (numericColumns.length >= 3) {
        recommendations.push({
            type: 'scatter',
            title: 'Bubble Chart',
            description: 'Üç boyutlu veriyi 2D düzlemde gösterir',
            useCase: 'Üç değişken arasındaki ilişkiyi aynı anda analiz etmek için kullanılır',
            priority: 'alternative',
        });
    }

    // Çoklu zaman serisi
    if (hasTimeSeries && numericColumns.length > 1) {
        recommendations.push({
            type: 'multi-line',
            title: 'Multi-line Chart',
            description: 'Birden fazla serinin zaman içindeki değişimini gösterir',
            useCase: 'Farklı metriklerin zaman içindeki karşılaştırmalı analizi için idealdir',
            priority: 'good',
        });
    }

    // Eğer hiç öneri yoksa, varsayılan öneriler ekle
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'bar',
            title: 'Bar Chart',
            description: 'Genel amaçlı karşılaştırma grafiği',
            useCase: 'Çoğu veri tipi için kullanılabilir',
            priority: 'best',
        });
        recommendations.push({
            type: 'line',
            title: 'Line Chart',
            description: 'Trend analizi için kullanılır',
            useCase: 'Sıralı verilerdeki değişimi göstermek için idealdir',
            priority: 'good',
        });
    }

    return recommendations;
};

// Renk paletleri
export const colorPalettes = {
    vibrant: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'],
    pastel: ['#a8edea', '#fed6e3', '#c3cfe2', '#fbc2eb', '#a6c1ee'],
    monochrome: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
    sunset: ['#ff6b6b', '#ee5a6f', '#f7b731', '#fa8231', '#fc5c65'],
    ocean: ['#00d2ff', '#3a7bd5', '#00c6ff', '#0072ff', '#00c9ff'],
};

export const getColorPalette = (paletteName: string): string[] => {
    return colorPalettes[paletteName as keyof typeof colorPalettes] || colorPalettes.vibrant;
};

// Örnek veri seti
export const sampleDatasets = {
    sales: [
        { month: 'Ocak', sales: 4200, profit: 2400, expenses: 1800 },
        { month: 'Şubat', sales: 3800, profit: 2100, expenses: 1700 },
        { month: 'Mart', sales: 5100, profit: 3200, expenses: 1900 },
        { month: 'Nisan', sales: 4600, profit: 2800, expenses: 1800 },
        { month: 'Mayıs', sales: 5500, profit: 3500, expenses: 2000 },
        { month: 'Haziran', sales: 6200, profit: 4100, expenses: 2100 },
        { month: 'Temmuz', sales: 5800, profit: 3800, expenses: 2000 },
        { month: 'Ağustos', sales: 6500, profit: 4300, expenses: 2200 },
        { month: 'Eylül', sales: 5900, profit: 3900, expenses: 2000 },
        { month: 'Ekim', sales: 6800, profit: 4600, expenses: 2200 },
        { month: 'Kasım', sales: 7200, profit: 5000, expenses: 2200 },
        { month: 'Aralık', sales: 8100, profit: 5800, expenses: 2300 },
    ],
    categories: [
        { category: 'Elektronik', value: 45, count: 120 },
        { category: 'Giyim', value: 30, count: 85 },
        { category: 'Gıda', value: 55, count: 200 },
        { category: 'Ev & Yaşam', value: 25, count: 60 },
        { category: 'Spor', value: 20, count: 45 },
    ],
    scatter: [
        { x: 10, y: 20, size: 15 },
        { x: 15, y: 35, size: 25 },
        { x: 20, y: 30, size: 20 },
        { x: 25, y: 45, size: 30 },
        { x: 30, y: 50, size: 35 },
        { x: 35, y: 55, size: 28 },
        { x: 40, y: 65, size: 40 },
        { x: 45, y: 70, size: 45 },
        { x: 50, y: 75, size: 38 },
        { x: 55, y: 85, size: 50 },
    ],
};
