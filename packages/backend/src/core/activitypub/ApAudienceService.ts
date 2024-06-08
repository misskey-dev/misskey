/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import type { MiRemoteUser, MiUser } from '@/models/User.js';
import { concat, unique } from '@/misc/prelude/array.js';
import { bindThis } from '@/decorators.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { getApIds } from './type.js';
import { ApPersonService } from './models/ApPersonService.js';
import type { ApObject } from './type.js';
import type { Resolver } from './ApResolverService.js';

type Visibility = 'public' | 'home' | 'followers' | 'specified';

type AudienceInfo = {
	visibility: Visibility,
	mentionedUsers: MiUser[],
	visibleUsers: MiUser[],
};

type GroupedAudience = Record<'public' | 'followers' | 'other', string[]>;

@Injectable()
export class ApAudienceService {
	constructor(
		private apPersonService: ApPersonService,
	) {
	}

	@bindThis
	public async parseAudience(actor: MiRemoteUser, to?: ApObject, cc?: ApObject, resolver?: Resolver): Promise<AudienceInfo> {
		const toGroups = this.groupingAudience(getApIds(to), actor);
		const ccGroups = this.groupingAudience(getApIds(cc), actor);

		const others = unique(concat([toGroups.other, ccGroups.other]));

		const limit = promiseLimit<MiUser | null>(2);
		const mentionedUsers = (await Promise.all(
			others.map(id => limit(() => this.apPersonService.resolvePerson(id, resolver).catch(() => null))),
		)).filter(isNotNull);

		if (toGroups.public.length > 0) {
			return {
				visibility: 'public',
				mentionedUsers,
				visibleUsers: [],
			};
		}

		if (ccGroups.public.length > 0) {
			return {
				visibility: 'home',
				mentionedUsers,
				visibleUsers: [],
			};
		}

		if (toGroups.followers.length > 0 || ccGroups.followers.length > 0) {
			return {
				visibility: 'followers',
				mentionedUsers,
				visibleUsers: [],
			};
		}

		return {
			visibility: 'specified',
			mentionedUsers,
			visibleUsers: mentionedUsers,
		};
	}

	@bindThis
	private groupingAudience(ids: string[], actor: MiRemoteUser): GroupedAudience {
		const groups: GroupedAudience = {
			public: [],
			followers: [],
			other: [],
		};

		for (const id of ids) {
			if (this.isPublic(id)) {
				groups.public.push(id);
			} else if (this.isFollowers(id, actor)) {
				groups.followers.push(id);
			} else {
				groups.other.push(id);
			}
		}

		groups.other = unique(groups.other);

		return groups;
	}

	@bindThis
	private isPublic(id: string): boolean {
		return [
			'https://www.w3.org/ns/activitystreams#Public',
			'as:Public',
			'Public',
		].includes(id);
	}

	@bindThis
	private isFollowers(id: string, actor: MiRemoteUser): boolean {
		return id === (actor.followersUri ?? `${actor.uri}/followers`);
	}
}
