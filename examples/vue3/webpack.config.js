const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/",
    clean: true
  },
  resolve: {
    extensions: [".js", ".vue"]
  },
  module: {
    rules: [
      { test: /\.vue$/, loader: "vue-loader" },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: "vue-smart-svg/loader",
            options: { vueVersion: 3, rawMode: "both" }
          }
        ]
      },
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: "asset/resource"
      }
    ]
  },
  plugins: [new VueLoaderPlugin()],
  devServer: {
    static: path.resolve(__dirname, "public"),
    hot: true,
    port: 5173
  }
};
