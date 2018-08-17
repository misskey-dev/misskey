/**
 * Emoji
 */

export type TextElementEmoji = {
	type: 'emoji'
	content: string
	emoji: string
};

export default function(text: string) {
	const match = text.match(/^:([a-zA-Z0-9+-_]+):/);
	if (!match) return null;
	const emoji = match[0];
	return {
		type: 'emoji',
		content: emoji,
		emoji: match[1]
	} as TextElementEmoji;
}
