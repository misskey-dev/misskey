/*
 *
 * This file is based on https://github.com/Redocly/redoc/blob/v2.0.0-rc.26/cli/index.ts
 *
 * Copyright (c) 2015-present, Rebilly, Inc.
 * Released under the MIT license
 * https://github.com/Redocly/redoc/blob/master/LICENSE
 *
 */

import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import { createStore, Redoc } from 'redoc';

import { genOpenapiSpec } from '../api/openapi/gen-spec';

let cache: object;

module.exports = async (ctx: any) => {
	if (cache) {
		ctx.body = cache;
		return;
	}

	await ctx.render('redoc', await bundle());
	cache = ctx.body;
};

async function bundle() {
	const store = await createStore(genOpenapiSpec(), '/api.json');
	const sheet = new ServerStyleSheet();
	return {
		html: renderToString(sheet.collectStyles(React.createElement(Redoc, { store }))),
		css: sheet.getStyleTags(),
		redocState: sanitizeJSONString(JSON.stringify(await store.toJS()))
	}
}

function sanitizeJSONString(str: string) {
	return escapeClosingScriptTag(escapeUnicode(str));
}

// see http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
function escapeClosingScriptTag(str: string) {
	return str.replace(/<\/script>/g, '<\\/script>');
}

// see http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
function escapeUnicode(str: string) {
	return str.replace(/\u2028|\u2029/g, m => '\\u202' + (m === '\u2028' ? '8' : '9'));
}
