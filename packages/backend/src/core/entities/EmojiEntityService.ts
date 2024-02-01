/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiEmoji } from '@/models/Emoji.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class EmojiEntityService {
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async packSimple(
		src: MiEmoji['id'] | MiEmoji,
	): Promise<Packed<'EmojiSimple'>> {
		const emoji = typeof src === 'object' ? src : await this.emojisRepository.findOneByOrFail({ id: src });

		return {
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
			url: emoji.publicUrl || emoji.originalUrl,
			isSensitive: emoji.isSensitive ? true : undefined,
			roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.length > 0 ? emoji.roleIdsThatCanBeUsedThisEmojiAsReaction : undefined,
			roleIdsThatCanNotBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanNotBeUsedThisEmojiAsReaction.length > 0 ? emoji.roleIdsThatCanNotBeUsedThisEmojiAsReaction : undefined,
		};
	}

	@bindThis
	public async packSimpleMany(
		emojis: (MiEmoji['id'] | MiEmoji)[],
	) : Promise<Packed<'EmojiSimple'>[]> {
		return (await Promise.allSettled(emojis.map(x => this.packSimple(x))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'EmojiSimple'>>).value);
	}

	@bindThis
	public async packDetailed(
		src: MiEmoji['id'] | MiEmoji,
	): Promise<Packed<'EmojiDetailed'>> {
		const emoji = typeof src === 'object' ? src : await this.emojisRepository.findOneByOrFail({ id: src });

		return {
			id: emoji.id,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			host: emoji.host,
			// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
			url: emoji.publicUrl || emoji.originalUrl,
			license: emoji.license,
			isSensitive: emoji.isSensitive,
			localOnly: emoji.localOnly,
			roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
			roleIdsThatCanNotBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanNotBeUsedThisEmojiAsReaction,
		};
	}

	@bindThis
	public async packDetailedMany(
		emojis: (MiEmoji['id'] | MiEmoji)[],
	) : Promise<Packed<'EmojiDetailed'>[]> {
		return (await Promise.allSettled(emojis.map(x => this.packDetailed(x))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'EmojiDetailed'>>).value);
	}

	@bindThis
	public async packInternal(
		src: MiEmoji['id'] | MiEmoji,
	): Promise<Packed<'EmojiDetailed'>> {
		const emoji = typeof src === 'object' ? src : await this.emojisRepository.findOneByOrFail({ id: src });

		return {
			id: emoji.id,
			createdAt: this.idService.parse(emoji.id).date.toISOString(),
			updatedAt: emoji.updatedAt?.toISOString() ?? null,
			aliases: emoji.aliases,
			name: emoji.name,
			category: emoji.category,
			host: emoji.host,
			// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
			url: emoji.publicUrl || emoji.originalUrl,
			license: emoji.license,
			isSensitive: emoji.isSensitive,
			localOnly: emoji.localOnly,
			requestedBy: emoji.requestedBy,
			memo: emoji.memo,
			roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
			roleIdsThatCanNotBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanNotBeUsedThisEmojiAsReaction,
		};
	}

	@bindThis
	public async packInternalMany(
		emojis: (MiEmoji['id'] | MiEmoji)[],
	) : Promise<Packed<'EmojiDetailed'>[]> {
		return (await Promise.allSettled(emojis.map(x => this.packInternal(x))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'EmojiDetailed'>>).value);
	}
}
