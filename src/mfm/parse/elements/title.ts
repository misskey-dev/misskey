/**
 * Title
 */

export type TextElementTitle = {
	type: 'title'
	content: string
	title: string
};

export default function(text: string, i: number) {
	const match = i == 0 ? text.match(/^(【|\[)(.+?)(】|])\n/) : text.match(/^\n(【|\[)(.+?)(】|])\n/);
	if (!match) return null;
	const title = match[0];
	return {
		type: 'title',
		content: title,
		title: title.substr(1, title.length - 3)
	} as TextElementTitle;
}
