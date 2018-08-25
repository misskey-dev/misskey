/**
 * Link
 */

export type TextElementLink = {
	type: 'link'
	content: string
	title: string
	url: string
	silent: boolean
};

export default function(text: string) {
	const match = text.match(/^\??\[([^\[\]]+?)\]\((https?:\/\/[\w\/:%#@\$&\?!\(\)\[\]~\.=\+\-]+?)\)/);
	if (!match) return null;
	const silent = text.startsWith('?');
	const link = match[0];
	const title = match[1];
	const url = match[2];
	return {
		type: 'link',
		content: link,
		title: title,
		url: url,
		silent: silent
	} as TextElementLink;
}
