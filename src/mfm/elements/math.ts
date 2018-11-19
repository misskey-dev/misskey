/**
 * Math
 */

export type TextElementMath = {
	type: 'math';
	content: string;
	formula: string;
};

export default function(text: string) {
	const match = text.match(/^\\\((.+?)\\\)/);
	if (!match) return null;
	const math = match[0];
	return {
		type: 'math',
		content: math,
		formula: match[1]
	} as TextElementMath;
}
