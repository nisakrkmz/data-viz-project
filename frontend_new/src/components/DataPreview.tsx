import React, { useState } from 'react';
import { Table, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { DataRow, DataAnalysis } from '../types';

interface DataPreviewProps {
    data: DataRow[];
    analysis: DataAnalysis;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ data, analysis }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const paginatedData = data.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage
    );

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    const getColumnType = (columnName: string) => {
        const columnInfo = analysis.columns.find(col => col.name === columnName);
        return columnInfo?.type || 'unknown';
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'numeric':
                return 'text-blue-400';
            case 'categorical':
                return 'text-green-400';
            case 'date':
                return 'text-purple-400';
            case 'boolean':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'numeric':
                return '🔢';
            case 'categorical':
                return '🏷️';
            case 'date':
                return '📅';
            case 'boolean':
                return '✓';
            default:
                return '❓';
        }
    };

    if (data.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Table className="w-6 h-6 text-purple-400" />
                        <div className="absolute inset-0 bg-purple-400 blur-lg opacity-50" />
                    </div>
                    <h2 className="text-2xl font-bold gradient-text">
                        Veri Önizleme
                    </h2>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <div className="glass px-4 py-2 rounded-lg">
                        <span className="text-gray-400">Toplam Satır:</span>
                        <span className="ml-2 font-bold text-purple-400">{analysis.rowCount}</span>
                    </div>
                    <div className="glass px-4 py-2 rounded-lg">
                        <span className="text-gray-400">Toplam Sütun:</span>
                        <span className="ml-2 font-bold text-purple-400">{analysis.columnCount}</span>
                    </div>
                </div>
            </div>

            {/* Analysis Summary */}
            <div className="glass-strong rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                    <Info className="w-5 h-5" />
                    <span>Veri Analizi Özeti</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {analysis.columns.slice(0, 4).map((col) => (
                        <div key={col.name} className="glass rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{getTypeIcon(col.type)}</span>
                                <span className="text-xs font-semibold truncate">{col.name}</span>
                            </div>
                            <div className={`text-xs ${getTypeColor(col.type)}`}>
                                {col.type}
                            </div>
                            {col.type === 'numeric' && col.mean !== undefined && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Ort: {col.mean.toFixed(2)}
                                </div>
                            )}
                            {col.type === 'categorical' && (
                                <div className="text-xs text-gray-400 mt-1">
                                    {col.uniqueCount} benzersiz
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {analysis.hasTimeSeries && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <span className="text-purple-400">⏰</span>
                        <span className="text-sm">Zaman serisi verisi tespit edildi</span>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="glass-strong rounded-xl overflow-hidden">
                {/* Scrollable table container - fixed max height */}
                <div className="overflow-auto max-h-96">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-white/10">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 bg-gray-900/95 backdrop-blur-sm">
                                    #
                                </th>
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        className="px-4 py-3 text-left text-xs font-semibold bg-gray-900/95 backdrop-blur-sm whitespace-nowrap"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={getTypeColor(getColumnType(column))}>
                                                {column}
                                            </span>
                                            <span className="text-xs opacity-60">
                                                {getTypeIcon(getColumnType(column))}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                                        {currentPage * rowsPerPage + rowIndex + 1}
                                    </td>
                                    {columns.map((column) => (
                                        <td key={column} className="px-4 py-3 text-sm whitespace-nowrap">
                                            {row[column]?.toString() || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
                        <div className="text-sm text-gray-400">
                            Sayfa {currentPage + 1} / {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
