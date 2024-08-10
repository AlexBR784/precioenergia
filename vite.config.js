import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/precio-luz-app/', // Asegúrate de que esta ruta sea correcta
  plugins: [react()],
});