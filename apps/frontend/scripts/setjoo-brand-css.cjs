// Setjoo: upstream components hardcode Postiz's purple/pink as Tailwind arbitrary values
// (bg-[#612BD3] etc.). Rewriting them in the built CSS keeps those files untouched.
// Runs after `next build` on every .css file under .next (bundler-independent).
const fs = require('fs');
const path = require('path');

const RED = 'ed1c24';
const MAP = {
  '612bd3': RED, '612ad5': RED, '7236f1': RED, 'fc69ff': RED,
  '8155dd': RED, '7950f2': RED, '832ad5': RED, '3900b2': RED,
  'ebe8ff': 'fde8e9',
};
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
const RULES = Object.entries(MAP).flatMap(([from, to]) => {
  const [a, b, c] = rgb(from);
  const [x, y, z] = rgb(to);
  return [
    // #rrggbb and #rrggbbaa (alpha kept)
    [new RegExp(`#${from}([0-9a-f]{2})?\\b`, 'gi'), `#${to}$1`],
    // rgb(97 43 211 / …) and rgba(97, 43, 211, …)
    [new RegExp(`\\b${a}(\\s*,\\s*|\\s+)${b}(?:\\1)${c}\\b`, 'g'), `${x}$1${y}$1${z}`],
  ];
});

const remap = (css) => RULES.reduce((out, [re, to]) => out.replace(re, to), css);

const cssFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(full);
    return entry.name.endsWith('.css') ? [full] : [];
  });

if (require.main === module) {
  const root = path.resolve(__dirname, '..', process.argv[2] || '.next');
  let changed = 0;
  for (const file of cssFiles(root)) {
    const css = fs.readFileSync(file, 'utf8');
    const out = remap(css);
    if (out !== css) {
      fs.writeFileSync(file, out);
      changed++;
    }
  }
  console.log(`setjoo-brand-css: recoloured ${changed} CSS file(s) in ${root}`);
}

module.exports = { remap };
