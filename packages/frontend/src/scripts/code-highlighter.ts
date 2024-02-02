import { getHighlighterCore, loadWasm } from 'shiki/core';
import darkPlus from 'shiki/themes/dark-plus.mjs';
import type { Highlighter, LanguageRegistration } from 'shiki';

let _highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
	if (!_highlighter) {
		return await initHighlighter();
	}
	return _highlighter;
}

export async function initHighlighter() {
	const aiScriptGrammar = await import('aiscript-vscode/aiscript/syntaxes/aiscript.tmLanguage.json');

	await loadWasm(import('shiki/onig.wasm?init'));

	const highlighter = await getHighlighterCore({
		themes: [darkPlus],
		langs: [
			import('shiki/langs/javascript.mjs'),
			{
				aliases: ['is', 'ais'],
				...aiScriptGrammar.default,
			} as unknown as LanguageRegistration,
		],
	});

	_highlighter = highlighter;

	return highlighter;
}
