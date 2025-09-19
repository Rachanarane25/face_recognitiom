import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/face_recognitiom/',  // important for GitHub Pages
  plugins: [react()]
});
