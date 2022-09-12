import { ApObject, getApIds } from './type.js';
import Resolver from './resolver.js';
import { resolvePerson } from './models/person.js';
import { unique, concat } from '@/prelude/array.js';
import promiseLimit from 'promise-limit';
import { User, CacheableRemoteUser, CacheableUser } from '@/models/entities/user.js';

type Visibility = 'public' | 'home' | 'followers' | 'specified';

type AudienceInfo = {
	visibility: Visibility,
	mentionedUsers: CacheableUser[],
	visibleUsers: CacheableUser[],
};

export async function parseAudience(actor: CacheableRemoteUser, to?: ApObject, cc?: ApObject, resolver?: Resolver): Promise<AudienceInfo> {
	const toGroups = groupingAudience(getApIds(to), actor);
	const ccGroups = groupingAudience(getApIds(cc), actor);

	const others = unique(concat([toGroups.other, ccGroups.other]));

	const limit = promiseLimit<CacheableUser | null>(2);
	const mentionedUsers = (await Promise.all(
		others.map(id => limit(() => resolvePerson(id, resolver).catch(() => null)))
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

function groupingAudience(ids: string[], actor: CacheableRemoteUser) {
	const groups = {
		public: [] as string[],
		followers: [] as string[],
		other: [] as string[],
	};

	for (const id of ids) {
		if (isPublic(id)) {
			groups.public.push(id);
		} else if (isFollowers(id, actor)) {
			groups.followers.push(id);
		} else {
			groups.other.push(id);
		}
	}

	groups.other = unique(groups.other);

	return groups;
}

function isPublic(id: string) {
	return [
		'https://www.w3.org/ns/activitystreams#Public',
		'as#Public',
		'Public',
	].includes(id);
}

function isFollowers(id: string, actor: CacheableRemoteUser) {
	return (
		id === (actor.followersUri || `${actor.uri}/followers`)
	);
}
