const path = require('path');
const { app } = require('electron');
const { Client } = require('minecraft-launcher-core');
const { ensureVanilla, ensureFabric } = require('./installer');
const { fetchManifest, syncMods } = require('./modSync');

function gameDir() {
  return path.join(app.getPath('userData'), 'game');
}

/**
 * Installs/updates the modpack and launches the game, connected to the configured server.
 * @param {object} config - launcher.config.json contents
 * @param {object} authProfile - result of auth.login()/loginSilent(): { name, uuid, mclc }
 * @param {(message: string) => void} onProgress
 * @param {(line: string) => void} onLog
 */
async function playNow(config, authProfile, onProgress, onLog) {
  const root = gameDir();
  const minecraftLocation = root;

  await ensureVanilla(config.minecraftVersion, minecraftLocation, onProgress);

  let versionSpec = { number: config.minecraftVersion, type: 'release' };
  if (config.modLoader?.type === 'fabric') {
    const customId = await ensureFabric(
      config.minecraftVersion,
      config.modLoader.version,
      minecraftLocation,
      onProgress
    );
    versionSpec = { number: config.minecraftVersion, type: 'custom', custom: customId };
  } else if (config.modLoader?.type === 'forge') {
    onProgress('Forge support: install the Forge version json into the versions folder, then set versionSpec.custom to its id.');
  }

  if (config.manifestUrl) {
    onProgress('Checking modpack manifest...');
    const manifest = await fetchManifest(config.manifestUrl);
    await syncMods(manifest, path.join(root, 'mods'), onProgress);
  }

  const launcher = new Client();
  launcher.on('debug', (line) => onLog(`[debug] ${line}`));
  launcher.on('data', (line) => onLog(line));

  onProgress('Launching Minecraft...');
  const [host, port] = (config.serverAddress || '').split(':');

  const proc = await launcher.launch({
    authorization: authProfile.mclc,
    root,
    version: versionSpec,
    memory: { max: '4G', min: '2G' },
    server: host ? { host, port: port ? Number(port) : 25565 } : undefined,
  });

  return proc;
}

module.exports = { playNow };
