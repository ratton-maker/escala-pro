import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize Vercel system variables (process.env) if env file doesn't have it
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    // IMPORTANTE: 'base: "./"' permite que o site funcione no GitHub Pages ou qualquer sub-pasta
    base: './',
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the browser code
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});