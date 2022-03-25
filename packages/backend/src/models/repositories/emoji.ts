import { db } from '@/db/postgre.js';
import { Emoji } from '@/models/entities/emoji.js';
import { Packed } from '@/misc/schema.js';

export const EmojiRepository = db.getRepository(Emoji).extend({
	async pack(
		src: Emoji['id'] | Emoji,
	): Promise<Packed<'Emoji'>> {
		const emoji = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return {
			id: emoji.id,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			host: emoji.host,
			// || emoji.originalUrl してるのは後方互換性のため
			url: emoji.publicUrl || emoji.originalUrl,
		};
	},

	packMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.pack(x)));
	},
});
