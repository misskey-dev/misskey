/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EmojiDraftsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { MiEmojiDraft } from '@/models/EmojiDraft.js';

@Injectable()
export class EmojiDraftsEntityService {
	constructor(
		@Inject(DI.emojiDraftsRepository)
		private emojiDraftsRepository: EmojiDraftsRepository,
	) {
	}

	@bindThis
	public async packSimple(
		src: MiEmojiDraft['id'] | MiEmojiDraft,
	): Promise<Packed<'EmojiDraftSimple'>> {
		const emoji = typeof src === 'object' ? src : await this.emojiDraftsRepository.findOneByOrFail({ id: src });

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
		src: MiEmojiDraft['id'] | MiEmojiDraft,
	): Promise<Packed<'EmojiDraftDetailed'>> {
		const emoji = typeof src === 'object' ? src : await this.emojiDraftsRepository.findOneByOrFail({ id: src });

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

