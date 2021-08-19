import { EntityRepository, Repository } from 'typeorm';
import { Emoji } from '../entities/emoji';

@EntityRepository(Emoji)
export class EmojiRepository extends Repository<Emoji> {
	public async pack(
		src: Emoji['id'] | Emoji,
	) {
		const emoji = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: emoji.id,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			host: emoji.host,
			url: emoji.url,
		};
	}

	public packMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.pack(x)));
	}
}
