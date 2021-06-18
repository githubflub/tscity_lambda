module.exports = {
   babelrc: false,
   presets: [
      [
         '@babel/preset-env',
         {
            targets: {
               node: true,
            },
            // Fixes cancerous circular dependency issues with decorators.
            modules: "commonjs"
         }
      ],
      '@babel/preset-typescript'
   ],

   plugins: [
      'lodash',
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', { legacy: true }], // must come before proposal-class-properties
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // silences a warning. needed in conjunction with "loose: true" for
      // @babel/plugin-proposal-class-properties plugin
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      // '@babel/plugin-proposal-optional-chaining',
   ]
}