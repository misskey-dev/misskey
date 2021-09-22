import { EntityRepository, Repository } from 'typeorm';
import { Emoji } from '@/models/entities/emoji';
import { Packed } from '@/misc/schema';

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
			url: emoji.url,
		};
	}

	public packMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.pack(x)));
	}
}

export const packedEmojiSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		aliases: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		category: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		host: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		url: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
	}
};
