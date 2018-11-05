/**
 * Emoji
 */

import { emojiRegex } from "./emoji.regex";

export type TextElementEmoji = {
	type: 'emoji';
	content: string;
	emoji?: string;
	raw?: string;
};

export default function(text: string) {
	const name = text.match(/^:([a-zA-Z0-9+_-]+):/);
	if (name) {
		const [content, emoji] = name;
		return {
			type: 'emoji',
			content,
			emoji
		} as TextElementEmoji;
	}
	const unicode = text.match(emojiRegex);
	if (unicode) {
		const [content, raw] = unicode;
		return {
			type: 'emoji',
			content,
			raw
		} as TextElementEmoji;
	}
	return null;
}
