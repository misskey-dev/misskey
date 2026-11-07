/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiHashtag } from '@/models/Hashtag.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class HashtagEntityService {
	constructor(
	) {
	}

	@bindThis
	public async pack(
		src: MiHashtag,
	): Promise<Packed<'Hashtag'>> {
		return {
			tag: src.name,
			mentionedUsersCount: src.mentionedUsersCount,
			mentionedLocalUsersCount: src.mentionedLocalUsersCount,
			mentionedRemoteUsersCount: src.mentionedRemoteUsersCount,
			attachedUsersCount: src.attachedUsersCount,
			attachedLocalUsersCount: src.attachedLocalUsersCount,
			attachedRemoteUsersCount: src.attachedRemoteUsersCount,
		};
	}

	@bindThis
	public packMany(
		hashtags: MiHashtag[],
	) {
		return Promise.all(hashtags.map(x => this.pack(x)));
	}
}

