// Setjoo: upstream components hardcode Postiz's purple/pink as Tailwind arbitrary values
// (bg-[#612BD3] etc.). Remapping them in the generated CSS keeps those files untouched.
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
    [new RegExp(`#${from}\\b`, 'gi'), `#${to}`],
    [new RegExp(`\\b${a}(\\s*,\\s*|\\s+)${b}(?:\\1)${c}\\b`, 'g'), `${x}$1${y}$1${z}`],
  ];
});

const remap = (value) =>
  RULES.reduce((out, [re, to]) => out.replace(re, to), value);

module.exports = () => ({
  postcssPlugin: 'setjoo-brand',
  Declaration(decl) {
    const value = remap(decl.value);
    if (value !== decl.value) decl.value = value;
  },
});
module.exports.postcss = true;
module.exports.remap = remap;
