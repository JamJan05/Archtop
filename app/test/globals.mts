import 'fake-indexeddb/auto'
import 'global-jsdom/register'
import { mock } from 'node:test'

// These constants are defined by Webpack at build time, but since tests aren't
// built with Webpack we need to make sure these exist at runtime.
const packageInfo = await import('../package.json')

Object.assign(globalThis, {
  __DEV__: false,
  __TEST__: true,
  __DEV_SECRETS__: false,
  __APP_NAME__: packageInfo.productName,
  __APP_VERSION__: packageInfo.version,
  __RELEASE_CHANNEL__: 'development',
  __UPDATES_URL__: '',
  __SHA__: 'test',
  __DARWIN__: process.platform === 'darwin',
  __WIN32__: process.platform === 'win32',
  __LINUX__: process.platform === 'linux',
  log: {
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
  },

  // The following types are part of the WebWorker support in Node.js and are a
  // common source of hangs in tests due to libraries creating them but not
  // properly cleaning them up. See for example
  // https://github.com/facebook/react/issues/20756, and
  // https://github.com/dexie/Dexie.js/pull/1577.
  //
  // We've upgraded Dexie already but react-dom is a bigger beast and we don't
  // need any of them to run our tests so we just delete them here. In fact,
  // this is exactly what the react-16-node-hanging-test-fix patch does, see
  // https://www.npmjs.com/package/react-16-node-hanging-test-fix?activeTab=code
  MessageChannel: undefined,
  MessagePort: undefined,
  BroadcastChannel: undefined,
})

// Node 26 ships its own `localStorage` global, gated behind --localstorage-file.
// It takes precedence over the one global-jsdom installs, so every read through
// the bare global throws instead of reaching jsdom's implementation — several
// hundred tests fail with "Cannot read properties of undefined". Point the
// global at jsdom's copy explicitly; assignment alone is not enough because
// Node defines it as an accessor.
Object.defineProperty(globalThis, 'localStorage', {
  value: window.localStorage,
  configurable: true,
  writable: true,
})

mock.module('electron', {
  namedExports: {
    clipboard: { writeText: () => {} },
    shell: {},
    ipcRenderer: { on: mock.fn(x => {}) },
  },
})
