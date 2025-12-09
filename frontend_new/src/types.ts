// Veri tipleri
export interface DataRow {
    [key: string]: string | number | boolean | null;
}

export interface ColumnInfo {
    name: string;
    type: 'numeric' | 'categorical' | 'date' | 'boolean';
    uniqueCount: number;
    nullCount: number;
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    values?: (string | number)[];
}

export interface DataAnalysis {
    rowCount: number;
    columnCount: number;
    columns: ColumnInfo[];
    hasTimeSeries: boolean;
    sample_data?: any[];
    hasGeographic: boolean;
    hasHierarchical: boolean;
}

// Grafik tipleri
export type ChartType =
    | 'bar'
    | 'horizontal-bar'
    | 'line'
    | 'scatter'
    | 'bubble'
    | 'pie'
    | 'donut'
    | 'area'
    | 'histogram'
    | 'box'
    | 'violin'
    | 'heatmap'
    | 'radar'
    | 'stacked-bar'
    | 'grouped-bar'
    | 'multi-line';

export interface ChartRecommendation {
    type: ChartType;
    title: string;
    description: string;
    useCase: string;
    priority: 'best' | 'good' | 'alternative';
    score?: number;
    config?: any;
}

// Chatbot tipleri
export interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

export interface ChatbotContext {
    hasData: boolean;
    dataAnalysis?: DataAnalysis;
    selectedChart?: ChartType;
    currentScreen: 'upload' | 'analysis' | 'visualization';
}

// Dosya yükleme tipleri
export interface FileUploadState {
    file: File | null;
    isUploading: boolean;
    progress: number;
    error: string | null;
}

// Renk paleti tipleri
export type ColorPalette = 'vibrant' | 'pastel' | 'monochrome' | 'sunset' | 'ocean';

export interface ChartCustomization {
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    colorPalette: ColorPalette;
    showLegend: boolean;
    showGrid: boolean;
}
