import { useState, useCallback } from 'react';
import { Image as ImageIcon, Sparkles, CheckCircle2, AlertTriangle, X, Plus } from 'lucide-react';
import type { ChartType, DataAnalysis, ChartRecommendation } from '../types';
import { analyzeChartImage, mapGeminiChartType } from '../utils/geminiApi';

interface ImageAnalysisProps {
    dataAnalysis: DataAnalysis | null;
    recommendations: ChartRecommendation[];
    onChartSelect: (chartType: ChartType) => void;
    onAnalysisComplete?: (detectedChart: ChartType, isCompatible: boolean) => void;
}

interface ImageAnalysis {
    id: string;
    imageUrl: string;
    isAnalyzing: boolean;
    result: {
        detectedChartType: ChartType;
        detectedChartName: string;
        isCompatible: boolean;
        reason: string;
        confidence: number;
    } | null;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
    dataAnalysis,
    recommendations,
    onAnalysisComplete
}) => {
    const [images, setImages] = useState<ImageAnalysis[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const getChartTitle = (type: ChartType): string => {
        const titles: Record<ChartType, string> = {
            'bar': 'Bar Chart',
            'horizontal-bar': 'Horizontal Bar Chart',
            'line': 'Line Chart',
            'scatter': 'Scatter Plot',
            'pie': 'Pie Chart',
            'area': 'Area Chart',
            'histogram': 'Histogram',
            'box': 'Box Plot',
            'heatmap': 'Heatmap',
            'stacked-bar': 'Stacked Bar Chart',
            'multi-line': 'Multi-line Chart',
        };
        return titles[type] || type;
    };

    const analyzeImage = useCallback(async (imageId: string, imageUrl: string) => {
        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, isAnalyzing: true, result: null } : img
        ));

        try {
            // Gemini API ile gerçek analiz
            const geminiResult = await analyzeChartImage(imageUrl);
            const detectedType = mapGeminiChartType(geminiResult.chartType) as ChartType;
            const chartName = getChartTitle(detectedType);

            // Veriye uygunluk kontrolü
            const isRecommended = recommendations.some(rec => rec.type === detectedType);

            let reason = '';
            let isCompatible = false;

            if (isRecommended) {
                const matchingRec = recommendations.find(rec => rec.type === detectedType)!;
                isCompatible = true;
                reason = `✅ Harika! Görseldeki ${chartName} grafiği veri setiniz için uygun. ${matchingRec.useCase}`;
            } else {
                const numericCols = dataAnalysis?.columns.filter(c => c.type === 'numeric').length || 0;

                if (detectedType === 'pie' && numericCols > 1) {
                    reason = `⚠️ Görselde ${chartName} tespit ettik (güven: %${geminiResult.confidence}), ancak veri setinizde ${numericCols} sayısal sütun var. Pie Chart tek bir metrik için idealdir. Önerilen grafikler kullanılacak.`;
                } else if (detectedType === 'line' && !dataAnalysis?.hasTimeSeries) {
                    reason = `⚠️ Görselde ${chartName} tespit ettik (güven: %${geminiResult.confidence}), ancak veri setinizde zaman serisi verisi bulunamadı. Line Chart zaman bazlı veriler için en uygunudur. Önerilen grafikler kullanılacak.`;
                } else if (detectedType === 'scatter' && numericCols < 2) {
                    reason = `⚠️ Görselde ${chartName} tespit ettik (güven: %${geminiResult.confidence}), ancak Scatter Plot en az 2 sayısal değişken gerektirir. Önerilen grafikler kullanılacak.`;
                } else {
                    reason = `⚠️ Görselde ${chartName} tespit ettik (güven: %${geminiResult.confidence}). Bu grafik veri yapınız için en optimal seçim olmayabilir. Önerilen grafikler kullanılacak.`;
                }
            }

            const result = {
                detectedChartType: detectedType,
                detectedChartName: chartName,
                isCompatible,
                reason,
                confidence: geminiResult.confidence,
            };

            setImages(prev => prev.map(img =>
                img.id === imageId ? { ...img, isAnalyzing: false, result } : img
            ));

            if (onAnalysisComplete) {
                onAnalysisComplete(detectedType, isCompatible);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            setImages(prev => prev.map(img =>
                img.id === imageId ? {
                    ...img,
                    isAnalyzing: false,
                    result: {
                        detectedChartType: 'bar',
                        detectedChartName: 'Unknown',
                        isCompatible: false,
                        reason: '❌ Görsel analiz edilemedi. Lütfen tekrar deneyin.',
                        confidence: 0,
                    }
                } : img
            ));
        }
    }, [dataAnalysis, recommendations, onAnalysisComplete]);

    const handleImageUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Lütfen geçerli bir görsel dosyası yükleyin (JPG, PNG, etc.)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const newImage: ImageAnalysis = {
                id: imageId,
                imageUrl,
                isAnalyzing: false,
                result: null,
            };

            setImages(prev => [...prev, newImage]);
            analyzeImage(imageId, imageUrl);
        };
        reader.readAsDataURL(file);
    }, [analyzeImage]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                handleImageUpload(file);
            }
        });
    }, [handleImageUpload]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => handleImageUpload(file));
        }
    }, [handleImageUpload]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const removeImage = (imageId: string) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-all duration-300 cursor-pointer
          ${isDragging
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-purple-500/30 glass hover:border-purple-400/50'
                    }
        `}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="image-upload-input"
                    multiple
                />

                <label htmlFor="image-upload-input" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <ImageIcon className="w-12 h-12 text-purple-400" />
                            <Plus className="w-6 h-6 text-green-400 absolute -bottom-1 -right-1" />
                        </div>
                        <div>
                            <p className="font-semibold">
                                {images.length === 0 ? 'Grafik Görseli Yükleyin' : 'Daha Fazla Görsel Ekleyin'}
                            </p>
                            <p className="text-sm text-gray-400">
                                Birden fazla görsel yükleyebilirsiniz • JPG, PNG, JPEG
                            </p>
                            <p className="text-xs text-purple-400 mt-2">
                                🤖 AI ile otomatik grafik tanıma
                            </p>
                        </div>
                    </div>
                </label>
            </div>

            {/* Uploaded Images */}
            {images.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-400">
                        Yüklenen Görseller ({images.length})
                    </p>

                    <div className="grid gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="glass rounded-xl p-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Image */}
                                    <div className="relative">
                                        <img
                                            src={image.imageUrl}
                                            alt="Chart"
                                            className="w-full rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeImage(image.id)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                                            title="Görseli kaldır"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Analysis Result */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            <p className="font-semibold">AI Analiz Sonucu</p>
                                        </div>

                                        {image.isAnalyzing && (
                                            <div className="py-8 text-center">
                                                <div className="spinner mx-auto mb-3" />
                                                <p className="text-sm text-gray-400">
                                                    Gemini AI görseli analiz ediyor...
                                                </p>
                                            </div>
                                        )}

                                        {!image.isAnalyzing && image.result && (
                                            <div className="space-y-3">
                                                {/* Detection Info */}
                                                <div className="glass rounded-lg p-3 border-l-4 border-purple-400">
                                                    <p className="text-xs text-gray-400 mb-1">Tespit Edilen Grafik</p>
                                                    <p className="font-bold text-lg gradient-text">
                                                        {image.result.detectedChartName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Güven Skoru: %{image.result.confidence}
                                                    </p>
                                                </div>

                                                {/* Compatibility */}
                                                <div className={`
                          p-3 rounded-lg flex items-start gap-3
                          ${image.result.isCompatible
                                                        ? 'bg-green-500/10 border border-green-500/30'
                                                        : 'bg-yellow-500/10 border border-yellow-500/30'
                                                    }
                        `}>
                                                    {image.result.isCompatible ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <p className="text-sm text-gray-300">
                                                        {image.result.reason}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            {images.length > 0 && (
                <div className="glass rounded-lg p-3 border-l-4 border-blue-400">
                    <p className="text-xs text-gray-300">
                        <span className="font-semibold text-blue-400">💡 Bilgi:</span>
                        {' '}Uyumlu bulunan grafikler otomatik olarak önerilerinize eklenecektir.
                        Uyumsuz grafikler için mevcut önerileriniz kullanılacak.
                    </p>
                </div>
            )}
        </div>
    );
};
