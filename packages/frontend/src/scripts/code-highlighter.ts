import { setWasm, setCDN, Highlighter, getHighlighter as _getHighlighter } from 'shiki';

setWasm('/assets/shiki/dist/onig.wasm');
setCDN('/assets/shiki/');

let _highlighter: Highlighter;

export async function getHighlighter() {
	if (!_highlighter) {
		await initHighlighter();
	}
	return _highlighter;
}

export async function initHighlighter() {
	const highlighter = await _getHighlighter({
		theme: 'dark-plus',
		langs: ['js'],
	});

	await highlighter.loadLanguage({
		path: 'languages/aiscript.tmLanguage.json',
		id: 'aiscript',
		scopeName: 'source.aiscript',
		aliases: ['is', 'ais'],
	});

	_highlighter = highlighter;
}
