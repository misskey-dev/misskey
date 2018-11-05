/**
 * Emoji
 */

import { emojiRegex } from "./emoji.regex";

export type TextElementEmoji = {
	type: 'emoji';
	content: string;
	emoji?: string;
	name?: string;
};

export default function(text: string) {
	const name = text.match(/^:([a-zA-Z0-9+_-]+):/);
	if (name) {
		return {
			type: 'emoji',
			content: name[0],
			name: name[1]
		} as TextElementEmoji;
	}
	const unicode = text.match(emojiRegex);
	if (unicode) {
		const [content, emoji] = unicode;
		return {
			type: 'emoji',
			content,
			emoji
		} as TextElementEmoji;
	}
	return null;
}
