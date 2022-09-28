console.log('Hello from popup!')
console.info('Does popup have a body?')
console.debug('Going to check in 2 seconds...')
setTimeout(() => {
  console.error('No body tag found!')
}, 2000)
