import { useState, useCallback } from 'react';
import { Image as ImageIcon, Sparkles, CheckCircle2, AlertTriangle, X, Plus, FileCode } from 'lucide-react';
import type { ChartType, DataAnalysis, ChartRecommendation } from '../types';
import { analyzeChartImage, mapGeminiChartType } from '../utils/geminiApi';
import { generateRCode, renderRPlot } from '../utils/backendApi';

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
    rCode?: {
        code: string;
        isLoading: boolean;
        plotUrl?: string | null;
    };
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
            'bubble': 'Bubble Chart',
            'pie': 'Pie Chart',
            'donut': 'Donut Chart',
            'area': 'Area Chart',
            'histogram': 'Histogram',
            'box': 'Box Plot',
            'violin': 'Violin Plot',
            'heatmap': 'Heatmap',
            'radar': 'Radar Chart',
            'stacked-bar': 'Stacked Bar Chart',
            'grouped-bar': 'Grouped Bar Chart',
            'multi-line': 'Multi-line Chart',
        };
        return titles[type] || type;
    };

    const handleGenerateRCode = async (imageId: string) => {
        const image = images.find(img => img.id === imageId);
        if (!image || !dataAnalysis) return;

        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, rCode: { code: '', isLoading: true } } : img
        ));

        const columns = dataAnalysis.columns.map(c => c.name);
        const response = await generateRCode(
            image.imageUrl,
            columns,
            image.result?.detectedChartType
        );

        if (response.status === 'success') {
            // Render the plot
            const plotUrl = await renderRPlot(response.code, dataAnalysis.sample_data || []);

            setImages(prev => prev.map(img =>
                img.id === imageId ? {
                    ...img,
                    rCode: {
                        code: response.code,
                        isLoading: false,
                        plotUrl
                    }
                } : img
            ));
        } else {
            setImages(prev => prev.map(img =>
                img.id === imageId ? {
                    ...img,
                    rCode: {
                        code: `Error: ${response.message}`,
                        isLoading: false
                    }
                } : img
            ));
        }
    };

    const analyzeImage = useCallback(async (imageId: string, imageUrl: string) => {
        // ... rest of existing analyzeImage logic ...
        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, isAnalyzing: true, result: null } : img
        ));

        try {
            const geminiResult = await analyzeChartImage(imageUrl);
            const detectedType = mapGeminiChartType(geminiResult.chartType) as ChartType;
            const chartName = getChartTitle(detectedType);

            const isRecommended = recommendations.some(rec => rec.type === detectedType);
            const numericCols = dataAnalysis?.columns.filter(c => c.type === 'numeric').length || 0;
            const categoricalCols = dataAnalysis?.columns.filter(c => c.type === 'categorical').length || 0;

            let reason = '';
            let isCompatible = false;

            if (isRecommended) {
                const matchingRec = recommendations.find(rec => rec.type === detectedType)!;
                isCompatible = true;
                reason = `✅ Harika! Görseldeki ${chartName} grafiği veri setiniz için uygun. ${matchingRec.useCase}`;
            } else {
                // Smart compatibility for special charts
                if (detectedType === 'bubble' && numericCols >= 3) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. ${numericCols} sayısal sütununuz var (X, Y, Boyut için yeterli).`;
                } else if (detectedType === 'histogram' && numericCols >= 1) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. Veri dağılımını ve yoğunluğunu analiz etmek için ideal.`;
                } else if (detectedType === 'violin' && numericCols >= 1) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. Dağılım analizi için gelişmiş bir görselleştirmedir.`;
                } else if (detectedType === 'radar' && numericCols >= 3) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. Çok boyutlu karşılaştırma için idealdir.`;
                } else if (detectedType === 'donut' && numericCols >= 1 && categoricalCols >= 1) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. Modern bir pasta grafiği alternatifidir.`;
                } else if (detectedType === 'grouped-bar' && numericCols >= 2 && categoricalCols >= 1) {
                    isCompatible = true;
                    reason = `✅ Harika! Görseldeki ${chartName} veri setiniz için uygun. Metrikleri yan yana karşılaştırmak için idealdir.`;
                } else {
                    reason = `⚠️ Görselde ${chartName} tespit ettik (güven: %${geminiResult.confidence}). Bu grafik veri yapınız için en optimal seçim olmayabilir.`;
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

            {images.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-400">
                        Yüklenen Görseller ({images.length})
                    </p>

                    <div className="grid gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="glass rounded-xl p-4">
                                <div className="grid md:grid-cols-2 gap-4">
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

                                                {/* R Code Generation - REMOVED PER USER REQUEST
                                                {image.result.isCompatible && (
                                                    <div className="mt-4">
                                                        {!image.rCode ? (
                                                            <button
                                                                onClick={() => handleGenerateRCode(image.id)}
                                                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
                                                            >
                                                                <FileCode className="w-4 h-4" />
                                                                R Kodu Oluştur & Çiz
                                                            </button>
                                                        ) : (
                                                            <div className="space-y-3 animation-fade-in">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-semibold text-blue-400">Generated R Code</p>
                                                                    {image.rCode.isLoading && <div className="spinner w-4 h-4" />}
                                                                </div>

                                                                {/* Rendered Plot 
                                                                {image.rCode.plotUrl ? (
                                                                    <div className="mt-3">
                                                                        <p className="text-xs text-gray-400 mb-1">R ile Oluşturulan Çıktı:</p>
                                                                        <img src={image.rCode.plotUrl} alt="Rendered R Plot" className="w-full rounded-lg border border-gray-700" />
                                                                    </div>
                                                                ) : (!image.rCode.isLoading && image.rCode.code && !image.rCode.code.startsWith('Error') && (
                                                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                                                                        ⚠️ R Backend yanıt vermedi. (Port 8001'de çalıştığından emin olun)
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
