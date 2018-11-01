/**
 * Emoji
 */

export type TextElementEmoji = {
	type: 'emoji'
	content: string
	emoji: string,
	instance?: string
};

export default function(text: string) {
	const match = text.match(/^:([a-zA-Z0-9+-_]+)(?:@(([a-zA-Z0-9-]{2,63}\.)+[a-zA-Z0-9-]{2,63}))?:/);
	if (!match) return null;
	const emoji = match[0];
	return {
		type: 'emoji',
		content: emoji,
		emoji: match[1],
		instance: match[2]
	} as TextElementEmoji;
}
