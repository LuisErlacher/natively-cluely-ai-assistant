import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { version } from './package.json'

// Inject version so the React frontend can read it via import.meta.env.VITE_APP_VERSION
process.env.VITE_APP_VERSION = version;

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Use relative paths for Electron
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@config": path.resolve(__dirname, "./src/config"),
        },
        // TS/TSX must win over .mjs/.js so an unqualified import of a basename with
        // both a source and a stale/stub sibling always resolves to the real source.
        extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    },
    server: {
        port: 5180,
        watch: {
            ignored: [
                '**/.claude/worktrees/**',
                '**/.code-review-graph/**',
                '**/dist-electron/**',
                '**/release/**',
            ],
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual vendor splits — keep the main bundle below ~500kB
                // gzipped. The previous `vendor` and `ui` chunks lumped
                // framer-motion with React and bundled the entire Radix +
                // lucide surface together, producing a single ~2.4 MB
                // entry. Splitting react from animation libs and editor/
                // markdown stacks gives the browser cache a much finer
                // re-use story — a settings-page tweak no longer invalidates
                // the giant React vendor chunk. Entries are matched by
                // substring against the import path.
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'scheduler'],
                    'animation-vendor': ['framer-motion'],
                    'icon-vendor': ['lucide-react', 'react-icons'],
                    'radix-vendor': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-toast',
                    ],
                    'markdown-vendor': [
                        'react-markdown',
                        'remark-gfm',
                        'remark-math',
                        'rehype-katex',
                        'katex',
                        'react-syntax-highlighter',
                        'react-code-blocks',
                        'marked',
                    ],
                    'media-vendor': [
                        'tesseract.js',
                        'three',
                        'qrcode',
                        'jspdf',
                        'tailwind-merge',
                        'clsx',
                        'class-variance-authority',
                    ],
                    'data-vendor': [
                        '@tanstack/react-query',
                        '@huggingface/transformers',
                        'diff',
                        'axios',
                    ],
                }
            }
        }
    }
})
