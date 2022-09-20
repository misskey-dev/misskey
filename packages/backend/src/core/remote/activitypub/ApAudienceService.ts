import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import promiseLimit from 'promise-limit';
import { DI } from '@/di-symbols.js';
import type { CacheableRemoteUser, CacheableUser } from '@/models/entities/User.js';
import { concat, toArray, toSingle, unique } from '@/misc/prelude/array.js';
import { getApId, getApIds, getApType, isAccept, isActor, isAdd, isAnnounce, isBlock, isCollection, isCollectionOrOrderedCollection, isCreate, isDelete, isFlag, isFollow, isLike, isPost, isRead, isReject, isRemove, isTombstone, isUndo, isUpdate, validActor, validPost } from './type.js';
import { ApPersonService } from './models/ApPersonService.js';
import type { ApObject } from './type.js';
import type { Resolver } from './ApResolverService.js';

type Visibility = 'public' | 'home' | 'followers' | 'specified';

type AudienceInfo = {
	visibility: Visibility,
	mentionedUsers: CacheableUser[],
	visibleUsers: CacheableUser[],
};

@Injectable()
export class ApAudienceService {
	constructor(
		private apPersonService: ApPersonService,
	) {
	}

	public async parseAudience(actor: CacheableRemoteUser, to?: ApObject, cc?: ApObject, resolver?: Resolver): Promise<AudienceInfo> {
		const toGroups = this.groupingAudience(getApIds(to), actor);
		const ccGroups = this.groupingAudience(getApIds(cc), actor);
	
		const others = unique(concat([toGroups.other, ccGroups.other]));
	
		const limit = promiseLimit<CacheableUser | null>(2);
		const mentionedUsers = (await Promise.all(
			others.map(id => limit(() => this.apPersonService.resolvePerson(id, resolver).catch(() => null))),
		)).filter((x): x is CacheableUser => x != null);
	
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
	
		if (toGroups.followers.length > 0) {
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
	
	private groupingAudience(ids: string[], actor: CacheableRemoteUser) {
		const groups = {
			public: [] as string[],
			followers: [] as string[],
			other: [] as string[],
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
	
	private isPublic(id: string) {
		return [
			'https://www.w3.org/ns/activitystreams#Public',
			'as#Public',
			'Public',
		].includes(id);
	}
	
	private isFollowers(id: string, actor: CacheableRemoteUser) {
		return (
			id === (actor.followersUri ?? `${actor.uri}/followers`)
		);
	}
}
