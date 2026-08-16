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

exec /opt/github-desktop-archtop/desktop "$@"
