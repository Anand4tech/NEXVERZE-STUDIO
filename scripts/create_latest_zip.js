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
      item === 'nexverze-studio' ||
      item === 'nexverze-studio-latest.zip' ||
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

console.log('Generating lightweight code ZIP...');
addFolderToZip(process.cwd(), zip);

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  .then((content) => {
    const outPath = path.join(process.cwd(), 'public', 'nexverze-studio-latest.zip');
    fs.writeFileSync(outPath, content);
    console.log(`Successfully created ZIP at ${outPath} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);
  })
  .catch((err) => {
    console.error('Error generating zip:', err);
  });
