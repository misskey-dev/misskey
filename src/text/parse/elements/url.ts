/**
 * URL
 */

export type TextElementUrl = {
	type: "url"
	content: string
	url: string
};

export default function(text: string) {
	const match = text.match(/^https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+/);
	if (!match) return null;
	const url = match[0];
	return {
		type: 'url',
		content: url,
		url: url
	} as TextElementUrl;
}
