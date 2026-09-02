import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, CheckSquare, Square, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Car {
    id: string;
    make: string;
    model: string;
    variant: string | null;
    year: number;
    images: string[] | null;
    thumbnail: string | null;
}

interface Props {
    car: Car;
    isOpen: boolean;
    onClose: () => void;
}

interface DownloadProgress {
    status: 'idle' | 'downloading' | 'completed' | 'cancelled' | 'error';
    current: number;
    total: number;
    currentFileName: string;
    message: string;
}

const DownloadPhotosModal: React.FC<Props> = ({ car, isOpen, onClose }) => {
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [downloadingSingle, setDownloadingSingle] = useState<Record<number, boolean>>({});
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
        status: 'idle',
        current: 0,
        total: 0,
        currentFileName: '',
        message: ''
    });

    const cancelRequestedRef = useRef<boolean>(false);

    const allImages = car.images && car.images.length > 0 
        ? car.images 
        : (car.thumbnail ? [car.thumbnail] : []);

    // Initialize all photos as selected
    useEffect(() => {
        if (isOpen) {
            setSelectedIndexes(allImages.map((_, i) => i));
            setDownloadProgress({ status: 'idle', current: 0, total: 0, currentFileName: '', message: '' });
            cancelRequestedRef.current = false;
        }
    }, [isOpen, car, allImages.length]);

    if (!isOpen) return null;

    // Helper to get image full URL
    const getImageUrl = (img: string) => {
        if (img.startsWith('http')) return img;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        return `${supabaseUrl}/storage/v1/object/public/car-images/${img}`;
    };

    // Helper to download single photo
    const downloadSingle = async (index: number) => {
        const img = allImages[index];
        if (!img) return;

        setDownloadingSingle(prev => ({ ...prev, [index]: true }));
        try {
            const imgUrl = getImageUrl(img);
            const isFullUrl = img.startsWith('http');
            const fileExt = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const fileName = `${car.year}_${car.make}_${car.model}_photo_${index + 1}.${fileExt}`.replace(/\s+/g, '_');

            let blob: Blob;
            if (!isFullUrl) {
                // If it's a Supabase path, download via client SDK
                const { data, error } = await supabase.storage.from('car-images').download(img);
                if (error) throw error;
                if (!data) throw new Error('Failed to retrieve image data');
                blob = data;
            } else {
                // Fetch external URL
                const response = await fetch(imgUrl);
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                blob = await response.blob();
            }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error('Error downloading photo:', error);
            // Fallback: Open in new tab
            window.open(getImageUrl(img), '_blank');
        } finally {
            setDownloadingSingle(prev => ({ ...prev, [index]: false }));
        }
    };

    // Helper sleep for pacing sequential downloads
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Cancel sequential download
    const handleCancelDownload = () => {
        cancelRequestedRef.current = true;
        setDownloadProgress(prev => ({
            ...prev,
            status: 'cancelled',
            message: 'Download stopped by user.'
        }));
    };

    // Helper to download selected photos sequentially (one after another)
    const downloadSelectedSequentially = async () => {
        if (selectedIndexes.length === 0) return;

        cancelRequestedRef.current = false;
        const total = selectedIndexes.length;
        const carSlug = `${car.year}_${car.make}_${car.model}`.replace(/\s+/g, '_');

        setDownloadProgress({
            status: 'downloading',
            current: 0,
            total,
            currentFileName: '',
            message: `Starting download of ${total} photos...`
        });

        try {
            for (let i = 0; i < total; i++) {
                if (cancelRequestedRef.current) {
                    break;
                }

                const imgIndex = selectedIndexes[i];
                const img = allImages[imgIndex];
                if (!img) continue;

                const imgUrl = getImageUrl(img);
                const isFullUrl = img.startsWith('http');
                const fileExt = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
                const fileName = `${carSlug}_photo_${imgIndex + 1}.${fileExt}`;

                setDownloadProgress({
                    status: 'downloading',
                    current: i + 1,
                    total,
                    currentFileName: fileName,
                    message: `Downloading photo ${i + 1} of ${total}: ${fileName}`
                });

                let blob: Blob;
                if (!isFullUrl) {
                    const { data, error } = await supabase.storage.from('car-images').download(img);
                    if (error) throw error;
                    if (!data) throw new Error(`Failed to retrieve image data for index ${imgIndex}`);
                    blob = data;
                } else {
                    const response = await fetch(imgUrl);
                    if (!response.ok) throw new Error(`Fetch failed for URL ${imgUrl}`);
                    blob = await response.blob();
                }

                if (cancelRequestedRef.current) break;

                // Trigger direct file download
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

                // Controlled delay between files (400ms) to ensure the browser processes each download cleanly
                if (i < total - 1) {
                    await sleep(400);
                }
            }

            if (cancelRequestedRef.current) {
                setDownloadProgress(prev => ({
                    ...prev,
                    status: 'cancelled',
                    message: 'Download was cancelled.'
                }));
            } else {
                setDownloadProgress({
                    status: 'completed',
                    current: total,
                    total,
                    currentFileName: '',
                    message: `All ${total} photos downloaded successfully!`
                });

                setTimeout(() => {
                    setDownloadProgress({ status: 'idle', current: 0, total: 0, currentFileName: '', message: '' });
                    onClose();
                }, 1800);
            }
        } catch (error: any) {
            console.error('Error downloading photos sequentially:', error);
            setDownloadProgress({
                status: 'error',
                current: 0,
                total,
                currentFileName: '',
                message: error?.message || 'Failed to download some photos. Please try again or download individually.'
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIndexes.length === allImages.length) {
            setSelectedIndexes([]);
        } else {
            setSelectedIndexes(allImages.map((_, i) => i));
        }
    };

    const toggleSelectPhoto = (index: number) => {
        setSelectedIndexes(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index) 
                : [...prev, index]
        );
    };

    const isBusy = downloadProgress.status === 'downloading';

    const handleModalClose = () => {
        if (isBusy) {
            cancelRequestedRef.current = true;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => !isBusy && handleModalClose()}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-primary font-display flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent text-[22px]">download</span>
                            Download Vehicle Photos
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">
                            {car.year} {car.make} {car.model} {car.variant ? `· ${car.variant}` : ''}
                        </p>
                    </div>
                    <button 
                        onClick={handleModalClose}
                        disabled={isBusy}
                        className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Overlay */}
                <AnimatePresence>
                    {(isBusy || downloadProgress.status === 'completed' || downloadProgress.status === 'cancelled') && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 text-center"
                        >
                            {downloadProgress.status === 'downloading' && (
                                <>
                                    <div className="relative mb-4">
                                        <Loader2 className="size-12 text-accent animate-spin" />
                                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-primary">
                                            {downloadProgress.total > 0 ? Math.round((downloadProgress.current / downloadProgress.total) * 100) : 0}%
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-primary font-display text-base">Downloading Photos Directly</h4>
                                    <p className="text-slate-600 text-xs mt-1 font-medium">
                                        Photo {downloadProgress.current} of {downloadProgress.total}
                                    </p>
                                    {downloadProgress.currentFileName && (
                                        <p className="text-slate-400 text-[11px] mt-0.5 font-mono max-w-sm truncate">
                                            {downloadProgress.currentFileName}
                                        </p>
                                    )}

                                    {downloadProgress.total > 0 && (
                                        <div className="w-72 bg-slate-100 h-2.5 rounded-full overflow-hidden mt-4 border border-slate-200">
                                            <div 
                                                className="bg-accent h-full transition-all duration-300 rounded-full"
                                                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    )}

                                    <p className="text-[11px] text-slate-400 mt-4 max-w-xs">
                                        Photos are downloading one after another into your device's Downloads folder.
                                    </p>

                                    <button
                                        onClick={handleCancelDownload}
                                        className="mt-6 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                                    >
                                        Cancel Download
                                    </button>
                                </>
                            )}

                            {downloadProgress.status === 'completed' && (
                                <>
                                    <CheckCircle2 className="size-12 text-emerald-500 mb-3 animate-bounce" />
                                    <h4 className="font-bold text-primary font-display text-base">Download Complete!</h4>
                                    <p className="text-slate-500 text-xs mt-1 max-w-sm">{downloadProgress.message}</p>
                                </>
                            )}

                            {downloadProgress.status === 'cancelled' && (
                                <>
                                    <AlertCircle className="size-12 text-amber-500 mb-3" />
                                    <h4 className="font-bold text-primary font-display text-base">Download Stopped</h4>
                                    <p className="text-slate-500 text-xs mt-1 max-w-sm">{downloadProgress.message}</p>
                                    <button
                                        onClick={() => setDownloadProgress({ status: 'idle', current: 0, total: 0, currentFileName: '', message: '' })}
                                        className="mt-4 px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-light transition-colors"
                                    >
                                        Back to Photos
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selection Toolbar */}
                {allImages.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 text-xs font-semibold">
                        <button 
                            onClick={toggleSelectAll}
                            disabled={isBusy}
                            className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors disabled:opacity-50"
                        >
                            {selectedIndexes.length === allImages.length ? (
                                <CheckSquare size={16} className="text-accent" />
                            ) : (
                                <Square size={16} className="text-slate-400" />
                            )}
                            {selectedIndexes.length === allImages.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-slate-500">
                            {selectedIndexes.length} of {allImages.length} selected
                        </span>
                    </div>
                )}

                {/* Image Grid Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {allImages.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            <span className="material-symbols-outlined text-4xl mb-2 block">image_not_supported</span>
                            No photos available for this vehicle.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {allImages.map((img, i) => {
                                const isSelected = selectedIndexes.includes(i);
                                const isSingleDownloading = downloadingSingle[i];
                                
                                return (
                                    <div 
                                        key={i} 
                                        className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 bg-slate-50 transition-all ${
                                            isSelected ? 'border-accent shadow-md' : 'border-slate-100'
                                        }`}
                                    >
                                        {/* Image */}
                                        <img 
                                            src={getImageUrl(img)} 
                                            alt="" 
                                            className={`w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105 ${
                                                isSelected ? 'opacity-100' : 'opacity-60'
                                            }`} 
                                        />

                                        {/* Checkbox Overlay */}
                                        <button
                                            onClick={() => toggleSelectPhoto(i)}
                                            disabled={isBusy}
                                            className="absolute top-2.5 left-2.5 size-6 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer text-white"
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={16} className="text-accent" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>

                                        {/* Hover Single Download button */}
                                        <button
                                            onClick={() => downloadSingle(i)}
                                            disabled={isBusy || isSingleDownloading}
                                            className="absolute bottom-2.5 right-2.5 size-8 rounded-xl flex items-center justify-center bg-white/95 text-primary hover:bg-white shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 md:opacity-0 focus:opacity-100"
                                            title="Download this photo"
                                        >
                                            {isSingleDownloading ? (
                                                <Loader2 size={16} className="animate-spin text-accent" />
                                            ) : (
                                                <Download size={16} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {downloadProgress.status === 'error' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl text-center">
                            {downloadProgress.message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400 hidden sm:block">
                        Downloads directly as individual photos without ZIP
                    </p>
                    <div className="flex items-center gap-3 ml-auto">
                        <button 
                            onClick={handleModalClose}
                            disabled={isBusy}
                            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-white transition-colors disabled:opacity-50"
                        >
                            Close
                        </button>
                        <button 
                            onClick={downloadSelectedSequentially}
                            disabled={selectedIndexes.length === 0 || isBusy}
                            className="px-5 py-2.5 bg-accent text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Download size={16} />
                            Download Selected Photos ({selectedIndexes.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadPhotosModal;
