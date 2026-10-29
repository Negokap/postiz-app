import { fileURLToPath } from 'node:url';

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    // Setjoo: absolute path so both webpack and Turbopack resolve the local plugin.
    [fileURLToPath(new URL('./postcss.setjoo-brand.cjs', import.meta.url))]: {},
  },
};

export default config;
