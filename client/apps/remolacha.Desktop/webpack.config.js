const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src', 'boot.ts'),
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
                use: ['ts-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'bundle.css',
            chunkFilename: 'bundle.css'
        }),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, 'backgrounds'),
                to: 'backgrounds'
            }
        ])
    ],
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@material-ui/core': 'MaterialUI'
    },
    output: {
        filename: 'boot.js',
        path: path.resolve(__dirname, '..', '..', 'dist', 'apps', path.basename(__dirname))
    },
    node: {
        fs: 'empty'
    }      
};
