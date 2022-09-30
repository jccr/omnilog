const pluginTester = require('babel-plugin-tester').default
const babelPlugin = require('../babel-plugin')

pluginTester({
  pluginName: 'babel-plugin',
  plugin: babelPlugin,
  filename: __filename,
  babelOptions: {
    plugins: ['@babel/plugin-syntax-jsx'],
  },
  tests: {
    'does not change code with no identifiers': `alert('hello')`,
    'changes this code': {
      code: `console.log('hello')`,
      output: `omnilog.log('hello', 'unknown:1:0')()`,
    },
    'using fixtures file': {
      fixture: '__fixtures__/hello-world.jsx',
      snapshot: true,
    },
    'using jest snapshots': {
      code: `
        var foo = 1
        if (foo) console.log(foo)

        console.log('hello world')

        console.log('hello world', 'foo', 'bar')

        console.log(foo ? 'yes' : 'no'); // comment
      `,
      snapshot: true,
    },
  },
})
