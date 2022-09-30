# @jccr/omnilog

_Gotta Log 'Em All!_

![Demo GIF](https://user-images.githubusercontent.com/5132652/192894060-551b4f0f-4a68-48d7-8c39-29d126c19581.gif)

Captures console output from various browser extension sources (background scripts, content scripts, popups, pages), and sends logging to a single user interface. Shows original source and line numbers in the log with the help of a Babel plugin.

Made for Chrome Extensions targetting [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/).

## Usage

In your browser extension project:

1. `npm install @jccr/omnilog --save-dev`
2. If you are using [Babel](https://babeljs.io/docs/en/usage), it's recommended to use the provided plugin:

   ```json
   {
     "plugins": [..., "@jccr/omnilog/babel-plugin.js"]
   }
   ```

   If you only want to use this in development (recommended), you can use this configuration:

   ```json
   {
    "plugins": [...],
    "env": {
       "development": {
         "plugins": ["@jccr/omnilog/babel-plugin.js"]
       }
     }
   }
   ```

   This will transpile your code's `console.*` expressions to an `omnilog.*` wrapper that captures logs while preserving the original source of invocation and line numbers in the browser's devtools.

   If this plugin is not used a fallback `console.*` wrapper will work, but unfortunately won't be able to preserve the source of invocation, and instead will show the source as `omnilog.js`.

   In the future it may be possible to leverage [the solution in this article](https://developer.chrome.com/blog/devtools-better-angular-debugging/#ignore-listing-code); to automatically add the wrapper's source file to the devtools ignore list. You can try to do this manually by adding `omnilog.js` to the "Ignore list" in the devtools settings.

3. To capture logs from your background script (service worker), add this to the top of your script:

   ```js
   // Add console capture functions (omnilog.*)
   import '@jccr/omnilog/omnilog.js'
   // Keep the Omnilog UI open in a pinned tab
   import '@jccr/omnilog/omnilog-sw.js'
   ```

   If you are not using the Babel plugin, you can use the fallback wrapper instead:

   ```js
   // Wrap console functions (console.* -> omnilog.*)
   import '@jccr/omnilog/omnilog-wc.js'
   // Keep the Omnilog UI open in a pinned tab
   import '@jccr/omnilog/omnilog-sw.js'
   ```

4. To capture logs from content scripts, bundle this into your scripts:

   ```
   @jccr/omnilog/omnilog.js
   ```

   If you are not using the Babel plugin, you can use the fallback wrapper instead:

   ```
   @jccr/omnilog/omnilog-wc.js
   ```

   If using Webpack, you could add this as an entry point. Grouped with and preceding your content scripts entry points, if possible.

5. To capture logs from your action popup or extension page, add this to the top of your entry script:

   ```js
   // Add console capture functions (omnilog.*)
   import '@jccr/omnilog/omnilog.js'
   ```

   If you are not using the Babel plugin, you can use the fallback wrapper instead:

   ```js
   // Wrap console functions (console.* -> omnilog.*)
   import '@jccr/omnilog/omnilog-wc.js'
   ```

   If using Webpack and the HTMLWebpackPlugin, you can instead add this to the `chunks` array of the config:

   ```js
    new HTMLWebpackPlugin({
      chunks: ["popup", "omnilog"],
      ...
    })
   ```

   Make sure the entry order has `omnilog` before `popup` in the array:

   ```js
   entry: {
     omnilog: '@jccr/omnilog/omnilog.js', // OR @jccr/omnilog/omnilog-wc.js without the Babel plugin
     popup: './src/popup.js',
   }
   ```

6. Include the `omnilog.html` file as a resource in your extension. This is the user interface that will display the captured logs. You can copy the [`omnilog.html`](omnilog.html) file from this repo in your project as a reference and to modify as needed.
   If using Webpack, you can add these lines to your config:

   ```js
   entry: {
     ..., // your other entry points
     omnilogUi: '@jccr/omnilog/omnilog-ui.js',
   }

   // Add Omnilog UI only to the dev build
   if (process.env.NODE_ENV === 'development') {
     plugins.push(
       new HTMLWebpackPlugin({
         filename: 'omnilog.html',
         template: require.resolve('@jccr/omnilog/omnilog.html'),
         inject: true,
         chunks: ['omnilogUi'],
       })
     );
   }
   ```

## Development

1. `npm install`
2. `npm run build` to build the project
3. `npm run test` to run the tests
4. `npm run start` to start a Chrome instance with a test browser extension for development. This will watch for changes and rebuild the project, but you may need to reload the extension in the browser to see the changes.
