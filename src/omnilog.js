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

  async function queueMessage(type, source, stack, ...args) {
    const mapped = args.map((arg) => {
      // TODO: in the future, should probably use a custom serializer
      // like https://www.npmjs.com/package/object-inspect
      // to handle circular references, functions, and other edge cases
      if (arg === undefined) {
        return '$ol_type_undefined' // undefined is serialized as null otherwise
      }
      if (typeof arg === 'bigint') {
        return arg.toString() + '$ol_type_bigint' // bigint is not serialized otherwise
      }
      return arg
    })

    const message = {
      namespace: 'omnilog',
      type,
      args: mapped,
      source,
      href: location.href,
      when: Date.now(),
      stack: stack ? `\n\n${stack}` : new Error().stack,
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
        queueMessage(type, args.pop(), null, ...args)
        return Function.prototype.bind.call(
          consoleMethods[type],
          globalThis.console,
          ...args,
        )
      } else {
        queueMessage(type, null, null, ...args)
        consoleMethods[type](...args)
        return () => {}
      }
    }
  })

  addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event
    const messageWithStack = [
      message,
      ...(error?.stack?.split('\n').slice(1) || []),
    ].join('\n')
    queueMessage(
      'error',
      `${filename}:${lineno}:${colno}`,
      error?.stack,
      messageWithStack,
    )
  })

  addEventListener('unhandledrejection', (event) => {
    const {
      reason: { message, stack },
    } = event
    const source = stack?.split('at ').at(-1)
    const messageWithStack = [
      `Uncaught (in promise) Error: ${message}`,
      ...stack?.split('\n').slice(1),
    ].join('\n')
    queueMessage('error', source, stack, messageWithStack)
  })
})()
