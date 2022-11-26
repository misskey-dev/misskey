import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class EmojiEntityService {
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

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
			// ?? emoji.originalUrl してるのは後方互換性のため
			url: emoji.publicUrl ?? emoji.originalUrl,
		};
	}

	public packMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.pack(x)));
	}
}

