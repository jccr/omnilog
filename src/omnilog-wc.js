import './omnilog'
;(function () {
  if (!globalThis.omnilog) {
    // need omnilog to be defined
    return
  }

  ;['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
    const oldMethod = globalThis.console[method]
    globalThis.console[method] = (...args) => {
      globalThis.omnilog[type](...args, '[console]')
      oldMethod.call(globalThis.console, args)
    }
  })
})()
