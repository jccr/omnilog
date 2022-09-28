// Equivalent to:
//  parcel watch test-extension/manifest.json test-extension/*.html --dist-dir test-extension/dist --config @parcel/config-webextension

import { Parcel } from '@parcel/core'
import { exec } from 'child_process'

console.log('⏳ Building extension...')

let buildSuccess = false

await new Parcel({
  entries: ['test-extension/manifest.json', 'test-extension/*.html'],
  defaultConfig: '@parcel/config-webextension',
  defaultTargetOptions: {
    shouldOptimize: false,
    distDir: 'test-extension/dist',
  },
}).watch((err, event) => {
  if (err) {
    // fatal error
    throw err
  }

  if (event.type === 'buildSuccess') {
    const bundles = event.bundleGraph.getBundles()
    console.log(`📦 Built ${bundles.length} bundles in ${event.buildTime}ms!`)

    if (!buildSuccess) {
      buildSuccess = true
      console.log('🚀 Launching Chrome with test extension...')
      exec('npm run run-extension')
      console.log('👀 Watching for changes...')
    }
  } else if (event.type === 'buildFailure') {
    console.log(event.diagnostics)
  }
})
