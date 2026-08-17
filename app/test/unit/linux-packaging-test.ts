import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// app/test/unit -> repository root
const projectRoot = join(__dirname, '..', '..', '..')
const archDir = join(projectRoot, 'packaging', 'arch')

const packageName = 'github-desktop-archtop'

const readArchFile = (name: string) => readFileSync(join(archDir, name), 'utf8')

/**
 * Parses the subset of the Desktop Entry format we care about: `key=value`
 * pairs under `[Desktop Entry]`, ignoring comments.
 */
function parseDesktopEntry(contents: string) {
  const entries = new Map<string, string>()
  let inDesktopEntry = false

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue
    }

    if (trimmed.startsWith('[')) {
      inDesktopEntry = trimmed === '[Desktop Entry]'
      continue
    }

    if (!inDesktopEntry) {
      continue
    }

    const separator = trimmed.indexOf('=')
    assert.notEqual(separator, -1, `malformed desktop entry line: ${trimmed}`)
    entries.set(trimmed.slice(0, separator), trimmed.slice(separator + 1))
  }

  return entries
}

/** Reads a top-level `key=value` assignment out of the PKGBUILD. */
function readPkgbuildVar(contents: string, key: string) {
  const match = contents.match(new RegExp(`^${key}=(.*)$`, 'm'))
  assert.notEqual(match, null, `${key} not found in PKGBUILD`)
  return match![1].replace(/^["']|["']$/g, '')
}

// These run on every platform on purpose. The Linux build resolves assets that
// nothing else references, so a Windows or macOS change that moves them would
// otherwise only surface once someone builds on Arch.
describe('linux packaging', () => {
  describe('build assets', () => {
    it('ships the PNG icon that script/build.ts hands to the packager', () => {
      // script/build.ts cannot use getIconDirectory() on Linux: the channel
      // icon directories only hold .icns/.icon/.ico and Assets.car.
      const iconPath = join(
        projectRoot,
        'app',
        'static',
        'linux',
        'icon-logo.png'
      )

      assert.equal(existsSync(iconPath), true, `missing icon at ${iconPath}`)
    })

    it('installs the same icon the app window uses', () => {
      // app/src/main-process/app-window.ts reads static/icon-logo.png, which
      // copyStaticResources populates from app/static/linux.
      const pkgbuild = readArchFile('PKGBUILD')

      assert.match(pkgbuild, /app\/static\/linux\/icon-logo\.png/)
    })
  })

  describe('desktop entry', () => {
    const entry = parseDesktopEntry(readArchFile(`${packageName}.desktop`))

    it('launches through the packaged wrapper and forwards deep links', () => {
      // %U is what makes the URL arrive as an argument rather than being dropped.
      assert.equal(entry.get('Exec'), `/usr/bin/${packageName} %U`)
    })

    it('references the icon under the package name', () => {
      assert.equal(entry.get('Icon'), packageName)
    })

    it('registers every protocol the app answers to', () => {
      const schemes = (entry.get('MimeType') ?? '')
        .split(';')
        .filter(s => s.length > 0)

      for (const scheme of [
        'x-scheme-handler/x-github-client',
        'x-scheme-handler/x-github-desktop-auth',
        'x-scheme-handler/x-github-desktop-dev-auth',
      ]) {
        assert.equal(
          schemes.includes(scheme),
          true,
          `${scheme} is not declared in MimeType`
        )
      }
    })

    it('keeps upstream branding in the displayed name', () => {
      // Section 4.1: the build is marked, the product is not renamed.
      assert.equal(entry.get('Name'), 'GitHub Desktop (Archtop)')
    })

    it('describes the app with upstream wording', () => {
      const appPackage = JSON.parse(
        readFileSync(join(projectRoot, 'app', 'package.json'), 'utf8')
      )

      assert.equal(entry.get('Comment'), appPackage.description)
    })
  })

  describe('launcher', () => {
    it('executes the upstream binary name from the install prefix', () => {
      // The internal executable stays 'desktop'; /usr/bin holds a wrapper, not
      // a second copy of the app.
      const launcher = readArchFile(`${packageName}.sh`)

      assert.match(
        launcher,
        /^exec \/opt\/github-desktop-archtop\/desktop "\$@"$/m
      )
    })

    it('does not disable the Chromium sandbox', () => {
      // Both files warn against the flag in comments, so only executable lines
      // count here.
      const executableLines = (contents: string) =>
        contents
          .split('\n')
          .filter(line => !line.trim().startsWith('#'))
          .join('\n')

      for (const name of [`${packageName}.sh`, 'PKGBUILD']) {
        assert.equal(
          executableLines(readArchFile(name)).includes('--no-sandbox'),
          false,
          `${name} disables the sandbox`
        )
      }
    })
  })

  describe('PKGBUILD', () => {
    const pkgbuild = readArchFile('PKGBUILD')

    it('uses the descriptive package name', () => {
      assert.equal(readPkgbuildVar(pkgbuild, 'pkgname'), packageName)
    })

    it('depends on libsecret, which keytar links against', () => {
      assert.match(pkgbuild, /^\s*'libsecret'$/m)
    })

    it('derives the version from the newest release tag', () => {
      // The version must not go back to being hardcoded: .1 and .2 live on
      // different branches, so anything branch-shaped silently packages an
      // older release. pkgver() is what keeps the two in step.
      assert.match(pkgbuild, /^pkgver\(\) \{$/m, 'PKGBUILD defines no pkgver()')
      assert.match(
        pkgbuild,
        /^prepare\(\) \{$/m,
        'PKGBUILD defines no prepare() to check the tag out'
      )
      assert.match(
        readPkgbuildVar(pkgbuild, '_tagglob'),
        /archtop/,
        '_tagglob must exclude upstream release-* tags'
      )
    })

    it('carries a static pkgver shaped like a release tag', () => {
      // Overwritten by pkgver() at build time; it exists so .SRCINFO means
      // something to a reader that never runs a build, which makes a
      // branch-shaped or stale-shaped value actively misleading.
      assert.match(
        readPkgbuildVar(pkgbuild, 'pkgver'),
        /^\d+\.\d+\.\d+.*_archtop\.\d+$/
      )
    })

    it('stays in sync with .SRCINFO', () => {
      // .SRCINFO is generated by `makepkg --printsrcinfo` and has to be
      // regenerated whenever the PKGBUILD changes.
      const srcinfo = readArchFile('.SRCINFO')

      assert.match(srcinfo, new RegExp(`^pkgname = ${packageName}$`, 'm'))
      assert.match(
        srcinfo,
        new RegExp(`^\tpkgver = ${readPkgbuildVar(pkgbuild, 'pkgver')}$`, 'm')
      )
      assert.match(srcinfo, /^\tsource = .*git\+https:\/\/.*Archtop\.git$/m)
    })

    it('pins no git ref in source', () => {
      // stable-linux is the merge of unstable-linux, so a `#branch=` pin
      // travels with the merge and then packages the wrong branch — which is
      // exactly what happened. The release tag decides what gets built, so
      // there is nothing for a pin to do here.
      for (const [name, contents] of [
        ['PKGBUILD', pkgbuild],
        ['.SRCINFO', readArchFile('.SRCINFO')],
      ]) {
        assert.doesNotMatch(
          contents,
          /source\s*=.*#(branch|tag)=/,
          `${name} pins a git ref in source`
        )
      }
    })
  })

  describe('trademark policy', () => {
    it('leaves upstream identity in app/package.json untouched', () => {
      // Section 4.1: packaging renames nothing inside the application.
      const appPackage = JSON.parse(
        readFileSync(join(projectRoot, 'app', 'package.json'), 'utf8')
      )

      assert.equal(appPackage.productName, 'GitHub Desktop')
      assert.equal(appPackage.bundleID, 'com.github.GitHubClient')
      assert.equal(appPackage.companyName, 'GitHub, Inc.')
    })
  })
})
