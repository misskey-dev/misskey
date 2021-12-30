import config from '@/config/index';
import { Emoji } from '@/models/entities/emoji';

export default (emoji: Emoji) => ({
	id: `${config.url}/emojis/${emoji.name}`,
	type: 'Emoji',
	name: `:${emoji.name}:`,
	updated: emoji.updatedAt != null ? emoji.updatedAt.toISOString() : new Date().toISOString,
	icon: {
		type: 'Image',
		mediaType: emoji.type || 'image/png',
		url: emoji.url,
	},
});
