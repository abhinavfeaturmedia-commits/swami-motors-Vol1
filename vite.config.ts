import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 3000,
        proxy: {
            '/api': {
                target: 'https://autokundali.com',
                changeOrigin: true,
                secure: false,
                headers: {
                    origin: 'https://autokundali.com',
                    referer: 'https://autokundali.com/'
                },
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('origin', 'https://autokundali.com');
                        proxyReq.setHeader('referer', 'https://autokundali.com/');
                    });
                }
            },
            '/uploads': {
                target: 'https://autokundali.com',
                changeOrigin: true,
                secure: false,
                headers: {
                    origin: 'https://autokundali.com',
                    referer: 'https://autokundali.com/'
                },
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('origin', 'https://autokundali.com');
                        proxyReq.setHeader('referer', 'https://autokundali.com/');
                    });
                }
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'motion': ['framer-motion'],
                    'lucide-icons': ['lucide-react']
                }
            }
        }
    }
});
