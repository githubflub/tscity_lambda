var webpack = require('webpack')
var path = require('path')
var slsw = require('serverless-webpack')
var nodeExternals = require('webpack-node-externals')
var babel_config = require('./babel_config.js')

const root = path.resolve(__dirname)

const webpack_config = {
   entry: slsw.lib.entries,
   resolve: {
      extensions: ['.ts', '.js'], // Look for a .ts file before a .js file
      modules: [path.resolve(root, 'src'), 'node_modules'],
   },
   target: 'node',
   mode: slsw.lib.webpack.isLocal? 'development' : 'production',
   devtool: 'cheap-module-eval-source-map',
   // Make sure this line is doing what you think it's doing.
   externals: [ nodeExternals({ whitelist: [/@tscity\/shared/] }) ],
   plugins: [], // Scroll down to see why I need this.
   module: {
      rules: [

         // Babel
         {
            test: /\.(j|t)sx?$/,
            exclude: {
               test: path.resolve(root, 'node_modules'),
               exclude: /[\S]*(node_modules\/@tscity\/[^ \/]*\/(?!node_modules)[\S]*)$/
            },
            use: [
               {
                  loader: 'babel-loader',
                  options: babel_config,
               }
            ]
         },

         // HTML files
         {
            test: /\.(html)$/,
            use: [
               {
                  loader: 'html-loader',
                  options: {
                     minimize: true,
                  }
               }
            ]
         }
      ]
   }
}

// Fix compatability issues with typegraphql and
// serverless-offline
if (slsw.lib.webpack.isLocal) {
   webpack_config.plugins.push(
      // serverless-offline removed this, so I have to add it myself.
      new webpack.DefinePlugin({ 'process.env.IS_OFFLINE': true }),
   );

   webpack_config.plugins.push(
      /**
       * This is due to the fact the both TypeORM and TypeGraphQL is using a global variable for storage.
       * This is only needed in development.
       *
       * When the module that's been hot reloaded is requested, the decorators are executed again, and we get
       * new entries.
       *
       * @see https://github.com/typeorm/typeorm/blob/ba1798f29d5adca941cf9b70d8874f84efd44595/src/index.ts#L176-L180
       * @see https://github.com/MichalLytek/type-graphql/blob/1eb65b44ca70df1b253e45ee6081bf5838ebba37/src/metadata/getMetadataStorage.ts#L5
       */
      new webpack.BannerPlugin({
         entryOnly: true,
         banner: `
            delete global.TypeGraphQLMetadataStorage; // sls offline and decorators don't play nice.
            // delete global.typeormMetadataArgsStorage; // Don't need this for now.
         `,
         raw: true,
      }),
   );
}

module.exports = webpack_config;