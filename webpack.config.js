const path = require('path');

module.exports = {
  mode: "development",
  entry: './src/modules/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              "@babel/plugin-proposal-class-properties"
            ]
          },

        }
      }
    ]
  }
};
