# Archtop — Arch Linux package

`github-desktop-archtop` builds [GitHub Desktop](https://github.com/desktop/desktop)
from source into a native `.pkg.tar.zst`, linked against the system's own libraries.
It is not a repackaged `.deb` and not an AppImage.

The application itself is unmodified upstream. Everything specific to this fork lives
in `script/` (platform conditionals) and in this directory. See
[PORTED-PATCHES.md](PORTED-PATCHES.md) for the complete list.

## Naming

| Layer | Value |
|---|---|
| Project / brand | Archtop |
| Package | `github-desktop-archtop` |
| Install prefix | `/opt/github-desktop-archtop/` |
| Launcher | `/usr/bin/github-desktop-archtop` |
| Desktop entry | `/usr/share/applications/github-desktop-archtop.desktop` |
| Shown in menus as | GitHub Desktop (Archtop) |
| Internal executable | `desktop` (upstream, unchanged) |
| `productName` | `GitHub Desktop` (upstream, unchanged) |

The MIT licence covers the code but not GitHub's trademarks (see `README.md` at the
repository root). The package name is descriptive use, which is fine; the product name
is left exactly as upstream ships it.

## Building

```bash
cd packaging/arch
makepkg -s
sudo pacman -U ./*.pkg.tar.zst
```

`makepkg -s` installs the `makedepends` for you. Do not run it as root.

### Why package.json pins yauzl 3

On Node 26, `yauzl` 2.10 — the version `extract-zip` depends on — stops after the **first**
entry of a zip archive. It emits no error and never settles its promise, so the process
simply runs out of work and exits 0. Electron's postinstall and `@electron/packager` both
extract through it, so both produced an application directory holding a single file,
`locales/et.pak`, while reporting success. The build "passed" and the package launched
nothing.

`yauzl` 3.4.0 handles the same archive correctly (74/74 entries), so the root `package.json`
carries a `resolutions` entry pinning it. `extract-zip` is its only consumer, and it runs at
build time only — the shipped application is unaffected.

This is why `makedepends` can name plain `nodejs`: the package builds on current Arch
without displacing anyone's system Node.

### What version gets built

The PKGBUILD builds the **newest release tag**, not a branch. `prepare()` picks the
highest tag matching `_tagglob` (`v*-archtop.*`) in version order and checks it out
detached; `pkgver()` derives the package version from that same tag. Cutting a release is
therefore just:

```bash
git tag v3.6.5-beta1-archtop.3
git push origin v3.6.5-beta1-archtop.3
```

Nothing in the PKGBUILD needs editing. The static `pkgver=` line only exists so `.SRCINFO`
is meaningful to anything reading it without running a build — `makepkg` overwrites it.

Selection is repository-wide, so **the branch a tag sits on is irrelevant**: a tag pushed
to `unstable-linux` is what everyone builds, exactly as one on `stable-linux` would be.
Tagging is publishing. Prereleases need a tag scheme the glob does not match — not a
branch.

`source=` pins **no** git ref — no `#branch=`, no `#tag=`. makepkg clones with `--mirror`,
so every tag in the repository arrives regardless of which ref the clone lands on, and
`prepare()` then checks out the newest release tag. Whichever branch the clone started on
is never read.

Tag selection is repository-wide and version-ordered rather than reachability-based, and
that is deliberate: `archtop.1` and `archtop.2` sit on *different* branches, so
`git describe` from either one finds only half of them.

The glob excludes upstream's `release-*` tags, which are present in this repository too.

### Why there is no branch pin

There used to be a `_gitbranch` variable, and it read `unstable-linux` on **both**
branches — including `stable-linux`, which is the merge of `unstable-linux`, so the line
travelled with the merge and nobody noticed it was now wrong. A PKGBUILD taken from the
stable branch built unstable code.

The obvious repairs are worse than the disease. Editing the line by hand after each merge
is the thing that already failed once. A bot rewriting it on `stable-linux` would create a
commit that exists on stable and not on unstable, so the branches diverge and every
subsequent pull request conflicts — in that exact line.

Deleting the pin removes the failure instead of managing it: with nothing to keep in step,
nothing can fall out of step. `.github/workflows/arch-linux.yml` has a guard step that
fails the build if a pin comes back, and it runs on pull requests too, so it is caught
before a merge rather than after.

## Known limitations

### `build()` needs network access

Arch packaging guidelines want everything downloadable declared in `source=`. That is not
achievable here:

- `yarn install --frozen-lockfile` resolves several hundred packages from the npm registry;
- the Electron 42 binary is fetched by a postinstall script;
- `keytar`, `desktop-trampoline` and `desktop-notifications` are native modules compiled
  during install, against Electron's headers.

Vendoring all of that into `source=` would mean committing a full offline yarn cache and
re-generating it on every dependency bump. Until that is worth the maintenance cost,
`build()` reaches the network. This is a deliberate, documented deviation.

### Version scheme

Release tags are `v<upstream version>-archtop.<revision>`, e.g.
`v3.6.5-beta1-archtop.2`: the upstream version being built, then which Archtop packaging
of it this is. pacman forbids `-` inside `pkgver`, so the dashes become `_` —
`3.6.5_beta1_archtop.2`.

Ordering was checked with `vercmp`, and holds where it needs to:

| Comparison | Result |
|---|---|
| `3.6.5_beta1` → `3.6.5_beta1_archtop.2` | upgrade ✅ |
| `…archtop.2` → `…archtop.10` | upgrade ✅ (numeric, not lexical) |
| `3.6.5_beta2_archtop.1` vs `3.6.5_beta1_archtop.9` | beta2 newer ✅ |
| `3.6.5_beta1_archtop.2` vs `3.6.5_archtop.1` | **beta reported newer ❌** |

The last row is the long-standing prerelease trap, unchanged by the tag scheme: `beta1`
sorts above nothing at all, so a *final* release compares as older than its own beta. Both
`vercmp` and `git tag --sort=-v:refname` get it wrong in the same direction, so the tag
picker inherits it too. When upstream 3.6.5 final is packaged, set `epoch=1`.

### Icon sizes

Only the 512×512 PNG that upstream ships in `app/static/linux/` is installed, into
`hicolor/512x512/apps/`. Icon themes scale it down; no ImageMagick makedepend is pulled
in just to pre-render smaller sizes.

### Chromium sandbox

`chrome-sandbox` is installed mode 755, **not** setuid root. Arch enables unprivileged
user namespaces, so Chromium uses the namespace sandbox. Do not "fix" sandbox problems
with `--no-sandbox`; if the namespace sandbox is unavailable on your system, that is the
thing to investigate.

## Credential storage

Tokens go into the system keyring through `libsecret`, so a Secret Service provider must
be running — `gnome-keyring` under GNOME, `kwallet` under KDE Plasma, or any compatible
implementation. `libsecret` is a hard dependency because `keytar` links against it at both
build and run time; the providers are `optdepends` because which one you want depends on
your desktop.

With no provider running, sign-in cannot be persisted. The application must not fall back
to writing tokens in plaintext.

## Updates

There is no in-app updater on Linux. Upstream already disables it there, and a
pacman-managed application must not rewrite files under `/opt`. Updates arrive as new
package versions.

## Protocol registration under KDE

`app.setAsDefaultProtocolClient` shells out to `xdg-mime`, and on a KDE session
`xdg-mime` calls `qtpaths`. Arch's `qt6-tools` installs `qtpaths6`, not `qtpaths` — so on
a Plasma desktop without `qt5-tools` the registration fails with:

```text
/usr/bin/xdg-mime: line 885: qtpaths: command not found
xdg-mime: application argument missing
```

The app still runs; only the deep-link handler registration is lost. Install `qt5-tools`
if `xdg-mime query default x-scheme-handler/x-github-desktop-auth` comes back empty.

## ELECTRON_RUN_AS_NODE

When that variable is set, the Electron binary starts as a plain Node process: it exits 0
immediately and never opens a window. Terminals hosted inside Electron applications (VS
Code and its derivatives) export it, so running the app from such a terminal appears to do
nothing at all. The installed launcher unsets it; if you run the binary out of `dist/`
directly, clear it yourself:

```bash
env -u ELECTRON_RUN_AS_NODE ./dist/desktop-linux-x64/desktop
```

## Wayland

The launcher does not force an Ozone backend, so the app runs under XWayland by default.
For native Wayland:

```bash
github-desktop-archtop --ozone-platform-hint=auto
```

## Testing

[TESTING.md](TESTING.md) is the checklist to work through on a real Arch install before
a build is considered good.
