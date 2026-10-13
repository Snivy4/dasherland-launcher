const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

function sha1OfFile(filePath) {
  const hash = crypto.createHash('sha1');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
  });
}

/**
 * Fetches the modpack manifest from `manifestUrl`.
 * @param {string} manifestUrl
 * @returns {Promise<import('../shared/manifestSchema').ModpackManifest>}
 */
function fetchManifest(manifestUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(manifestUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Syncs the local mods folder to exactly match the manifest: downloads missing/changed
 * mods and removes any .jar not listed in the manifest.
 * @param {import('../shared/manifestSchema').ModpackManifest} manifest
 * @param {string} modsDir
 * @param {(message: string) => void} onProgress
 */
async function syncMods(manifest, modsDir, onProgress) {
  fs.mkdirSync(modsDir, { recursive: true });

  const wanted = new Set(manifest.mods.map((m) => m.fileName));
  const existing = fs.readdirSync(modsDir).filter((f) => f.endsWith('.jar'));

  for (const fileName of existing) {
    if (!wanted.has(fileName)) {
      onProgress(`Removing outdated mod: ${fileName}`);
      fs.unlinkSync(path.join(modsDir, fileName));
    }
  }

  for (const mod of manifest.mods) {
    const dest = path.join(modsDir, mod.fileName);
    const needsDownload = !fs.existsSync(dest) || sha1OfFile(dest) !== mod.sha1;
    if (needsDownload) {
      onProgress(`Downloading mod: ${mod.name}`);
      await download(mod.url, dest);
    }
  }
}

module.exports = { fetchManifest, syncMods };
