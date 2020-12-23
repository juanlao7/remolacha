const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const GoogleFontsPlugin = require('google-fonts-plugin');

module.exports = {
    entry: './remolacha/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(css|scss|sass)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader']
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: ['file-loader']
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            template: 'index.ejs'
        }),
        new MiniCssExtractPlugin({
            filename: 'bundle.css',
            chunkFilename: 'bundle.css'
        }),
        /*new CopyWebpackPlugin([
            {
                from: 'favicons',
                to: ''
            },
        ]),*/
        new CopyWebpackPlugin([
            {
                from: 'node_modules/material-icons/iconfont',
                to: 'libs/material-icons'
            },
            {
                from: 'libs',
                to: 'libs'
            }
        ]),
        new GoogleFontsPlugin({
            fonts: [
                {
                    family: 'Roboto',
                    variants: ['300', '400', '500', '700']
                },
                {
                    family: 'Roboto Mono',
                    variants: ['300', '400', '500', '700']
                }
            ],
            formats: ['woff2'],
            filename: 'libs/fonts.css'
        })
    ],
    output: {
        filename: 'remolacha.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'remolacha'
    },
    node: {
        fs: 'empty'
    }      
};
