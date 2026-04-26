import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore tslib resolution warnings from Firebase
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.id?.includes('tslib')) {
          return;
        }
        if (warning.message?.includes('tslib')) {
          return;
        }
        warn(warning);
      },
    },
  },
});
