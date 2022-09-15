import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Emojis } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { Emoji } from '@/models/entities/emoji.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class EmojiEntityService {
	constructor(
		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Emoji['id'] | Emoji,
	): Promise<Packed<'Emoji'>> {
		const emoji = typeof src === 'object' ? src : await this.emojisRepository.findOneByOrFail({ id: src });

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

