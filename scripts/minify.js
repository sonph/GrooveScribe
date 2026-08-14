const fs = require('fs');
const path = require('path');
const terser = require('terser');

const jsDir = path.join(__dirname, '..', 'js');
const filesToMinify = [
  'abc2svg-1.js',
  'jsmidgen.js',
  'groove_render.js',
  'groove_audio.js',
  'groove_ui.js',
  'groove_utils.js',
  'groove_writer.js',
  'local_development.js',
];

async function minifyAll() {
  for (const file of filesToMinify) {
    const srcPath = path.join(jsDir, file);
    const minName = file.replace(/\.js$/, '.min.js');
    const destPath = path.join(jsDir, minName);

    if (fs.existsSync(srcPath)) {
      const code = fs.readFileSync(srcPath, 'utf8');
      const result = await terser.minify(code, {
        compress: true,
        mangle: true,
      });
      if (result.error) {
        throw result.error;
      }
      fs.writeFileSync(destPath, result.code, 'utf8');
      const origKb = (code.length / 1024).toFixed(1);
      const minKb = (result.code.length / 1024).toFixed(1);
      console.log(`Minified ${file} -> ${minName} (${origKb} KB -> ${minKb} KB)`);
    }
  }
}

minifyAll().catch((err) => {
  console.error('Minification failed:', err);
  process.exit(1);
});
