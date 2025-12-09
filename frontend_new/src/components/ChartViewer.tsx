import React, { useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
    PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Palette } from 'lucide-react';
import type { ChartType, DataRow, ColorPalette } from '../types';
import { getColorPalette } from '../utils/dataUtils';

interface ChartViewerProps {
    chartType: ChartType;
    data: DataRow[];
    title?: string;
}

const colorPaletteOptions: { name: ColorPalette; label: string; colors: string[] }[] = [
    { name: 'vibrant', label: 'Vibrant', colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'] },
    { name: 'pastel', label: 'Pastel', colors: ['#a8edea', '#fed6e3', '#c3cfe2', '#fbc2eb', '#a6c1ee'] },
    { name: 'monochrome', label: 'Monochrome', colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'] },
    { name: 'sunset', label: 'Sunset', colors: ['#ff6b6b', '#ee5a6f', '#f7b731', '#fa8231', '#fc5c65'] },
    { name: 'ocean', label: 'Ocean', colors: ['#00d2ff', '#3a7bd5', '#00c6ff', '#0072ff', '#00c9ff'] },
];

export const ChartViewer: React.FC<ChartViewerProps> = ({ chartType, data, title }) => {
    const [selectedPalette, setSelectedPalette] = useState<ColorPalette>('vibrant');
    const [showPaletteMenu, setShowPaletteMenu] = useState(false);

    const colors = getColorPalette(selectedPalette);

    // Veri anahtarlarını al
    const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const numericKeys = dataKeys.filter(key => {
        const val = data[0][key];
        return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
    });
    const categoricalKeys = dataKeys.filter(key =>
        !numericKeys.includes(key) // If not numeric, treat as categorical (simplification)
    );

    // Export fonksiyonu (simulated)
    const handleExport = (format: 'png' | 'svg' | 'pdf') => {
        alert(`Grafik ${format.toUpperCase()} formatında dışa aktarılıyor... (Bu bir demo özelliğidir)`);
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 20, right: 30, left: 20, bottom: 20 },
        };

        switch (chartType) {
            case 'bar':
            case 'horizontal-bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart {...commonProps} layout={chartType === 'horizontal-bar' ? 'vertical' : 'horizontal'}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey={chartType === 'horizontal-bar' ? undefined : categoricalKeys[0] || dataKeys[0]}
                                type={chartType === 'horizontal-bar' ? 'number' : 'category'}
                                stroke="#9ca3af"
                            />
                            <YAxis
                                dataKey={chartType === 'horizontal-bar' ? categoricalKeys[0] || dataKeys[0] : undefined}
                                type={chartType === 'horizontal-bar' ? 'category' : 'number'}
                                stroke="#9ca3af"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {numericKeys.slice(0, 3).map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1000}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
            case 'multi-line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={dataKeys[0]} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {numericKeys.slice(0, chartType === 'multi-line' ? 5 : 1).map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    dot={{ fill: colors[index % colors.length], r: 5 }}
                                    activeDot={{ r: 8 }}
                                    animationDuration={1000}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart {...commonProps}>
                            <defs>
                                {numericKeys.slice(0, 3).map((key, index) => (
                                    <linearGradient key={key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={dataKeys[0]} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {numericKeys.slice(0, 3).map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${index})`}
                                    animationDuration={1000}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={numericKeys[0] || dataKeys[0]} stroke="#9ca3af" name={numericKeys[0]} />
                            <YAxis dataKey={numericKeys[1] || dataKeys[1]} stroke="#9ca3af" name={numericKeys[1]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Scatter
                                name="Data Points"
                                data={data}
                                fill={colors[0]}
                                animationDuration={1000}
                            >
                                {data.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'bubble':
                // Bubble chart - 3D scatter (x, y, size)
                const bubbleData = data.map((item, index) => ({
                    x: Number(item[numericKeys[0]]) || 0,
                    y: Number(item[numericKeys[1]]) || 0,
                    z: Number(item[numericKeys[2]]) || 10,
                    name: item[categoricalKeys[0]]?.toString() || `Point ${index + 1}`
                }));

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="x" stroke="#9ca3af" name={numericKeys[0]} />
                            <YAxis dataKey="y" stroke="#9ca3af" name={numericKeys[1]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Scatter name="Bubble Data" data={bubbleData} fill={colors[0]}>
                                {bubbleData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'violin':
                // Violin plot - simplified as grouped box plots with density indication
                const violinData = numericKeys.slice(0, 3).map(key => {
                    const vals = data.map(d => Number(d[key])).filter(v => !isNaN(v)).sort((a, b) => a - b);
                    const q1Index = Math.floor(vals.length * 0.25);
                    const q2Index = Math.floor(vals.length * 0.5);
                    const q3Index = Math.floor(vals.length * 0.75);

                    return {
                        name: key,
                        min: vals[0],
                        q1: vals[q1Index],
                        median: vals[q2Index],
                        q3: vals[q3Index],
                        max: vals[vals.length - 1],
                        mean: vals.reduce((a, b) => a + b, 0) / vals.length
                    };
                });

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={violinData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="q1" stackId="a" fill="transparent" />
                            <Bar dataKey={(d: any) => d.median - d.q1} stackId="a" fill={colors[0]} opacity={0.7} />
                            <Bar dataKey={(d: any) => d.q3 - d.median} stackId="a" fill={colors[1]} opacity={0.7} />
                            <Bar dataKey={(d: any) => d.max - d.q3} stackId="a" fill="transparent" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'radar':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                        <p>Radar Chart implementation coming soon</p>
                    </div>
                );

            case 'pie':
                const pieData = data.slice(0, 8).map((item, index) => ({
                    name: item[categoricalKeys[0] || dataKeys[0]]?.toString() || `Item ${index + 1}`,
                    value: Number(item[numericKeys[0] || dataKeys[1]]) || 0,
                }));

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                animationDuration={1000}
                            >
                                {pieData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'donut':
                const donutData = data.slice(0, 8).map((item, index) => ({
                    name: item[categoricalKeys[0] || dataKeys[0]]?.toString() || `Item ${index + 1}`,
                    value: Number(item[numericKeys[0] || dataKeys[1]]) || 0,
                }));

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                innerRadius={70}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                animationDuration={1000}
                            >
                                {donutData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'histogram':
                // Create histogram bins
                const histogramKey = numericKeys[0] || dataKeys[1];
                const values = data.map(d => Number(d[histogramKey])).filter(v => !isNaN(v));
                const min = Math.min(...values);
                const max = Math.max(...values);
                const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
                const binSize = (max - min) / binCount;

                const bins = Array.from({ length: binCount }, (_, i) => {
                    const binMin = min + i * binSize;
                    const binMax = binMin + binSize;
                    const count = values.filter(v => v >= binMin && v < binMax).length;
                    return {
                        range: `${binMin.toFixed(0)}-${binMax.toFixed(0)}`,
                        count,
                        binMin
                    };
                });

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={bins} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="range"
                                stroke="#9ca3af"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9ca3af" label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill={colors[0]}
                                radius={[8, 8, 0, 0]}
                                animationDuration={1000}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'stacked-bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={categoricalKeys[0] || dataKeys[0]} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {numericKeys.slice(0, 3).map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="a"
                                    fill={colors[index % colors.length]}
                                    radius={index === numericKeys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                    animationDuration={1000}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'grouped-bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={categoricalKeys[0] || dataKeys[0]} stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {numericKeys.slice(0, 3).map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1000}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'box':
                // Calculate box plot statistics for each numeric column
                const boxPlotData = numericKeys.slice(0, 5).map(key => {
                    const vals = data.map(d => Number(d[key])).filter(v => !isNaN(v)).sort((a, b) => a - b);
                    const q1Index = Math.floor(vals.length * 0.25);
                    const q2Index = Math.floor(vals.length * 0.5);
                    const q3Index = Math.floor(vals.length * 0.75);

                    const q1 = vals[q1Index];
                    const median = vals[q2Index];
                    const q3 = vals[q3Index];
                    const iqr = q3 - q1;
                    const minVal = Math.max(vals[0], q1 - 1.5 * iqr);
                    const maxVal = Math.min(vals[vals.length - 1], q3 + 1.5 * iqr);

                    return {
                        name: key,
                        min: minVal,
                        q1,
                        median,
                        q3,
                        max: maxVal,
                        mean: vals.reduce((a, b) => a + b, 0) / vals.length
                    };
                });

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={boxPlotData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            layout="horizontal"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="glass-strong p-3 rounded-lg">
                                                <p className="font-semibold text-purple-400">{data.name}</p>
                                                <p className="text-xs text-gray-300">Max: {data.max.toFixed(2)}</p>
                                                <p className="text-xs text-gray-300">Q3: {data.q3.toFixed(2)}</p>
                                                <p className="text-xs text-gray-300">Median: {data.median.toFixed(2)}</p>
                                                <p className="text-xs text-gray-300">Q1: {data.q1.toFixed(2)}</p>
                                                <p className="text-xs text-gray-300">Min: {data.min.toFixed(2)}</p>
                                                <p className="text-xs text-emerald-400 mt-1">Mean: {data.mean.toFixed(2)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {/* Min to Q1 */}
                            <Bar dataKey="q1" stackId="a" fill="transparent" />
                            {/* Q1 to Median (lower box) */}
                            <Bar dataKey={(d: any) => d.median - d.q1} stackId="a" fill={colors[0]} opacity={0.6} />
                            {/* Median to Q3 (upper box) */}
                            <Bar dataKey={(d: any) => d.q3 - d.median} stackId="a" fill={colors[1]} opacity={0.6} />
                            {/* Q3 to Max (whisker) */}
                            <Bar dataKey={(d: any) => d.max - d.q3} stackId="a" fill="transparent" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'heatmap':
                return (
                    <div className="flex items-center justify-center h-[400px] glass rounded-xl">
                        <div className="text-center space-y-4">
                            <div className="text-6xl">📊</div>
                            <p className="text-xl font-semibold">
                                Heatmap
                            </p>
                            <p className="text-gray-400">
                                Bu grafik tipi için özel kütüphane gerekiyor
                            </p>
                            <p className="text-sm text-gray-500">
                                Demo versiyonunda mevcut değil
                            </p>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-[400px]">
                        <p className="text-gray-400">Grafik tipi desteklenmiyor</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold gradient-text">
                    {title || 'Grafik Görünümü'}
                </h2>

                <div className="flex items-center gap-3">
                    {/* Color Palette Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPaletteMenu(!showPaletteMenu)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Palette className="w-5 h-5" />
                            <span>Renk Paleti</span>
                        </button>

                        {showPaletteMenu && (
                            <div className="absolute right-0 mt-2 glass-strong rounded-xl p-3 space-y-2 z-10 min-w-[200px] animate-scale-in">
                                {colorPaletteOptions.map((palette) => (
                                    <button
                                        key={palette.name}
                                        onClick={() => {
                                            setSelectedPalette(palette.name);
                                            setShowPaletteMenu(false);
                                        }}
                                        className={`
                      w-full flex items-center gap-3 p-2 rounded-lg
                      transition-all duration-200
                      ${selectedPalette === palette.name
                                                ? 'bg-purple-500/30 ring-2 ring-purple-400'
                                                : 'hover:bg-white/5'
                                            }
                    `}
                                    >
                                        <div className="flex gap-1">
                                            {palette.colors.slice(0, 5).map((color, i) => (
                                                <div
                                                    key={i}
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm">{palette.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Export Menu */}
                    <div className="relative group">
                        <button className="btn-secondary flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            <span>Dışa Aktar</span>
                        </button>

                        <div className="absolute right-0 mt-2 glass-strong rounded-xl p-2 space-y-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[150px]">
                            <button
                                onClick={() => handleExport('png')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                PNG
                            </button>
                            <button
                                onClick={() => handleExport('svg')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                SVG
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="glass-strong rounded-2xl p-6">
                {renderChart()}
            </div>
        </div>
    );
};
