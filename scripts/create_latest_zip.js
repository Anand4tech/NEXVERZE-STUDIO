import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

function addFolderToZip(folderPath, zipFolder) {
  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === 'dist' ||
      item === '.git' ||
      item === '.aistudio' ||
      item === 'versions' ||
      item === 'nexverze-studio' ||
      item === 'nexverze-studio-latest.zip' ||
      item === 'nexverze-studio-version-2.zip' ||
      item === 'nexverze-studio-version-2.1.zip' ||
      item === 'nexverze-code-only.zip'
    ) {
      continue;
    }
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addFolderToZip(fullPath, zipFolder.folder(item));
    } else {
      // Exclude large binary mp4 files to keep zip ultra light (< 5MB)
      if (item.endsWith('.mp4')) {
        continue;
      }
      zipFolder.file(item, fs.readFileSync(fullPath));
    }
  }
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Saving present state as Version 2.1 snapshot...');

// 1. Copy present source files into /versions/version-2.1
const v21Dir = path.join(process.cwd(), 'versions', 'version-2.1');
if (!fs.existsSync(v21Dir)) {
  fs.mkdirSync(v21Dir, { recursive: true });
}
copyDirRecursive(path.join(process.cwd(), 'src'), path.join(v21Dir, 'src'));
for (const rootFile of ['server.ts', 'index.html', 'package.json', 'metadata.json', 'vite.config.ts', 'tsconfig.json']) {
  const srcFile = path.join(process.cwd(), rootFile);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(v21Dir, rootFile));
  }
}
fs.writeFileSync(
  path.join(v21Dir, 'VERSION_2_1_MANIFEST.json'),
  JSON.stringify(
    {
      version: '2.1.0',
      label: 'Version 2.1',
      savedAt: new Date().toISOString(),
      features: [
        'Original quality crystal-clear video rendering inside Runway-style rounded cinema frame Hero Theater Stage',
        '30-Day AI Engine Usage Breakdown chart & visualization across Dashboard, History & Analytics, and Credit Wallet',
        'Subtle hover scale and purple/indigo border-glow interactive animation on Showcase Gallery cards',
        'Dedicated workspaces inside Text to Video, Image to Video, Mobile to Cinematic, and Watermark Studio buttons',
        'Remix Prompt upward-floating micro-animation on Showcase Gallery cards with smooth scroll to generator bar',
        'Mobile touch-friendly gesture controls (single-tap Play/Pause, double-tap Audio Mute/Unmute, horizontal swipe Volume tuning, tactile HUD & ripple)',
      ],
    },
    null,
    2
  )
);

// 2. Generate Version 2.1 & Latest ZIP archives in /public
addFolderToZip(process.cwd(), zip);

zip
  .generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  .then((content) => {
    const latestPath = path.join(process.cwd(), 'public', 'nexverze-studio-latest.zip');
    const v21ZipPath = path.join(process.cwd(), 'public', 'nexverze-studio-version-2.1.zip');
    fs.writeFileSync(latestPath, content);
    fs.writeFileSync(v21ZipPath, content);
    console.log(`Successfully saved Version 2.1 snapshot at ${v21Dir} and ${v21ZipPath} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);
  })
  .catch((err) => {
    console.error('Error generating Version 2.1 zip:', err);
  });


