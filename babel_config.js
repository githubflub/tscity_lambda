module.exports = {
   babelrc: false,
   presets: [
      [
         '@babel/preset-env',
         {
            targets: {
               node: true,
            }
         }
      ],
      '@babel/preset-typescript'
   ],

   plugins: [
      'lodash',
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', { legacy: true }], // must come before proposal-class-properties
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // '@babel/plugin-proposal-optional-chaining',
   ]
}