/*
 *
 * This file is based on https://github.com/Redocly/redoc/blob/v2.0.0-rc.26/cli/index.ts
 *
 * Copyright (c) 2015-present, Rebilly, Inc. 
 * Released under the MIT license
 * https://github.com/Redocly/redoc/blob/master/LICENSE
 * 
 */
import * as Koa from 'koa';
import * as React from "react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { genOpenapiSpec } from '../api/openapi/gen-spec';

import { createStore, Redoc } from 'redoc';

module.exports = async (ctx: Koa.Context) => {
	const store = await createStore(genOpenapiSpec(), "/api.json");
	const sheet = new ServerStyleSheet();
	const html = renderToString(sheet.collectStyles(React.createElement(Redoc, { store })));
	const css = sheet.getStyleTags();
	const redocState = sanitizeJSONString(JSON.stringify(await store.toJS()));

	await ctx.render('redoc', {
	html, css, redocState
	});
};

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
