# Testing checklist — Archtop on Arch Linux

Work through this on a real Arch install. Nothing here can be signed off from CI or from
an agent environment.

A green checklist is **not** a decision that the build is stable. That decision is the
maintainer's alone.

## Environment

Record what you tested on:

```text
Kernel:            
Session:           Wayland / X11
Desktop:           KDE Plasma / GNOME / other
Secret Service:    gnome-keyring / kwallet / other
Package version:   
Commit:            
```

## 1. Packaging

- [ ] `makepkg -s` completes without running as root
- [ ] `namcap PKGBUILD` — no errors (warnings about the network in `build()` are expected, see README)
- [ ] `namcap ./*.pkg.tar.zst` — no serious errors
- [ ] `sudo pacman -U ./*.pkg.tar.zst` installs cleanly
- [ ] `pacman -Ql github-desktop-archtop` lists only `/opt/github-desktop-archtop/`, `/usr/bin/`, `/usr/share/applications/`, `/usr/share/icons/`, `/usr/share/licenses/`
- [ ] `desktop-file-validate /usr/share/applications/github-desktop-archtop.desktop` — silent
- [ ] `ldd /opt/github-desktop-archtop/desktop | grep 'not found'` — no output
- [ ] every library `ldd` reports is covered by `depends` (this is how the dependency list gets verified, not by copying another package's)
- [ ] `sudo pacman -Rns github-desktop-archtop` removes cleanly, leaving no files in `/opt`

## 2. Launching

- [ ] starts from a terminal: `github-desktop-archtop`
- [ ] starts from the application menu
- [ ] the menu entry reads **GitHub Desktop (Archtop)** and shows the correct icon
- [ ] `xprop WM_CLASS` on the running window matches `StartupWMClass` in the `.desktop` file — if it does not, correct the `.desktop` file, otherwise the window will not group with its launcher icon
- [ ] no `--no-sandbox` anywhere; the app starts with the sandbox intact
- [ ] first run with a clean profile (`rm -rf ~/.config/GitHub\ Desktop`) works

## 3. Protocol handlers

```bash
update-desktop-database ~/.local/share/applications
xdg-mime query default x-scheme-handler/x-github-desktop-auth
```

- [ ] the query returns `github-desktop-archtop.desktop`
- [ ] deep link with the application **closed** opens it and is handled
- [ ] deep link with the application **already running** reaches the existing instance rather than starting a second one
- [ ] launching the app twice results in one window (single-instance lock)

An empty `xdg-mime query` result immediately after install is not necessarily a packaging
bug — the desktop database has to be rebuilt first.

## 4. Authentication and credentials

- [ ] OAuth sign-in completes and control returns to the app
- [ ] restarting the app keeps you signed in
- [ ] with **no** Secret Service running: the app does not hang, shows a comprehensible message, and writes no token in plaintext
- [ ] `secret-tool search --all service GitHub` shows the token stored in the keyring, not on disk
- [ ] no token appears in `~/.config/GitHub Desktop/logs/`

## 5. Git operations

- [ ] clone over HTTPS
- [ ] clone over SSH
- [ ] SSH askpass prompt appears when a key is passphrase-protected
- [ ] add an existing local repository
- [ ] create a commit
- [ ] fetch, pull, push
- [ ] create and switch branches
- [ ] stash and restore changes
- [ ] resolve a merge conflict
- [ ] GPG-sign a commit
- [ ] credential helper works without re-prompting every operation

## 6. System integration

- [ ] open a repository in the terminal (check which terminals are detected on this machine)
- [ ] open a repository in an external editor
- [ ] open a repository in the file manager
- [ ] open a URL in the default browser
- [ ] system notifications appear
- [ ] paths containing spaces work
- [ ] paths containing non-ASCII characters work
- [ ] a repository reached through a symlink works

## 7. Display

- [ ] Wayland session
- [ ] X11 session
- [ ] HiDPI / fractional scaling — no blurred or mis-sized UI
- [ ] window state (size, position, maximised) survives a restart
- [ ] closing the window quits the process (`pgrep -f github-desktop-archtop` returns nothing)

## 8. Appearance

The binding check is the diff (see section 13 of the project prompt), not screenshots.
This section is the optional visual confirmation.

- [ ] welcome screen, sign-in, changes list, diff view, history, settings, repository picker,
      branch picker — light theme
- [ ] the same, dark theme
- [ ] differences are limited to the native window border and system font antialiasing

## Result

```text
Date:              
Tested by:         
Failures:          
Verdict:           
```
