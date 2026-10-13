# Dasherland Launcher

Custom Electron launcher for the Dasherland Minecraft server: Microsoft account login, Fabric modpack sync, and one-click play.

## Setup

```
npm install
npm start
```

Edit [`launcher.config.json`](launcher.config.json) before shipping:
- `serverAddress` — your server's `host:port`
- `minecraftVersion` / `modLoader` — must match what your server runs
- `manifestUrl` — where you host [`manifest/modpack.json`](manifest/modpack.json) (see below)

## Modpack manifest

The launcher fetches `manifestUrl` on every "Play" click and syncs the local `mods` folder to match exactly (downloads missing/changed mods by SHA-1, deletes anything not listed). Host `manifest/modpack.json` (or your own copy) on any static host/CDN you control, and update it whenever the server's mod list changes — players get the new mods automatically next launch.

## What's implemented vs. stubbed

- **Login** (`src/main/auth.js`) — full Microsoft OAuth via `msmc`, with the resulting token encrypted at rest (Electron `safeStorage`) so returning players skip the login popup.
- **Install + launch** (`src/main/installer.js`, `src/main/launcher.js`) — vanilla + Fabric via `@xmcl/installer`, launched via `minecraft-launcher-core`, auto-connected to `serverAddress`.
- **Forge** — not implemented yet, just a log message placeholder in `launcher.js`. Forge's installer has a different, more involved flow (writes its own version profile); add `ensureForge` in `installer.js` following the same pattern as `ensureFabric` if you need it.
- **Auto-update** — wired via `electron-updater`; you'll need to point `build` config at a real release feed (GitHub Releases is the easiest) before it does anything in production.

## Not yet verified end-to-end

I verified the app boots without errors and all dependencies resolve, but have **not** run a real Microsoft login or a real game launch against a live server — that needs an actual Microsoft account and a running server to test. Before distributing to players:
1. Run `npm start`, click "Sign in with Microsoft", confirm the popup completes and your name shows up.
2. Click "Play" with `manifestUrl` pointing at a real hosted manifest and confirm mods download and the game launches into your server.

## Packaging

```
npm run dist
```

Produces an installer per-platform (NSIS on Windows, DMG on macOS, AppImage on Linux) via `electron-builder`, using the `build` block in `package.json`.
