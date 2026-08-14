const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = [
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'render.html'),
];

const jsFiles = [
  'groove_render',
  'groove_audio',
  'groove_ui',
  'groove_utils',
  'groove_writer',
  'local_development',
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--unmin');

htmlFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    jsFiles.forEach((name) => {
      if (isDev) {
        // Replace name.min.js with name.js
        const regex = new RegExp(`(src=["'][^"']*${name})\\.min\\.js(["'])`, 'g');
        content = content.replace(regex, '$1.js$2');
      } else {
        // Replace name.js with name.min.js (avoiding double .min.min.js)
        const regex = new RegExp(`(src=["'][^"']*${name})(?<!\\.min)\\.js(["'])`, 'g');
        content = content.replace(regex, '$1.min.js$2');
      }
    });
    fs.writeFileSync(file, content, 'utf8');
    const targetType = isDev ? 'unminified .js' : '.min.js';
    console.log(`Updated script references to ${targetType} in ${path.basename(file)}`);
  }
});
