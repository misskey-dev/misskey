import * as fs from 'fs';
const minify = require('html-minifier').minify;

export default () => ({
	enforce: 'pre',
	test: /\.vue$/,
	exclude: /node_modules/,
	loader: 'string-replace-loader',
	query: {
		search: /^<template>([\s\S]+?)\r?\n<\/template>/,
		replace: html => {
			return minify(html, {
				collapseWhitespace: true,
				collapseInlineTagWhitespace: true,
				keepClosingSlash: true
			});
		}
	}
});
