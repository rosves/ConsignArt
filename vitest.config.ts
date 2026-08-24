import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        root: resolve(__dirname, './src'),
    },
    resolve: {
        alias: {
        src: resolve(__dirname, './src'),
        },
    },
});