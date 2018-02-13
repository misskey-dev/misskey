import * as fs from 'fs';
const minify = require('html-minifier').minify;
const StringReplacePlugin = require('string-replace-webpack-plugin');

export default () => ({
	enforce: 'pre',
	test: /\.vue$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern: /^<template>([\s\S]+?)\r?\n<\/template>/, replacement: html => {
				return minify(html, {
					collapseWhitespace: true,
					collapseInlineTagWhitespace: true,
					keepClosingSlash: true
				});
			}
		}]
	})
});
