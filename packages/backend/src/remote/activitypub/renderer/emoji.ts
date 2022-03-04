import config from '@/config/index.js';
import { Emoji } from '@/models/entities/emoji.js';

export default (emoji: Emoji) => ({
	id: `${config.url}/emojis/${emoji.name}`,
	type: 'Emoji',
	name: `:${emoji.name}:`,
	updated: emoji.updatedAt != null ? emoji.updatedAt.toISOString() : new Date().toISOString,
	icon: {
		type: 'Image',
		mediaType: emoji.type || 'image/png',
		url: emoji.publicUrl || emoji.originalUrl, // || emoji.originalUrl してるのは後方互換性のため
	},
});
