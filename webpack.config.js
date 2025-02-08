const path = require("path");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const { merge } = require("webpack-merge");
const sveltePreprocess = require("svelte-preprocess");
const webpack = require("webpack");

const prod = process.env.production;

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "swyft-logistics",
    projectName: "mfe-styleguide",
    webpackConfigEnv,
    argv,
    orgPackagesAsExternal: false,
  });

  return merge(defaultConfig, {
    entry: path.resolve(process.cwd(), `src/main.ts`),
    output: {
      filename: `bundle.js`,
      libraryTarget: "system",
      path: path.resolve(process.cwd(), "public/build"),
      publicPath: "",
    },
    // modify the webpack config however you'd like to by adding to this object
    module: {
      rules: [
        {
          test: /\.svelte$/,
          use: {
            loader: "svelte-loader",
            options: {
              preprocess: sveltePreprocess(),
            },
          },
        },
        {
          test: /\.ts$/,
          include: [/node_modules/],
          use: {
            loader: "ts-loader",
            options: { allowTsInNodeModules: true },
          },
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|webp)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "fonts/",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".svelte"],
      mainFields: ["svelte", "browser", "module", "main"],
    },
    devServer: {
      port: 8009,
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.APP_API_BASE_URL": `'https://${
          prod ? "gateway-prod" : "gateway-dev"
        }.swyftlogistics.com/stock-movement'`,
        "process.env.PARCEL_MANAGEMENT_API_BASE_URL": `'https://${
          prod ? "legacyadminbacknd-prod" : "legacyadminbacknd-dev"
        }.swyftlogistics.com/api'`,
      }),
    ],
  });
};
