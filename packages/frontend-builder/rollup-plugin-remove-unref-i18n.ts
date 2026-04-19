/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as estreeWalker from 'estree-walker';
import { RolldownMagicString } from 'rolldown';
import { assertType } from './utils.js';
import type { ESTree } from 'rolldown/utils';
import type { Plugin } from 'vite';
import type { CallExpression, Expression } from 'estree';

// This plugin transforms `unref(i18n)` to `i18n` in the code, which is useful for removing unnecessary unref calls
// and helps locale inliner runs after vite build to inline the locale data into the final build.
//
// locale inliner cannot know minifiedSymbol(i18n) is 'unref(i18n)' or 'otherFunctionsWithEffect(i18n)' so
// it is necessary to remove unref calls before minification.
export function pluginRemoveUnrefI18n(
	{
		i18nSymbolName = 'i18n',
	}: {
		i18nSymbolName?: string
	} = {}): Plugin {
	return {
		name: 'UnwindCssModuleClassName',
		renderChunk(code, _chunk, _options, meta) {
			if (!code.includes('unref(i18n)')) return null;
			const ast = this.parse(code);
			const magicString = meta.magicString ?? new RolldownMagicString(code);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(estreeWalker.walk as any)(ast, {
				enter(node: ESTree.Node) {
					if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'unref'
						&& node.arguments.length === 1) {
						// calls to unref with single argument
						const arg = node.arguments[0];
						if (arg.type === 'Identifier' && arg.name === i18nSymbolName) {
							// this is unref(i18n) so replace it with i18n
							// to replace, remove the 'unref(' and the trailing ')'
							assertType<CallExpression>(node);
							assertType<Expression>(arg);
							magicString.remove(node.start, arg.start);
							magicString.remove(arg.end, node.end);
						}
					}
				},
			});

			return magicString;
		},
	};
}
