/**
 * Big
 */

export type TextElementBig = {
	type: 'big'
	content: string
	big: string
};

export default function(text: string) {
	const match = text.match(/^\*\*\*(.+?)\*\*\*/);
	if (!match) return null;
	const big = match[0];
	return {
		type: 'big',
		content: big,
		big: match[1]
	} as TextElementBig;
}
