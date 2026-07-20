import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Every KOL package ships raw source (JSX + import.meta.glob, Vite-only).
    // Excluding only kol-icons wasn't enough: packages that IMPORT it
    // (kol-component, kol-framework) get prebundled and can carry a broken
    // esbuild copy of the icon loader whenever the dep graph changes under a
    // running server. Exclude the whole family — none of them prebundle.
    exclude: [
      '@kolkrabbi/kol-chess',
      '@kolkrabbi/kol-icons',
      '@kolkrabbi/kol-component',
      '@kolkrabbi/kol-framework',
      '@kolkrabbi/kol-dashboards',
    ],
  },
})
