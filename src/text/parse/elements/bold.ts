/**
 * Bold
 */

export type TextElementBold = {
	type: "bold"
	content: string
	bold: string
};

export default function(text: string) {
	const match = text.match(/^\*\*(.+?)\*\*/);
	if (!match) return null;
	const bold = match[0];
	return {
		type: 'bold',
		content: bold,
		bold: bold.substr(2, bold.length - 4)
	} as TextElementBold;
}
