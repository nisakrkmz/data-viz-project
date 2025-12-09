import React from 'react';
import { BarChart3, LineChart, ScatterChart, PieChart, AreaChart, Activity, TrendingUp, Sparkles } from 'lucide-react';
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

const priorityConfig = {
    best: {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        glow: 'shadow-emerald-500/50',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: '⭐ En Uygun',
        emoji: '🎯'
    },
    good: {
        gradient: 'from-blue-500 via-cyan-500 to-sky-500',
        glow: 'shadow-blue-500/50',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        label: '✨ Uygun',
        emoji: '👍'
    },
    alternative: {
        gradient: 'from-purple-500 via-pink-500 to-rose-500',
        glow: 'shadow-purple-500/50',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        label: '💡 Alternatif',
        emoji: '🔮'
    },
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <TrendingUp className="w-7 h-7 text-purple-400 animate-pulse" />
                        <div className="absolute inset-0 bg-purple-400 blur-xl opacity-50" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold gradient-text">
                            Grafik Önerileri
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {recommendations.length} farklı görselleştirme seçeneği
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 font-medium">En Uygun</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-blue-400 font-medium">Uygun</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-purple-400 font-medium">Alternatif</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendations.map((rec, index) => {
                    const config = priorityConfig[rec.priority];
                    const isSelected = selectedChart === rec.type;

                    return (
                        <div
                            key={`${rec.type}-${index}`}
                            onClick={() => onSelectChart(rec.type)}
                            className={`
                                relative overflow-hidden rounded-2xl cursor-pointer
                                transition-all duration-300 transform
                                ${isSelected
                                    ? `ring-2 ring-offset-2 ring-offset-gray-900 ring-${config.text.split('-')[1]}-400 scale-105 shadow-2xl ${config.glow}`
                                    : 'hover:scale-105 hover:shadow-xl'
                                }
                            `}
                            style={{
                                animationDelay: `${index * 50}ms`,
                            }}
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`} />

                            {/* Glass Effect */}
                            <div className="relative glass-strong p-5 h-full border border-white/10 hover:border-white/20 transition-colors">
                                {/* Priority Badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    <div className={`
                                        px-2.5 py-1 rounded-full text-[10px] font-bold
                                        bg-gradient-to-r ${config.gradient}
                                        shadow-lg backdrop-blur-sm
                                    `}>
                                        {config.label}
                                    </div>
                                </div>

                                {/* Emoji Indicator */}
                                <div className="absolute top-3 left-3 text-2xl opacity-70">
                                    {config.emoji}
                                </div>

                                {/* Icon */}
                                <div className="flex items-center justify-center mb-4 mt-6">
                                    <div className="relative group">
                                        <div className={`
                                            p-4 rounded-2xl glass
                                            ${config.text}
                                            transition-all duration-300
                                            group-hover:scale-110
                                            border ${config.border}
                                        `}>
                                            {chartIcons[rec.type] || <Activity className="w-8 h-8" />}
                                        </div>
                                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-2.5">
                                    <h3 className={`text-lg font-bold text-center ${config.text} line-clamp-1`}>
                                        {rec.title}
                                    </h3>

                                    <p className="text-xs text-gray-300 text-center line-clamp-2 min-h-[2.5rem]">
                                        {rec.description}
                                    </p>

                                    <div className="pt-2.5 border-t border-white/10">
                                        <p className="text-[11px] text-gray-400 line-clamp-3">
                                            <span className={`font-semibold ${config.text}`}>💡 Kullanım:</span>
                                            <br />
                                            {rec.useCase}
                                        </p>
                                    </div>

                                    {/* Score Indicator */}
                                    {rec.score && (
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-[10px] mb-1">
                                                <span className="text-gray-500">Uygunluk</span>
                                                <span className={`font-bold ${config.text}`}>{Math.round(rec.score * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                                                    style={{ width: `${rec.score * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10 animate-pulse`} />
                                        <Sparkles className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 ${config.text} opacity-20 animate-spin-slow`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Chart Info */}
            {selectedChart && (
                <div className="glass-strong rounded-2xl p-5 border-l-4 border-purple-400 animate-slide-up shadow-xl">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-purple-400 mb-1">
                                Seçili Grafik Hazır!
                            </p>
                            <p className="text-xs text-gray-300">
                                Aşağıda grafiği görüntüleyebilir, renk paletini değiştirebilir ve PNG/SVG formatında dışa aktarabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
