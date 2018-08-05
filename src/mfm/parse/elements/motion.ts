/**
 * Motion
 */

export type TextElementMotion = {
	type: 'motion'
	content: string
	motion: string
};

export default function(text: string) {
	const match = text.match(/^\(\(\((.+?)\)\)\)/) || text.match(/^<motion>(.+?)<\/motion>/);
	if (!match) return null;
	const motion = match[0];
	return {
		type: 'motion',
		content: motion,
		motion: match[1]
	} as TextElementMotion;
}
