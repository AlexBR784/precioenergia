import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/precioenergia/', // Asegúrate de que esta ruta sea correcta
  plugins: [react()],
});