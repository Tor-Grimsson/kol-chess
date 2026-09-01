import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    /* REQUIRED BY scripts/link-chess-package.mjs, harmless without it.
     * Vite resolves a symlink to its real path, so a linked
     * @kolkrabbi/kol-chess imports react from the DS monorepo's own copy
     * (kol-ds-ui/packages/chess/node_modules/react) — two Reacts in one app,
     * which breaks hooks with an error that blames the component instead of
     * the resolution. Deduping pins both to this repo's copy whether the
     * package is linked or installed. */
    /* PIN EVERY SHARED PACKAGE TO ONE COPY.
     *
     * `dedupe`, not `alias`. Only kol-chess is ever linked
     * (scripts/link-chess-package.mjs), but a symlinked package resolves ITS
     * imports from its real location — so the linked kol-chess pulled react
     * AND `@kolkrabbi/kol-component` out of the DS monorepo's workspace, i.e.
     * a second React (breaks hooks) and the component package's UNPUBLISHED
     * source (~30 MIME-type errors loading SVGs this app never asked for).
     *
     * An `alias` fixed the origin and broke the exports map: rewriting the
     * bare specifier to a filesystem path turned
     * `@kolkrabbi/kol-component/utilities/motion` into a literal directory that
     * does not exist, and kol-shell's NavRail 500'd. `dedupe` forces resolution
     * to this project's copy while leaving the package's own `exports` map to
     * do its job. No-op when nothing is linked. */
    dedupe: [
      'react',
      'react-dom',
      '@kolkrabbi/kol-component',
      '@kolkrabbi/kol-icons',
      '@kolkrabbi/kol-theme',
    ],
  },
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
      '@kolkrabbi/kol-shell',
      // onnxruntime-web loads its own wasm through a DYNAMIC IMPORT of a sibling
      // .mjs. Prebundled, Vite rewrites that import and appends `?import`, which
      // makes it try to TRANSFORM a file we serve raw from public/onnx/ — a 500
      // on every attempt and the model silently never loads. Excluded, the
      // runtime resolves its own assets and the override in personality.js is
      // the only thing pointing at them.
      'onnxruntime-web',
    ],
    // kol-component (excluded above) imports react-syntax-highlighter, a
    // CJS chain (lowlight/refractor) that Vite can't serve raw as ESM — the
    // nested form forces the prebundle for that one dep of an excluded parent.
    include: ['@kolkrabbi/kol-component > react-syntax-highlighter'],
  },
})
