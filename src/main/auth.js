const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');
const { Auth, tokenUtils } = require('msmc');

const cacheFile = () => path.join(app.getPath('userData'), 'auth-cache.bin');

// The cached blob is the full msmc token (mc.getToken()), which carries the
// MS refresh_token needed to silently re-auth without popping the login window.
function saveToken(tokenObj) {
  if (!safeStorage.isEncryptionAvailable()) return;
  fs.writeFileSync(cacheFile(), safeStorage.encryptString(JSON.stringify(tokenObj)));
}

function loadToken() {
  const file = cacheFile();
  if (!fs.existsSync(file) || !safeStorage.isEncryptionAvailable()) return null;
  try {
    return JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));
  } catch {
    return null;
  }
}

function clearToken() {
  const file = cacheFile();
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function toProfile(mc) {
  const mclcAuth = mc.mclc();
  return { name: mclcAuth.name, uuid: mclcAuth.uuid, mclc: mclcAuth };
}

/** Runs the interactive Microsoft login flow in an Electron popup window. */
async function login() {
  const authManager = new Auth('select_account');
  const xboxManager = await authManager.launch('electron');
  const mc = await xboxManager.getMinecraft();
  saveToken(mc.getToken());
  return toProfile(mc);
}

/** Attempts a silent login using a cached token; returns null if none/invalid. */
async function loginSilent() {
  const cached = loadToken();
  if (!cached) return null;
  try {
    const authManager = new Auth('select_account');
    let mc = tokenUtils.fromToken(authManager, cached);
    mc = await mc.refresh(false); // only refreshes if the cached token actually expired
    saveToken(mc.getToken());
    return toProfile(mc);
  } catch {
    clearToken();
    return null;
  }
}

function logout() {
  clearToken();
}

module.exports = { login, loginSilent, logout };
