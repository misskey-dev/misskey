import { setWasm, setCDN, Highlighter, getHighlighter as _getHighlighter } from 'shiki';

setWasm('/assets/shiki/dist/onig.wasm');
setCDN('/assets/shiki/');

let _highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
	if (!_highlighter) {
		return await initHighlighter();
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

	return highlighter;
}
