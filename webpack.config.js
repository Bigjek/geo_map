let webpack = require('webpack');
let HtmlPlugin = require('html-webpack-plugin');
let CleanWebpackPlugin = require('clean-webpack-plugin');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let loaders = require('./webpack.config.loaders')();
let path = require('path');

loaders.push(
    {
        test: /\.(sass|scss)$/,
        loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
    },
    {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=/fonts/[name].[ext]'
    }
);

module.exports = {
    entry: ['./src/index.js', './src/css/styles.scss'],
    output: {
        filename: '[name].js',
        path: path.resolve('dist')
    },
    devtool: 'source-map',
    module: {
        loaders
    },
    plugins: [
        // new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: true,
        //     compress: {
        //         drop_debugger: false
        //     }
        // }),
        new ExtractTextPlugin({ // define where to save the file
            filename: 'css/[name].css',
            allChunks: true,
        }),
        new HtmlPlugin({
            title: 'Loft School sample project',
            template: 'index.hbs'
        }),
        new CleanWebpackPlugin(['dist'])
    ]
};
