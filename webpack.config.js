const {resolve, join} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = {
    entry: './client/index.js',
    output: {
        path: resolve(__dirname, './client/build'),
        filename: '[name]-[fullhash].js',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ["@babel/plugin-transform-runtime"]
                    }
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    MiniCssExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./client/index.html"
        }),
        new MiniCssExtractPlugin ( {
            filename: '[name]-[fullhash].css'
        })
    ],
    devServer: {
        static: {
            directory: join(__dirname, 'src')
        },
        port: 4001,
    },
    devtool: 'inline-source-map',
}

