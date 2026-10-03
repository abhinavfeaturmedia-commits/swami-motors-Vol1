import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, type, message };

        setToasts(prev => [...prev.slice(-4), newToast]); // Keep at most 5 toasts on screen

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
    const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
    const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
    const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

    // Bridge browser-native window.alert to sleek non-blocking toasts automatically
    React.useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (msg: any) => {
            const str = String(msg || '');
            if (str.toLowerCase().includes('error') || str.toLowerCase().includes('fail')) {
                error(str);
            } else if (str.toLowerCase().includes('success') || str.includes('✓') || str.toLowerCase().includes('saved') || str.toLowerCase().includes('created')) {
                success(str);
            } else if (str.toLowerCase().includes('warning') || str.toLowerCase().includes('locked') || str.toLowerCase().includes('required')) {
                warning(str);
            } else {
                info(str);
            }
        };
        return () => {
            window.alert = originalAlert;
        };
    }, [showToast, error, success, warning, info]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {/* Floating Toast Notification Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
                {toasts.map(toast => {
                    const isSuccess = toast.type === 'success';
                    const isError = toast.type === 'error';
                    const isWarning = toast.type === 'warning';

                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
                                isSuccess
                                    ? 'bg-emerald-900/95 text-emerald-50 border-emerald-700/60 shadow-emerald-950/20'
                                    : isError
                                    ? 'bg-rose-900/95 text-rose-50 border-rose-700/60 shadow-rose-950/20'
                                    : isWarning
                                    ? 'bg-amber-900/95 text-amber-50 border-amber-700/60 shadow-amber-950/20'
                                    : 'bg-slate-900/95 text-slate-50 border-slate-700/60 shadow-slate-950/20'
                            }`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {isSuccess && <CheckCircle2 className="size-5 text-emerald-400" />}
                                {isError && <AlertCircle className="size-5 text-rose-400" />}
                                {isWarning && <AlertTriangle className="size-5 text-amber-400" />}
                                {!isSuccess && !isError && !isWarning && <Info className="size-5 text-sky-400" />}
                            </div>
                            <div className="flex-1 text-sm font-medium leading-snug">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-white/60 hover:text-white transition-colors p-0.5 rounded-lg"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
