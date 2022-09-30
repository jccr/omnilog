;(function () {
  if (globalThis.omnilog) {
    // omnilog is already defined
    return
  }

  let backlog = []
  let processingBacklog = false
  const methods = ['log', 'info', 'warn', 'error', 'debug']
  const sourceRegex = /^\/(([A-z0-9\-\%]+\/)*[A-z0-9\-\%]+$)?(.*?):\d+:\d+$/

  async function sendMessage(message) {
    try {
      if (chrome.tabs) {
        const tabs = await chrome.tabs.query({
          url: `chrome-extension://${chrome.runtime.id}/omnilog.html`,
        })
        if (tabs.length > 0) {
          await chrome.tabs.sendMessage(tabs[0].id, message)
          return true
        } else {
          return false
        }
      } else if (chrome.runtime.sendMessage) {
        await chrome.runtime.sendMessage(message)
        return true
      }
    } catch (error) {
      return false
    }
  }

  async function queueMessage(type, source, ...args) {
    const message = {
      namespace: 'omnilog',
      type,
      args,
      source,
      href: location.href,
      when: Date.now(),
      stack: new Error().stack,
    }
    const success = await sendMessage(message)
    if (!success) {
      backlog.push(message)
    }
  }

  function processBacklog() {
    if (!processingBacklog) {
      processingBacklog = true
      backlog.forEach((message) => {
        sendMessage(message)
      })
      backlog = []
      processingBacklog = false
    }
  }

  async function isReadyForSending() {
    const success = await sendMessage({
      namespace: 'omnilog:ping',
    })
    return success
  }

  ;(async function () {
    const isReady = await isReadyForSending()

    if (!isReady) {
      const interval = setInterval(async () => {
        if (await isReadyForSending()) {
          clearInterval(interval)
          processBacklog()
        }
      }, 100)
    }
  })()

  const consoleMethods = {}
  methods.forEach((method) => {
    consoleMethods[method] = globalThis.console[method]
  })

  globalThis.omnilog = {}

  methods.forEach((type) => {
    globalThis.omnilog[type] = (...args) => {
      if (sourceRegex.test(args.at(-1))) {
        queueMessage(type, args.pop(), ...args)
        return Function.prototype.bind.call(
          consoleMethods[type],
          globalThis.console,
          ...args,
        )
      } else {
        queueMessage(type, null, ...args)
        consoleMethods[type](...args)
        return () => {}
      }
    }
  })
})()
