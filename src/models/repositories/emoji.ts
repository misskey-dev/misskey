import { EntityRepository, Repository } from 'typeorm';
import { Emoji } from '../entities/emoji';
import { ensure } from '../../prelude/ensure';

@EntityRepository(Emoji)
export class EmojiRepository extends Repository<Emoji> {
	public async pack(
		src: Emoji['id'] | Emoji,
	) {
		const emoji = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

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
