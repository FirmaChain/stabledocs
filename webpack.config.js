const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

let plugins = [
new webpack.NoEmitOnErrorsPlugin(),
new webpack.optimize.OccurrenceOrderPlugin(),
new OptimizeCssAssetsPlugin(),
new webpack.ProvidePlugin({
	$: "jquery",
	jQuery: "jquery"
})
]

let devtool = "source-map"
process.env.NODE_ENV = "development"

console.log("build mode : ", process.env.NODE_ENV)

plugins.push(new webpack.DefinePlugin({
	'process.env': {
		'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
	}
}))

let defaults = {
	context: __dirname,
	devtool: devtool,
	mode:process.env.NODE_ENV,
	resolve: {
		extensions: ['*', '.jsx', '.scss', '.js', '.json', '.txt', '.html'],
		modules: [
		path.join(__dirname, "node_modules"),
		]
	},
	module: {
		rules: [
		{
			test: /(\.js|\.jsx)$/,
			exclude: /(node_modules)/,
			loader: 'babel-loader',
			query: {
				presets:['env','react','stage-2'],
				plugins: [
				"transform-decorators-legacy",
				]
			}
		},
		{
			test: /\.s?css$/,
			use: ['style-loader', 'css-loader', 'sass-loader']
		},
		{
			test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
			use: "url-loader?limit=10000&mimetype=application/font-woff"
		}, {
			test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
			use: "url-loader?limit=10000&mimetype=application/font-woff"
		}, {
			test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
			use: "url-loader?limit=10000&mimetype=application/octet-stream"
		}, {
			test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
			use: "file-loader"
		}, {
			test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
			use: "url-loader?limit=10000&mimetype=image/svg+xml"
		}
		]
	},
	devServer: {
		https: true
	},
	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				uglifyOptions: {
					output: {
						comments: false,
					},
					ecma: 8,
					compress: {
						warnings: false,
					},
					mangle: {
						keep_fnames: true,
					},
				},
				sourceMap: false,
			})
		],
	},
	plugins: plugins
};

//////////////////////
//////web-config//////
let web_bundle = path.join(__dirname, "app", "web", "bin","bundle.js");
let web_bundle_copy_script_plugin = new WebpackShellPlugin({});

module.exports = [{
	...defaults,
	entry: { 
		"bundle":['babel-polyfill', './app/web/client.js'],
		'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry'
	},
	output: { 
		path: path.join(__dirname, "app", "web", 'bin'),
		filename: '[name].js',
		publicPath: "/"
	},
	plugins: [
	...plugins,
	web_bundle_copy_script_plugin
	]
}]