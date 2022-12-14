const methods = ['log', 'info', 'warn', 'error', 'debug']
const cwd = process.cwd()

module.exports = function ({ types: t }) {
  return {
    visitor: {
      CallExpression(path, state) {
        if (
          path.get('callee').isMemberExpression() &&
          path.get('callee.object').isIdentifier({ name: 'console' }) &&
          methods.filter((method) =>
            path.get('callee.property').isIdentifier({ name: method }),
          ).length > 0
        ) {
          let file = state.file.opts.filename || "unknown"
          if (typeof state.opts.resolveFile === 'function') {
            file = state.opts.resolveFile(file)
          }
          file = file.split(cwd)[1] || file
          const fmt = `${file}:${path.node.loc.start.line}:${path.node.loc.start.column}`
          path.replaceWith(
            t.callExpression(
              t.callExpression(
                t.memberExpression(
                  t.identifier('omnilog'),
                  path.get('callee.property').node,
                ),
                [
                  ...path.get('arguments').map((arg) => arg.node),
                  t.stringLiteral(fmt),
                ],
              ),
              [],
            ),
          )
        }
      },
    },
  }
}
