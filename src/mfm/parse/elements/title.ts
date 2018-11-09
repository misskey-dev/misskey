/**
 * Title
 */

export type TextElementTitle = {
	type: 'title';
	content: string;
	title: string;
};

export default function(text: string, isBegin: boolean) {
	const match = isBegin ? text.match(/^(【|\[)(.+?)(】|])\n/) : text.match(/^\n(【|\[)(.+?)(】|])\n/);
	if (!match) return null;
	return {
		type: 'title',
		content: match[0],
		title: match[2]
	} as TextElementTitle;
}
