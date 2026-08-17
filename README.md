# Archtop

**[GitHub Desktop](https://github.com/desktop/desktop) packaged natively for Arch Linux.**

Archtop is a fork of `desktop/desktop` that exists for one reason: to produce a real
`.pkg.tar.zst` built from source and linked against the system's own libraries. The
application itself is unmodified upstream.

This is an independent community project. It is not affiliated with, endorsed by, or
supported by GitHub, Inc.

## What makes this different

There is already a good answer to "GitHub Desktop on Linux" —
[Desktop Plus](https://github.com/desktop-plus/desktop-plus) — and Archtop does not try to
replace it. Two things remain unsolved, and they are the whole point of this fork:

1. **A native Arch package.** Built with `makepkg`, linked against the system `libsecret`,
   `gtk3` and `nss`. Not a repackaged `.deb`, not an AppImage.
2. **Zero drift from upstream.** No added features, no UI changes, no rebranding. The only
   deviation is a thin platform layer that lets the build scripts target Linux. Desktop
   Plus deliberately adds commit search, multiple accounts, GitLab/Bitbucket/Gitea support
   and a commit graph; Archtop deliberately adds nothing.

The size of the diff outside `packaging/` is the health metric for this project. Every line
of it is a line that has to be re-reconciled on each upstream sync, so the complete
inventory lives in
[packaging/arch/PORTED-PATCHES.md](packaging/arch/PORTED-PATCHES.md).

## Naming

| Layer | Value |
|---|---|
| Project / brand | Archtop |
| Package | `github-desktop-archtop` |
| Install prefix | `/opt/github-desktop-archtop/` |
| Launcher | `/usr/bin/github-desktop-archtop` |
| Shown in menus as | GitHub Desktop (Archtop) |
| Internal executable | `desktop` — upstream, unchanged |
| `productName` | `GitHub Desktop` — upstream, unchanged |

The brand name is *Archtop*, with no "GitHub" or "Git" in it. The **package** name is
descriptive — it says what is inside, the same way AUR's `github-desktop-bin` does. The
application's own name, bundle ID and company name are left exactly as upstream ships them.

## Installing

### From a release — no compiling

Every release tag publishes a built `.pkg.tar.zst`, so installing takes seconds rather
than the quarter of an hour a source build needs:

```bash
# grab the newest release and its checksum file
gh release download --pattern '*.pkg.tar.zst' --pattern 'SHA256SUMS'

sha256sum -c SHA256SUMS
sudo pacman -U ./github-desktop-archtop-*.pkg.tar.zst
```

Without `gh`, take the same two files from the
[releases page](https://github.com/JamJan05/Archtop/releases).

**Check the checksum.** These packages are built by
[the release workflow](.github/workflows/release.yml), which runs `makepkg`, installs the
result and launches it under a sandbox before publishing anything — but a checksum is what
lets you confirm the file you downloaded is the file that was built.

### From source

```bash
git clone https://github.com/JamJan05/Archtop.git
cd Archtop/packaging/arch
makepkg -s
sudo pacman -U ./*.pkg.tar.zst
github-desktop-archtop
```

Building in a clean chroot (`paru -S --chroot`, `aur build --chroot`) keeps the build
dependencies out of your system entirely, and is the recommended way to do it.

Full build notes, dependency rationale and known limitations:
[packaging/arch/README.md](packaging/arch/README.md).

## Requirements

- Arch Linux x86_64
- A Secret Service provider for credential storage — `gnome-keyring`, `kwallet`, or any
  compatible implementation. Tokens go to the system keyring through `libsecret`; they are
  never written in plaintext.
- Wayland and X11 sessions are both supported. The launcher does not force an Ozone
  backend, so the app runs under XWayland by default; pass `--ozone-platform-hint=auto` for
  native Wayland.

Updates arrive as new package versions. The in-app auto-updater is inactive on Linux —
upstream already disables it there, and a pacman-managed application must not rewrite files
under `/opt`.

## Branches

| Branch | Purpose |
|---|---|
| `development` | A clean mirror of `desktop/desktop:development`. Nothing fork-specific ever lands here. |
| `unstable-linux` | All development, testing and packaging work. Releases from here are prereleases. |
| `stable-linux` | Only versions explicitly promoted by the maintainer. Never merged into automatically. |

Changes flow one way only: `desktop/desktop` → `development` → `unstable-linux` →
`stable-linux`.

### Releases

A release is a **tag**, not a branch state: `v<upstream version>-archtop.<revision>`, for
example `v3.6.5-beta1-archtop.2`. The PKGBUILD builds the newest such tag in the
repository and derives its version from it, so publishing a release is `git tag` plus
`git push origin <tag>` — no file is edited.

Which branch the tag sits on makes no difference. Tag selection is repository-wide,
because `archtop.1` and `archtop.2` are on different branches and any branch-based lookup
finds only one of them. The rule that follows is short:

> **Tagging is publishing.** Commit to `unstable-linux` as freely as you like — nothing
> reaches anyone until a tag is pushed. A tag on `unstable-linux` is just as live as one
> on `stable-linux`.

Prereleases therefore need a scheme that the glob does not match, not a branch. There is
no such scheme yet; until there is, only tag what you want people to build.

## Testing

[packaging/arch/TESTING.md](packaging/arch/TESTING.md) is the checklist to work through on
a real Arch install before a build is considered good. A green checklist is not by itself a
decision that a version is stable.

## Contributing

Bugs in the *application* belong upstream at
[desktop/desktop](https://github.com/desktop/desktop/issues) — this fork does not change
application behaviour, so it cannot fix them. Report packaging, build and Linux integration
problems here.

Pull requests target `unstable-linux`, never `development` or `stable-linux`.

## License

**[MIT](LICENSE)**, inherited from
[desktop/desktop](https://github.com/desktop/desktop).

The MIT license grant is not for GitHub's trademarks, which include the logo designs.
GitHub reserves all trademark and copyright rights in and to all GitHub trademarks.
GitHub's logos include, for instance, the stylized Invertocat designs that include "logo"
in the file title in the following folder: [logos](app/static/logos).

GitHub® and its stylized versions and the Invertocat mark are GitHub's Trademarks or
registered Trademarks. When using GitHub's logos, be sure to follow the GitHub
[logo guidelines](https://github.com/logos).

Archtop does not modify, replace or recombine any GitHub logo, and adds no branding of its
own to the application.
