const GEMINI_API_KEY = 'AIzaSyDb9AAtZ1L5dEjLfPmj27PhBLxPS1iU3Xs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

export interface ChartDetectionResult {
    chartType: string;
    confidence: number;
    description: string;
}

export async function analyzeChartImage(imageBase64: string): Promise<ChartDetectionResult> {
    try {
        // Base64 string'den data URL prefix'ini kaldır
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        // Determine mime type from base64 prefix
        let mimeType = 'image/jpeg';
        if (imageBase64.startsWith('data:image/png')) {
            mimeType = 'image/png';
        } else if (imageBase64.startsWith('data:image/webp')) {
            mimeType = 'image/webp';
        }

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `You are an expert data visualization analyst. Analyze this chart image VERY CAREFULLY and identify the EXACT chart type.

IMPORTANT: Look at the visual structure of the chart:
- PIE CHART: Circular chart divided into slices/wedges (like a pizza)
- BAR CHART: Rectangular bars, vertical orientation
- HORIZONTAL BAR: Rectangular bars, horizontal orientation  
- LINE CHART: Connected points forming a line
- SCATTER PLOT: Individual points without connections
- AREA CHART: Filled area under a line
- HISTOGRAM: Bars touching each other, showing distribution
- BOX PLOT: Box with whiskers showing quartiles
- HEATMAP: Grid of colored cells
- STACKED BAR: Bars stacked on top of each other
- MULTI-LINE: Multiple lines on same chart

Possible chart types (choose ONE):
- pie (circular chart with slices)
- bar (vertical rectangular bars)
- horizontal-bar (horizontal rectangular bars)
- line (connected line graph)
- scatter (individual points)
- area (filled area chart)
- histogram (touching bars)
- box (box and whisker plot)
- heatmap (colored grid)
- stacked-bar (stacked bars)
- multi-line (multiple lines)

Respond ONLY with a JSON object in this exact format:
{
  "chartType": "one of the types above",
  "confidence": number between 0-100,
  "description": "what you see in the chart"
}

Example for a pie chart:
{
  "chartType": "pie",
  "confidence": 95,
  "description": "A circular pie chart divided into colored slices showing proportions"
}`
                    },
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

        // Gemini'nin yanıtını parse et
        const textResponse = data.candidates[0]?.content?.parts[0]?.text || '';

        // JSON'u extract et (bazen markdown code block içinde gelir)
        let jsonText = textResponse;
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        const result = JSON.parse(jsonText);

        return {
            chartType: result.chartType || 'bar',
            confidence: result.confidence || 50,
            description: result.description || 'Chart detected'
        };

    } catch (error) {
        console.error('Error analyzing image:', error);

        // Fallback: Basit bir tahmin yap
        return {
            chartType: 'bar',
            confidence: 30,
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
        'pie': 'pie',
        'pie chart': 'pie',
        'area': 'area',
        'area chart': 'area',
        'histogram': 'histogram',
        'box': 'box',
        'box plot': 'box',
        'heatmap': 'heatmap',
        'heat map': 'heatmap',
        'stacked bar': 'stacked-bar',
        'stacked-bar': 'stacked-bar',
        'multi-line': 'multi-line',
        'multiple line': 'multi-line',
    };

    const normalized = geminiType.toLowerCase().trim();
    return mapping[normalized] || 'bar';
}
