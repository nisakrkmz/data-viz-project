import React from 'react';
import { BarChart3, LineChart, ScatterChart, PieChart, AreaChart, Activity } from 'lucide-react';
import type { ChartRecommendation, ChartType } from '../types';

interface ChartRecommendationsProps {
    recommendations: ChartRecommendation[];
    onSelectChart: (chartType: ChartType) => void;
    selectedChart?: ChartType;
}

const chartIcons: Record<ChartType, React.ReactNode> = {
    'bar': <BarChart3 className="w-8 h-8" />,
    'horizontal-bar': <BarChart3 className="w-8 h-8 rotate-90" />,
    'line': <LineChart className="w-8 h-8" />,
    'scatter': <ScatterChart className="w-8 h-8" />,
    'pie': <PieChart className="w-8 h-8" />,
    'area': <AreaChart className="w-8 h-8" />,
    'histogram': <BarChart3 className="w-8 h-8" />,
    'box': <Activity className="w-8 h-8" />,
    'heatmap': <Activity className="w-8 h-8" />,
    'stacked-bar': <BarChart3 className="w-8 h-8" />,
    'multi-line': <LineChart className="w-8 h-8" />,
};

const priorityColors = {
    best: 'from-green-500 to-emerald-500',
    good: 'from-blue-500 to-cyan-500',
    alternative: 'from-purple-500 to-pink-500',
};

const priorityLabels = {
    best: 'En Uygun',
    good: 'Uygun',
    alternative: 'Alternatif',
};

export const ChartRecommendations: React.FC<ChartRecommendationsProps> = ({
    recommendations,
    onSelectChart,
    selectedChart,
}) => {
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Activity className="w-6 h-6 text-purple-400" />
                    <div className="absolute inset-0 bg-purple-400 blur-lg opacity-50" />
                </div>
                <h2 className="text-2xl font-bold gradient-text">
                    Grafik Önerileri
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => (
                    <div
                        key={`${rec.type}-${index}`}
                        onClick={() => onSelectChart(rec.type)}
                        className={`
              card-hover group relative overflow-hidden
              ${selectedChart === rec.type ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/30' : ''}
            `}
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {/* Priority Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <div className={`
                px-3 py-1 rounded-full text-xs font-bold
                bg-gradient-to-r ${priorityColors[rec.priority]}
                shadow-lg
              `}>
                                {priorityLabels[rec.priority]}
                            </div>
                        </div>

                        {/* Icon */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                                <div className={`
                  p-4 rounded-xl glass-strong
                  text-purple-400 group-hover:text-pink-400
                  transition-all duration-300
                  group-hover:scale-110
                `}>
                                    {chartIcons[rec.type]}
                                </div>
                                <div className="absolute inset-0 bg-purple-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
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

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none" />
                    </div>
                ))}
            </div>

            {selectedChart && (
                <div className="glass-strong rounded-xl p-4 border-l-4 border-purple-400 animate-slide-up">
                    <p className="text-sm text-gray-300">
                        <span className="font-semibold text-purple-400">💡 İpucu:</span> Seçili grafiği aşağıda görüntüleyebilir, renk paletini değiştirebilir ve dışa aktarabilirsiniz!
                    </p>
                </div>
            )}
        </div>
    );
};
