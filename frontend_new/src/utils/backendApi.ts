// ============================================================================
// Backend API Client
// ============================================================================
// Handles communication with R backend API
// ============================================================================

const API_BASE_URL = 'http://localhost:8000';

export interface BackendDataAnalysis {
    error: boolean;
    filename?: string;
    n_rows?: number;
    n_cols?: number;
    columns?: Array<{
        name: string;
        type: string;
        unique_count: number;
        na_count: number;
        summary?: any;
    }>;
    has_time_series?: boolean;
    has_geographic?: boolean;
    sample_data?: any[];
    message?: string;
}

export interface BackendChartRecommendation {
    type: string;
    score: number;
    reason: string;
    variables: Record<string, string>;
    ggplot_code: string;
}

export interface BackendChartSuggestions {
    recommended: BackendChartRecommendation[];
    total_count: number;
}

export interface BackendGeminiInsight {
    error: boolean;
    analysis_text?: string;
    suggested_chart_types?: string[];
    confidence?: number;
    message?: string;
}

/**
 * Upload data file to backend for analysis
 */
export async function uploadDataToBackend(file: File): Promise<BackendDataAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload-data`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Backend response:', data);
        console.log('Sample data:', data.sample_data);
        console.log('Sample data length:', data.sample_data?.length);
        return data;
    } catch (error) {
        console.error('Error uploading to backend:', error);
        return {
            error: true,
            message: error instanceof Error ? error.message : 'Failed to upload file',
        };
    }
}

/**
 * Get chart recommendations from backend
 */
export async function getChartSuggestions(
    dataAnalysis: BackendDataAnalysis
): Promise<BackendChartSuggestions> {
    try {
        const response = await fetch(`${API_BASE_URL}/suggest-plots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataAnalysis),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting chart suggestions:', error);
        return {
            recommended: [],
            total_count: 0,
        };
    }
}

/**
 * Get AI insights from Gemini via backend
 */
export async function getGeminiInsights(
    dataAnalysis: BackendDataAnalysis
): Promise<BackendGeminiInsight> {
    try {
        const response = await fetch(`${API_BASE_URL}/gemini-insight`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataAnalysis),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting Gemini insights:', error);
        return {
            error: true,
            message: error instanceof Error ? error.message : 'Failed to get insights',
        };
    }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
        });

        if (!response.ok) {
            console.log('Backend health check failed: HTTP', response.status);
            return false;
        }

        const data = await response.json();
        console.log('Backend health response:', data);

        // R returns arrays, so status might be ["healthy"]
        const status = Array.isArray(data.status) ? data.status[0] : data.status;
        const isHealthy = status === 'healthy';

        console.log('Backend is healthy:', isHealthy);
        return isHealthy;
        return isHealthy;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}

// ============================================================================
// R Code Generation & Rendering
// ============================================================================

const R_API_URL = 'http://localhost:8001';

export interface RCodeGenerationResponse {
    code: string;
    status: string;
    message?: string;
}

/**
 * Generate R code from image using Python backend
 */
export async function generateRCode(
    image: string,
    columns: string[],
    chartType?: string
): Promise<RCodeGenerationResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-r-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image, columns, chartType }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error generating R code:', error);
        return { code: '', status: 'error', message: 'Failed to generate code' };
    }
}

/**
 * Render R plot using R backend
 */
export async function renderRPlot(
    code: string,
    data: any[]
): Promise<string | null> {
    try {
        const response = await fetch(`${R_API_URL}/render_plot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, data }),
        });

        if (!response.ok) return null;

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error rendering R plot:', error);
        return null;
    }
}
