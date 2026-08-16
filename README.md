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

```bash
git clone https://github.com/JamJan05/Archtop.git
cd Archtop/packaging/arch
makepkg -s
sudo pacman -U ./*.pkg.tar.zst
github-desktop-archtop
```

**Node 24 is required and it is not Arch's `nodejs`.** On Node 26, `extract-zip` stops
after the first entry of a zip archive without raising, so Electron unpacks to a single
file and the build "succeeds" with an empty application. `makedepends` therefore names
`nodejs-lts-krypton`, and `build()` refuses to run on anything newer.

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
| `linux-unstable` | All development, testing and packaging work. Releases from here are prereleases. |
| `linux-stable` | Only versions explicitly promoted by the maintainer. Never merged into automatically. |

Changes flow one way only: `desktop/desktop` → `development` → `linux-unstable` →
`linux-stable`.

## Testing

[packaging/arch/TESTING.md](packaging/arch/TESTING.md) is the checklist to work through on
a real Arch install before a build is considered good. A green checklist is not by itself a
decision that a version is stable.

## Contributing

Bugs in the *application* belong upstream at
[desktop/desktop](https://github.com/desktop/desktop/issues) — this fork does not change
application behaviour, so it cannot fix them. Report packaging, build and Linux integration
problems here.

Pull requests target `linux-unstable`, never `development` or `linux-stable`.

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
