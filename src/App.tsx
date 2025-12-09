import { useState } from 'react';
import { Sparkles, Database, TrendingUp, AlertCircle, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { ChartViewer } from './components/ChartViewer';
import { Chatbot } from './components/Chatbot';
import { ImageAnalysis } from './components/ImageAnalysis';
import type { DataRow, DataAnalysis, ChartType, ChartRecommendation } from './types';
import { analyzeData, recommendCharts, sampleDatasets } from './utils/dataUtils';
import './index.css';

function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartType | undefined>();
  const [error, setError] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [chartsApproved, setChartsApproved] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleDataLoaded = (loadedData: DataRow[], backendAnalysis?: any) => {
    setData(loadedData);

    // Use backend analysis if available, otherwise use frontend analysis
    if (backendAnalysis && !backendAnalysis.error) {
      console.log('Using backend analysis');
      // Backend analysis will be used in future for recommendations
      // For now, still use frontend analysis for compatibility
    }

    const dataAnalysis = analyzeData(loadedData);
    setAnalysis(dataAnalysis);
    const chartRecommendations = recommendCharts(dataAnalysis);
    setRecommendations(chartRecommendations);
    setSelectedChart(undefined);
    setChartsApproved(false);
    setShowImageUpload(false);
    setError('');
    setShowWelcome(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(''), 5000);
  };

  const loadSampleData = () => {
    handleDataLoaded(sampleDatasets.sales);
  };

  const handleImageAnalysisComplete = (detectedChart: ChartType, isCompatible: boolean) => {
    if (isCompatible) {
      // Eğer tespit edilen grafik zaten önerilerde yoksa ekle
      const exists = recommendations.some(rec => rec.type === detectedChart);
      if (!exists) {
        const newRecommendation: ChartRecommendation = {
          type: detectedChart,
          title: getChartTitle(detectedChart),
          description: 'Yüklediğiniz görselden tespit edildi',
          useCase: 'Görsel analizine göre verileriniz için uygun bulundu',
          priority: 'good',
        };
        setRecommendations(prev => [newRecommendation, ...prev]);
      }
    }
  };

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
    return titles[type];
  };

  const handleApproveCharts = () => {
    setChartsApproved(true);
    if (recommendations.length > 0) {
      setSelectedChart(recommendations[0].type);
    }
  };

  const chatbotContext = {
    hasData: data.length > 0,
    dataAnalysis: analysis || undefined,
    selectedChart,
    currentScreen: (data.length > 0 ? 'visualization' : 'upload') as 'upload' | 'analysis' | 'visualization',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-strong border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  DataViz AI
                </h1>
                <p className="text-xs text-gray-400">
                  Akıllı Veri Görselleştirme Platformu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {data.length > 0 && (
                <div className="hidden md:flex items-center gap-2 glass px-4 py-2 rounded-lg">
                  <Database className="w-4 h-4 text-green-400" />
                  <span className="text-sm">
                    {analysis?.rowCount} satır yüklendi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="glass-strong rounded-xl p-4 border-l-4 border-red-500 flex items-start gap-3 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Hata</h3>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {/* Welcome Hero */}
        {showWelcome && data.length === 0 && (
          <div className="text-center space-y-6 py-12 animate-fade-in">
            <div className="relative inline-block">
              <div className="text-8xl animate-float">📊</div>
              <div className="absolute inset-0 bg-purple-400 blur-3xl opacity-20" />
            </div>

            <div className="space-y-3">
              <h2 className="text-5xl font-bold gradient-text">
                Verilerinizi Görselleştirin
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Excel veya CSV dosyanızı yükleyin, yapay zeka destekli analiz ile
                en uygun grafikleri otomatik olarak keşfedin
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg">
                <span className="text-2xl">🚀</span>
                <span className="text-sm">Hızlı Analiz</span>
              </div>
              <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg">
                <span className="text-2xl">🎨</span>
                <span className="text-sm">Modern Tasarım</span>
              </div>
              <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg">
                <span className="text-2xl">🤖</span>
                <span className="text-sm">AI Asistan</span>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="max-w-3xl mx-auto">
          <FileUpload onDataLoaded={handleDataLoaded} onError={handleError} />

          {data.length === 0 && (
            <div className="text-center mt-6">
              <button
                onClick={loadSampleData}
                className="btn-secondary"
              >
                <Sparkles className="w-5 h-5 inline mr-2" />
                Örnek Veri ile Dene
              </button>
            </div>
          )}
        </div>

        {/* Data Analysis Section - BEFORE Chart Approval */}
        {data.length > 0 && analysis && !chartsApproved && (
          <>
            {/* Data Preview */}
            <DataPreview data={data} analysis={analysis} />

            {/* Chart Recommendations - Text Only */}
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <div className="absolute inset-0 bg-purple-400 blur-lg opacity-50" />
                </div>
                <h2 className="text-2xl font-bold gradient-text">
                  Önerilen Grafikler
                </h2>
              </div>

              <div className="glass-strong rounded-2xl p-6 space-y-4">
                <p className="text-gray-300">
                  Veri setiniz analiz edildi. İşte verileriniz için en uygun grafik tipleri:
                </p>

                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={`${rec.type}-${index}`}
                      className="glass rounded-xl p-4 border-l-4 border-purple-400"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold">{rec.title}</h3>
                            <span className={`
                              px-2 py-1 rounded text-xs font-bold
                              ${rec.priority === 'best' ? 'bg-green-500/20 text-green-400' :
                                rec.priority === 'good' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-purple-500/20 text-purple-400'}
                            `}>
                              {rec.priority === 'best' ? '⭐ En Uygun' :
                                rec.priority === 'good' ? '✓ Uygun' : 'Alternatif'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-purple-400">Kullanım:</span> {rec.useCase}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload Option */}
              <div className="glass-strong rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">İstediğiniz Başka Bir Grafik Var mı?</h3>
                    <p className="text-sm text-gray-400">
                      Görmek istediğiniz bir grafik görseli varsa yükleyin, uygunluğunu kontrol edelim
                    </p>
                  </div>
                  <button
                    onClick={() => setShowImageUpload(!showImageUpload)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    {showImageUpload ? 'Gizle' : 'Grafik Görseli Yükle'}
                  </button>
                </div>

                {showImageUpload && (
                  <div className="pt-4 border-t border-white/10">
                    <ImageAnalysis
                      dataAnalysis={analysis}
                      recommendations={recommendations}
                      onChartSelect={(chartType) => {
                        // Chart will be added to recommendations if compatible
                      }}
                      onAnalysisComplete={handleImageAnalysisComplete}
                    />
                  </div>
                )}
              </div>

              {/* Approve Button */}
              <div className="text-center">
                <button
                  onClick={handleApproveCharts}
                  className="btn-primary text-lg px-8 py-4"
                >
                  <CheckCircle2 className="w-6 h-6 inline mr-2" />
                  Grafikleri Oluştur
                </button>
                <p className="text-sm text-gray-400 mt-3">
                  Önerilen grafiklerle devam etmek için onaylayın
                </p>
              </div>
            </div>
          </>
        )}

        {/* Chart Visualization - AFTER Approval */}
        {data.length > 0 && analysis && chartsApproved && (
          <>
            {/* Interactive Chart Recommendations */}
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <div className="absolute inset-0 bg-purple-400 blur-lg opacity-50" />
                </div>
                <h2 className="text-2xl font-bold gradient-text">
                  Grafik Seçin
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={`${rec.type}-${index}`}
                    onClick={() => setSelectedChart(rec.type)}
                    className={`
                      card-hover group relative overflow-hidden cursor-pointer
                      ${selectedChart === rec.type ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/30' : ''}
                    `}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`
                        px-3 py-1 rounded-full text-xs font-bold
                        bg-gradient-to-r ${rec.priority === 'best' ? 'from-green-500 to-emerald-500' :
                          rec.priority === 'good' ? 'from-blue-500 to-cyan-500' :
                            'from-purple-500 to-pink-500'
                        }
                        shadow-lg
                      `}>
                        {rec.priority === 'best' ? 'En Uygun' :
                          rec.priority === 'good' ? 'Uygun' : 'Alternatif'}
                      </div>
                    </div>

                    <div className="space-y-3 pt-8">
                      <h3 className="text-xl font-bold text-center group-hover:gradient-text transition-all duration-300">
                        {rec.title}
                      </h3>

                      <p className="text-sm text-gray-300 text-center">
                        {rec.description}
                      </p>

                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400">
                          <span className="font-semibold text-purple-400">Kullanım:</span>
                          <br />
                          {rec.useCase}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Viewer */}
            {selectedChart && (
              <ChartViewer
                chartType={selectedChart}
                data={data}
                title={recommendations.find(r => r.type === selectedChart)?.title}
              />
            )}
          </>
        )}

        {/* Features Section (only show when no data) */}
        {data.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
            <div className="card text-center space-y-3">
              <div className="text-4xl">📁</div>
              <h3 className="text-xl font-bold">Kolay Yükleme</h3>
              <p className="text-sm text-gray-400">
                Excel ve CSV dosyalarınızı sürükle-bırak ile kolayca yükleyin
              </p>
            </div>

            <div className="card text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-xl font-bold">Akıllı Analiz</h3>
              <p className="text-sm text-gray-400">
                Verileriniz otomatik analiz edilir ve en uygun grafikler önerilir
              </p>
            </div>

            <div className="card text-center space-y-3">
              <div className="text-4xl">🎨</div>
              <h3 className="text-xl font-bold">İnteraktif Grafikler</h3>
              <p className="text-sm text-gray-400">
                10+ farklı grafik tipi, renk paletleri ve dışa aktarma seçenekleri
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-strong border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              <p>© 2024 DataViz AI - Akıllı Veri Görselleştirme Platformu</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-purple-400 transition-colors">
                Hakkında
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Dokümantasyon
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                İletişim
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot context={chatbotContext} />
    </div>
  );
}

export default App;
