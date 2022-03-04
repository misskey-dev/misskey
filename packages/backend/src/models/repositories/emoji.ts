import { EntityRepository, Repository } from 'typeorm';
import { Emoji } from '@/models/entities/emoji.js';
import { Packed } from '@/misc/schema.js';

@EntityRepository(Emoji)
export class EmojiRepository extends Repository<Emoji> {
	public async pack(
		src: Emoji['id'] | Emoji,
	): Promise<Packed<'Emoji'>> {
		const emoji = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: emoji.id,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			host: emoji.host,
			// || emoji.originalUrl してるのは後方互換性のため
			url: emoji.publicUrl || emoji.originalUrl,
		};
	}

	public packMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.pack(x)));
	}
}
