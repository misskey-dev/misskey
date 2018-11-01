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
	console.log(text, text.match(/^:(\w+?)(@(([a-zA-Z0-9-]{2,63}\.)+[a-zA-Z0-9-]{2,63}))?:/));
	const [content, emoji, , instance] = text.match(/^:(\w+?)(@(([a-zA-Z0-9-]{2,63}\.)+[a-zA-Z0-9-]{2,63}))?:/);
	return content ? {
		type: 'emoji',
		content,
		emoji,
		instance
	} as TextElementEmoji : null;
}
