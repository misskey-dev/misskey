import { IEmoji } from '../../../models/emoji';
import config from '../../../config';

export default (emoji: IEmoji) => ({
	id: `${config.url}/emojis/${emoji.name}`,
	type: 'Emoji',
	name: `:${emoji.name}:`,
	updated: emoji.updatedAt != null ? emoji.updatedAt.toISOString() : new Date().toISOString,
	icon: {
		type: 'Image',
		mediaType: emoji.type || 'image/png',
		url: emoji.url
	}
});
