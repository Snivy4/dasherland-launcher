const loginScreen = document.getElementById('login-screen');
const playScreen = document.getElementById('play-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const playBtn = document.getElementById('play-btn');
const profileName = document.getElementById('profile-name');
const progressEl = document.getElementById('progress');
const logDetails = document.getElementById('log-details');
const logOutput = document.getElementById('log-output');
const serverNameEl = document.getElementById('server-name');

let currentProfile = null;

function showPlayScreen(profile) {
  currentProfile = profile;
  profileName.textContent = profile.name;
  loginScreen.classList.add('hidden');
  playScreen.classList.remove('hidden');
}

function showLoginScreen() {
  currentProfile = null;
  playScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

async function init() {
  const config = await window.launcherAPI.getConfig();
  serverNameEl.textContent = config.serverName || 'Minecraft Launcher';

  const silentProfile = await window.launcherAPI.loginSilent();
  if (silentProfile) showPlayScreen(silentProfile);
}

loginBtn.addEventListener('click', async () => {
  loginBtn.disabled = true;
  try {
    const profile = await window.launcherAPI.login();
    showPlayScreen(profile);
  } catch (err) {
    alert(`Login failed: ${err.message || err}`);
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await window.launcherAPI.logout();
  showLoginScreen();
});

playBtn.addEventListener('click', async () => {
  playBtn.disabled = true;
  progressEl.classList.remove('hidden');
  logDetails.classList.remove('hidden');
  logOutput.textContent = '';
  try {
    await window.launcherAPI.play(currentProfile);
  } catch (err) {
    progressEl.textContent = `Error: ${err.message || err}`;
  } finally {
    playBtn.disabled = false;
  }
});

window.launcherAPI.onProgress((message) => {
  progressEl.textContent = message;
});

window.launcherAPI.onLog((line) => {
  logOutput.textContent += line + '\n';
  logOutput.scrollTop = logOutput.scrollHeight;
});

window.launcherAPI.onExit((code) => {
  progressEl.textContent = `Game exited (code ${code}).`;
});

init();
