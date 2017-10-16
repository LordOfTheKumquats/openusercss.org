/* eslint no-console:0 */
import 'babel-polyfill'

import Vue from 'vue'
import VeeValidate from 'vee-validate'
import VueRouter from 'vue-router'

import {router} from './vue-modules'
import {store} from './store'
import {runPolyfills} from './utils/features'

import anime from 'animejs'
import log from 'chalk-console'

import appBase from '../../../.tmp/app-base/app-base.vue'

const scriptsStart = Date.now()
const perfStats = {
  'blocking': [],
  'sync':     [],
  'async':    []
}

const polyfills = async () => {
  const polyfillsStart = Date.now()
  const ranPolyfills = await runPolyfills()

  perfStats.sync.push({
    'name': 'polyfills',
    'time': Date.now() - polyfillsStart
  })
  return ranPolyfills
}

const removeLoadingIndicator = async () => {
  const indicatorStart = Date.now()
  const loadingIndicator = document.querySelector('.loading-indicator')
  const node = await anime({
    'targets':  loadingIndicator,
    'bottom':   '100%',
    'duration': 700,
    'easing':   'easeInQuart'
  })

  await node.finished

  loadingIndicator.remove()
  perfStats.async.push({
    'name': 'indicator',
    'time': Date.now() - indicatorStart
  })

  return true
}

const vue = async () => {
  const vueStart = Date.now()

  Vue.use(VueRouter)
  Vue.use(VeeValidate, {
    'errorBagName':  'errors',
    'fieldsBagName': 'fields',
    'delay':         50,
    'locale':        'en',
    'dictionary':    null,
    'strict':        true,
    'classes':       false,
    'classNames':    {
      'touched':   'touched',
      'untouched': 'untouched',
      'valid':     'valid',
      'invalid':   'invalid',
      'pristine':  'pristine',
      'dirty':     'dirty'
    },
    'events':   'input|blur',
    'inject':   true,
    'validity': false,
    'aria':     true
  })

  const app = new Vue({
    store,
    router,
    'el':     'app',
    'render': (handle) => handle(appBase)
  })

  document.querySelector('noscript').remove()

  perfStats.sync.push({
    'name': 'vue',
    'time': Date.now() - vueStart
  })
  return app
}

const loadedFonts = async () => {
  const fontsStart = Date.now()
  const fontset = await document.fonts.ready
  const fontResults = []

  for (const entries of fontset.entries()) {
    await entries.forEach(async (entry) => {
      try {
        const {
          family,
          style,
          weight,
          stretch,
          status
        } = await entry.loaded

        fontResults.push({
          family,
          style,
          weight,
          stretch,
          status
        })
      } catch (error) {
        const {
          family,
          style,
          weight,
          stretch,
          status
        } = entry

        fontResults.push({
          family,
          style,
          weight,
          stretch,
          status
        })
      }
    })
  }

  perfStats.async.push({
    'name': 'fontStats',
    'time': Date.now() - fontsStart
  })
  return fontResults
}

const init = async () => {
  const polyfillsResult = await polyfills()

  await vue()
  const bunch = await Promise.all([
    loadedFonts(),
    removeLoadingIndicator()
  ])

  log.info(`Font statistics: ${JSON.stringify(bunch[0], null, 4)}`)
  log.info(`Needed polyfills on this browser: ${JSON.stringify(polyfillsResult, null, 4)}`)

  return true
}

const main = async () => {
  await init()
  log.info(`Performance statistics: ${JSON.stringify(perfStats, null, 4)}`)
}

main()

perfStats.blocking.push({
  'name': 'mainThread',
  'time': Date.now() - scriptsStart
})