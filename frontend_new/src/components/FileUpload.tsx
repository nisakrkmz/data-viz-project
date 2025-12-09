import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { parseCSV, parseExcel } from '../utils/dataUtils';
import { uploadDataToBackend, checkBackendHealth } from '../utils/backendApi';
import type { DataRow } from '../types';

interface FileUploadProps {
    onDataLoaded: (data: DataRow[], backendAnalysis?: any) => void;
    onError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Check backend health on mount
    useEffect(() => {
        checkBackendHealth().then(isHealthy => {
            setBackendStatus(isHealthy ? 'online' : 'offline');
            console.log('Backend status:', isHealthy ? '✅ Online' : '⚠️ Offline');
        });
    }, []);

    const handleFile = useCallback(async (file: File) => {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            onError('Geçersiz dosya formatı. Lütfen .xlsx, .xls veya .csv dosyası yükleyin.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadSuccess(false);
        setFileName(file.name);

        try {
            // Progress animation
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            let data: DataRow[] = [];
            let backendAnalysis = null;

            // Always parse full data on frontend
            console.log('📊 Parsing full data on frontend...');
            if (fileExtension === '.csv') {
                const { data: parsedData, meta } = await parseCSV(file);
                data = parsedData;
            } else {
                data = await parseExcel(file);
            }

            // Check for valid data
            if (!data || data.length === 0) {
                alert('Dosya boş veya okunamadı.');
                clearInterval(progressInterval);
                setIsUploading(false);
                setUploadProgress(0);
                return;
            }

            // Try to get backend analysis (for enhanced recommendations)
            if (backendStatus === 'online') {
                try {
                    console.log('📤 Getting backend analysis...');
                    backendAnalysis = await uploadDataToBackend(file);
                    if (backendAnalysis.error) {
                        console.warn('⚠️ Backend analysis failed:', backendAnalysis.message);
                        backendAnalysis = null;
                    } else {
                        console.log('✅ Backend analysis successful');
                    }
                } catch (error) {
                    console.warn('⚠️ Backend analysis failed:', error);
                    backendAnalysis = null;
                }
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!data || data.length === 0) {
                throw new Error('Dosya boş veya okunamadı');
            }

            // Success animation
            setTimeout(() => {
                setUploadSuccess(true);
                onDataLoaded(data, backendAnalysis);

                // Reset after success
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 1500);
            }, 300);

        } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            onError(error instanceof Error ? error.message : 'Dosya yüklenirken bir hata oluştu');
        }
    }, [onDataLoaded, onError, backendStatus]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    return (
        <div className="w-full">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center
          transition-all duration-300 cursor-pointer
          ${isDragging
                        ? 'border-purple-400 bg-purple-500/10 scale-105'
                        : 'border-purple-500/30 glass hover:border-purple-400/50'
                    }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                />

                <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                        {!isUploading && !uploadSuccess && (
                            <>
                                <div className="relative">
                                    <Upload className="w-16 h-16 text-purple-400 animate-float" />
                                    <div className="absolute inset-0 bg-purple-400 blur-xl opacity-30 animate-pulse" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold gradient-text">
                                        Dosyanızı Yükleyin
                                    </h3>
                                    <p className="text-gray-300">
                                        Sürükleyip bırakın veya tıklayarak seçin
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Desteklenen formatlar: .xlsx, .xls, .csv
                                    </p>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass">
                                        <FileSpreadsheet className="w-5 h-5 text-green-400" />
                                        <span className="text-sm">Excel</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass">
                                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                                        <span className="text-sm">CSV</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {isUploading && !uploadSuccess && (
                            <div className="space-y-4 w-full max-w-md">
                                <div className="relative">
                                    <div className="spinner mx-auto" />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-lg font-semibold">{fileName}</p>
                                    <p className="text-gray-300">Yükleniyor...</p>
                                </div>

                                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>

                                <p className="text-sm text-gray-400">{uploadProgress}%</p>
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="space-y-4 animate-scale-in">
                                <div className="relative">
                                    <CheckCircle2 className="w-16 h-16 text-green-400" />
                                    <div className="absolute inset-0 bg-green-400 blur-xl opacity-30 animate-pulse" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-green-400">
                                        Başarılı!
                                    </h3>
                                    <p className="text-gray-300">
                                        {fileName} yüklendi
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
};
