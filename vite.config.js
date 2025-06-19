import { defineConfig } from 'vite';
import restart from 'vite-plugin-restart';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    plugins: [
        tailwindcss(),
        restart({ restart: [ '../static/**', '../src/**' ] })
    ]
});
