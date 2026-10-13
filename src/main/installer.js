const { getVersionList, install, getFabricLoaderArtifact, installFabric } = require('@xmcl/installer');

// install()/installFabric() are resumable: re-running only re-downloads files
// that are missing or fail checksum validation. Mojang's asset CDN drops a
// small fraction of connections under load, so retrying clears the stragglers.
async function withRetry(task, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await task();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * Ensures the vanilla client for `mcVersion` is installed at `minecraftLocation`.
 * @param {string} mcVersion
 * @param {import('@xmcl/core').MinecraftLocation} minecraftLocation
 * @param {(message: string) => void} onProgress
 */
async function ensureVanilla(mcVersion, minecraftLocation, onProgress) {
  onProgress(`Checking Minecraft ${mcVersion}...`);
  const { versions } = await getVersionList();
  const version = versions.find((v) => v.id === mcVersion);
  if (!version) throw new Error(`Unknown Minecraft version: ${mcVersion}`);
  onProgress(`Installing Minecraft ${mcVersion}...`);
  await withRetry(() => install(version, minecraftLocation));
  return mcVersion;
}

/**
 * Ensures the given Fabric loader version is installed on top of the vanilla client.
 * Returns the resolved version id to pass to the launcher (version.custom).
 * @param {string} mcVersion
 * @param {string} loaderVersion
 * @param {import('@xmcl/core').MinecraftLocation} minecraftLocation
 * @param {(message: string) => void} onProgress
 */
async function ensureFabric(mcVersion, loaderVersion, minecraftLocation, onProgress) {
  onProgress(`Fetching Fabric loader ${loaderVersion}...`);
  const artifact = await getFabricLoaderArtifact(mcVersion, loaderVersion);
  onProgress(`Installing Fabric loader ${loaderVersion}...`);
  const resolvedVersionId = await withRetry(() => installFabric(artifact, minecraftLocation));
  return resolvedVersionId;
}

module.exports = { ensureVanilla, ensureFabric };
