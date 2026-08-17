# Ported patches

Register of every change carried over from a foreign fork (`desktop-plus/desktop-plus`,
`shiftkey/desktop`) or otherwise deviating from `desktop/desktop:development`.

This file is technical debt documentation. Review it on **every** upstream sync:
each entry is a reason the next merge could conflict, and some entries stop being
necessary when upstream changes.

## Format

| # | File | Source | Reason | Scope | Removable when |
|---|---|---|---|---|---|

## Entries

| # | File | Source | Reason | Scope | Removable when |
|---|---|---|---|---|---|
| 1 | `script/build.ts` | own work | `assert(existsSync(assetsCarPath))` was unconditional; `Assets.car` is a macOS-only actool artifact, so the assertion aborted every Linux build | `assetsCarPath` is computed only on `darwin`; the assert moved inside that branch | upstream makes the asset optional per platform |
| 2 | `script/build.ts` | own work | `icon:` resolved to `app/static/logos/<channel>/icon-logo`, and that directory contains no PNG — only `.icns`, `.icon`, `.ico` and `Assets.car` | on Linux the icon path points at `app/static/linux/icon-logo.png` | upstream ships a PNG in the channel icon directory |
| 3 | `script/build.ts` | own work | `extraResource: [assetsCarPath]` would copy a macOS asset into the Linux bundle | `extraResource` is empty when `assetsCarPath` is undefined | same as #1 |
| 4 | `script/build.ts` | own work | `osxSign`, `osxNotarize` and `extendInfo` were passed on every platform | each is `undefined` outside `darwin`; `win32metadata` is `undefined` outside `win32` | upstream gates them itself |
| 5 | `script/package.ts` | own work | `yarn package` exited 1 with `I don't know how to package for linux :(` | added `packageLinux()`, which tars the packaged directory; no other branch touched | upstream adds Linux packaging |
| 6 | `package.json` | own work | On Node 26, `yauzl` 2.10 (what `extract-zip` depends on) stops after the first zip entry: no error, promise never settles, process exits 0. Electron's postinstall *and* `@electron/packager` both extract through it, so both produced an app directory holding one `locales/et.pak` while reporting success | `resolutions` pins `yauzl` to `^3.4.0`, which processes the same archive completely (74/74). Build-time only; the shipped application is byte-identical. Replaced an earlier, worse fix that forced `nodejs-lts-krypton` as a makedepend and displaced the user's system Node | `extract-zip` releases a version depending on yauzl 3 |
| 6b | `app/test/globals.mts` | own work | Node 26 defines its own `localStorage` global (gated behind `--localstorage-file`) which shadows the one `global-jsdom` installs, so ~190 tests failed with `Cannot read properties of undefined` | `Object.defineProperty` points the global at jsdom's copy; plain assignment does not work because Node defines it as an accessor. Test setup only — no production code path | `global-jsdom` handles the collision itself |
| 6c | `.prettierignore`, `.eslintignore` | own work | `makepkg` works in place and leaves `packaging/arch/{src,pkg}` behind; neither tool reads `.gitignore`, so `yarn lint` failed on thousands of files inside the build staging directory | added the makepkg working directories to both ignore files | never — inherent to running `makepkg` inside the source tree |
| 7 | `packaging/arch/PKGBUILD` | own work | `libxss` was in the initial dependency list, carried over from AUR `github-desktop-bin` | removed; Electron 42 has no reference to libXss (verified with `objdump -p` and `strings`) | never — re-verify with `objdump` on each Electron bump |
| 8 | `packaging/arch/PKGBUILD` | own work | `makepkg.conf` exports `-Wp,-D_FORTIFY_SOURCE=3` while `printenvz` and `process-proxy` pin `-D_FORTIFY_SOURCE=1` with `-Werror` in their own `binding.gyp`; node-gyp fails on the redefinition, but only under `makepkg` | `build()` strips the makepkg-supplied `_FORTIFY_SOURCE` from `CFLAGS`/`CXXFLAGS`/`CPPFLAGS` | the vendored helpers stop pinning a fortify level, or stop using `-Werror` |
| 9 | `packaging/arch/github-desktop-archtop.sh` | own work | `ELECTRON_RUN_AS_NODE` makes the Electron binary start as plain Node: exits 0, no window. Terminals inside Electron apps (VS Code) export it | launcher unsets it before `exec` | never — this is a property of Electron, not of this build |
| 10 | `packaging/arch/PKGBUILD` | own work | `@electron/packager` emits its output directory as 0700 and `cp -a` carried that into the package, so `/opt/<pkg>` was root-only: the package installed without a warning and started for nobody but root | `package()` runs `chmod -R u=rwX,go=rX` over the install prefix | never — re-check whenever the packager's output handling changes |
| 11 | **`app/src/main-process/main.ts`** | own work | **The only change to application code in this fork.** Deep links had no Linux path at all: `open-url` is macOS-only and the `--protocol-launcher` branch is gated behind `__WIN32__`, while the `.desktop` entry passes the URL as a bare argument via `%U`. The URL reached the process and was silently dropped, so OAuth sign-in could never complete — the window merely came to the front via the unrelated single-instance focus code | added a `__LINUX__` branch that scans `argv` for a registered scheme; the URL-matching logic was extracted into `findAppURLInArguments` and is now shared with the Windows path rather than duplicated. No UI change; Windows and macOS behaviour untouched | upstream accepts a Linux deep-link path — **this is a genuine gap in `desktop/desktop` and is worth submitting there** |

## Not ported, deliberately

- **Nothing from `desktop-plus/desktop-plus` so far.** Its Linux support is entangled
  with the features that fork adds on purpose (commit search, multiple accounts,
  GitLab/Bitbucket/Gitea, commit graph). None of the build-script fixes above needed
  a reference implementation.
- **Nothing from `shiftkey/desktop`.** It sits on 3.4.13 (February 2025); every problem
  it patches has to be re-verified against 3.6.x before its solution is worth copying.

## Explicitly *not* changed, because upstream already handles it

These were audited and left alone. They are recorded here so a future session does not
re-investigate them:

- **Auto-updater.** Already inert on Linux upstream: `app/src/ui/app.tsx:649` returns early
  from `checkForUpdates` when `__LINUX__`, `app/src/main-process/main.ts:141` gates
  `handleSquirrelEvent` behind `__WIN32__`, and `app/src/ui/about/about.tsx:145,200` hide the
  whole update section on Linux. No `__LINUX__` branch was added to
  `app/src/main-process/app-window.ts`.
- **Window icon.** `app/src/main-process/app-window.ts:81` already sets it from
  `static/icon-logo.png`, which `copyStaticResources` populates from `app/static/linux/`.
- **Executable name and `yarn start`.** `script/dist-info.ts:28` and `script/run.ts:20`
  already handle Linux.
- **Shells, editors, notifications.** `app/src/lib/shells/linux.ts`,
  `app/src/lib/editors/linux.ts` and `app/src/main-process/notifications.ts` already have
  Linux implementations.
