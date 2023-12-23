/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EmojiRequestsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { MiEmojiRequest } from '@/models/EmojiRequest.js';

@Injectable()
export class EmojiRequestsEntityService {
	constructor(
		@Inject(DI.emojiRequestsRepository)
		private emojiRequestsRepository: EmojiRequestsRepository,
	) {
	}

	@bindThis
	public async packSimple(
		src: MiEmojiRequest['id'] | MiEmojiRequest,
	): Promise<Packed<'EmojiRequestSimple'>> {
		const emoji = typeof src === 'object' ? src : await this.emojiRequestsRepository.findOneByOrFail({ id: src });

		return {
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
			url: emoji.publicUrl,
			isSensitive: emoji.isSensitive ? true : undefined,
		};
	}

	@bindThis
	public packSimpleMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.packSimple(x)));
	}

	@bindThis
	public async packDetailed(
		src: MiEmojiRequest['id'] | MiEmojiRequest,
	): Promise<Packed<'EmojiRequestDetailed'>> {
		const emoji = typeof src === 'object' ? src : await this.emojiRequestsRepository.findOneByOrFail({ id: src });

		return {
			id: emoji.id,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			url: emoji.publicUrl,
			license: emoji.license,
			isSensitive: emoji.isSensitive,
			localOnly: emoji.localOnly,
			fileId: emoji.fileId,
		};
	}

	@bindThis
	public packDetailedMany(
		emojis: any[],
	) {
		return Promise.all(emojis.map(x => this.packDetailed(x)));
	}
}

