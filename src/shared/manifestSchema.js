/**
 * @typedef {Object} ModEntry
 * @property {string} name
 * @property {string} fileName
 * @property {string} url
 * @property {string} sha1
 */

/**
 * @typedef {Object} ModpackManifest
 * @property {string} version
 * @property {string} minecraftVersion
 * @property {{type: 'fabric'|'forge', version: string}} modLoader
 * @property {ModEntry[]} mods
 */

module.exports = {};
