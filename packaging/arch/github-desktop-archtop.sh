#!/bin/sh
# Thin launcher for the Archtop build of GitHub Desktop.
#
# The application keeps upstream's internal executable name ('desktop'); this
# wrapper only exists so the package can expose a descriptive command and so
# the .desktop entry has a stable Exec= target.
#
# To force native Wayland instead of XWayland, run with:
#   github-desktop-archtop --ozone-platform-hint=auto
# All arguments, including deep links passed by the desktop entry's %U, are
# forwarded unchanged.

# Electron binaries start as a plain Node process when ELECTRON_RUN_AS_NODE is
# set, exiting 0 without ever opening a window. Any terminal hosted inside an
# Electron app (VS Code, and editors built on it) exports it, so launching from
# there would silently do nothing.
unset ELECTRON_RUN_AS_NODE

exec /opt/github-desktop-archtop/desktop "$@"
