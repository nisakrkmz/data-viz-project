const GEMINI_API_KEY = 'AIzaSyDb9AAtZ1L5dEjLfPmj27PhBLxPS1iU3Xs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface ChartDetectionResult {
    chartType: string;
    confidence: number;
    description: string;
}

export async function analyzeChartImage(imageBase64: string): Promise<ChartDetectionResult> {
    try {
        // Remove data URL prefix if present
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        // Determine mime type
        let mimeType = 'image/jpeg';
        if (imageBase64.startsWith('data:image/png')) {
            mimeType = 'image/png';
        } else if (imageBase64.startsWith('data:image/webp')) {
            mimeType = 'image/webp';
        }

        const prompt = `You are an expert data visualization specialist. Analyze this chart image and identify its type and confidence level.
        
Analyze the image and return a STRICT JSON object with these fields:
- chartType: string (one of: bar, line, scatter, pie, area, histogram, box, violin, bubble, radar, heatmap, donut, stacked-bar, grouped-bar, multi-line)
- confidence: number (0.0 to 100.0)
- description: string (brief explanation of why you identified this type)

CRITICAL DISTINCTIONS:
- Histogram vs Bar Chart: 
    * Histogram: Bars touch each other (no gaps), X-axis is continuous numerical ranges (bins).
    * Bar Chart: Bars have gaps between them, X-axis represents distinct categories.
    
- Scatter vs Bubble:
    * Bubble: Points vary significantly in size (3rd dimension).
    * Scatter: Points are roughly same size.
    
- Box vs Violin:
    * Violin: Curvy shape showing distribution density.
    * Box: Rectangular box with whiskers.

Return ONLY the raw JSON string. Do not use markdown formatting.`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500,
            }
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let textResponse = data.candidates[0]?.content?.parts[0]?.text || '';

        // Clean up markdown if present
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        // Extract JSON if it's wrapped in other text
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            textResponse = jsonMatch[0];
        }

        const result = JSON.parse(textResponse);

        return {
            chartType: result.chartType || 'bar',
            confidence: result.confidence || 50,
            description: result.description || 'Chart detected'
        };

    } catch (error) {
        console.error('Error analyzing image:', error);
        return {
            chartType: 'bar',
            confidence: 0,
            description: 'Could not analyze image accurately. Using fallback detection.'
        };
    }
}

// Chart type mapping
export function mapGeminiChartType(geminiType: string): string {
    const mapping: Record<string, string> = {
        'bar': 'bar',
        'bar chart': 'bar',
        'vertical bar': 'bar',
        'horizontal bar': 'horizontal-bar',
        'horizontal-bar': 'horizontal-bar',
        'line': 'line',
        'line chart': 'line',
        'scatter': 'scatter',
        'scatter plot': 'scatter',
        'bubble': 'bubble',
        'bubble chart': 'bubble',
        'pie': 'pie',
        'pie chart': 'pie',
        'donut': 'donut',
        'donut chart': 'donut',
        'area': 'area',
        'area chart': 'area',
        'histogram': 'histogram',
        'box': 'box',
        'box plot': 'box',
        'violin': 'violin',
        'violin plot': 'violin',
        'heatmap': 'heatmap',
        'heat map': 'heatmap',
        'radar': 'radar',
        'radar chart': 'radar',
        'spider': 'radar',
        'spider chart': 'radar',
        'stacked bar': 'stacked-bar',
        'stacked-bar': 'stacked-bar',
        'grouped bar': 'grouped-bar',
        'grouped-bar': 'grouped-bar',
        'multi-line': 'multi-line',
        'multiple line': 'multi-line',
    };

    const normalized = geminiType.toLowerCase().trim();
    return mapping[normalized] || 'bar';
}
