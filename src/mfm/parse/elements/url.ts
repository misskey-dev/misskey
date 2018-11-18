/**
 * URL
 */

export type TextElementUrl = {
	type: 'url';
	content: string;
	url: string;
};

export default function(text: string, before: string) {
	const match = text.match(/^https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.,=\+\-]+/);
	if (!match) return null;
	let url = match[0];
	if (url.endsWith('.')) url = url.substr(0, url.lastIndexOf('.'));
	if (url.endsWith(',')) url = url.substr(0, url.lastIndexOf(','));
	if (url.endsWith(')') && before.endsWith('(')) url = url.substr(0, url.lastIndexOf(')'));
	return {
		type: 'url',
		content: url,
		url: url
	} as TextElementUrl;
}
