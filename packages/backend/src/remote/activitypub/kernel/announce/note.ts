import Resolver from '../../resolver.js';
import post from '@/services/note/create.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { IAnnounce, getApId } from '../../type.js';
import { fetchNote, resolveNote } from '../../models/note.js';
import { apLogger } from '../../logger.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { getApLock } from '@/misc/app-lock.js';
import { parseAudience } from '../../audience.js';
import { StatusError } from '@/misc/fetch.js';
import { Notes } from '@/models/index.js';

const logger = apLogger;

/**
 * アナウンスアクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: CacheableRemoteUser, activity: IAnnounce, targetUri: string): Promise<void> {
	const uri = getApId(activity);

	if (actor.isSuspended) {
		return;
	}

	// アナウンス先をブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(extractDbHost(uri))) return;

	const unlock = await getApLock(uri);

	try {
		// 既に同じURIを持つものが登録されていないかチェック
		const exist = await fetchNote(uri);
		if (exist) {
			return;
		}

		// Announce対象をresolve
		let renote;
		try {
			renote = await resolveNote(targetUri);
		} catch (e) {
			// 対象が4xxならスキップ
			if (e instanceof StatusError) {
				if (e.isClientError) {
					logger.warn(`Ignored announce target ${targetUri} - ${e.statusCode}`);
					return;
				}

				logger.warn(`Error in announce target ${targetUri} - ${e.statusCode || e}`);
			}
			throw e;
		}

		if (!await Notes.isVisibleForMe(renote, actor.id)) return 'skip: invalid actor for this activity';

		logger.info(`Creating the (Re)Note: ${uri}`);

		const activityAudience = await parseAudience(actor, activity.to, activity.cc);

		await post(actor, {
			createdAt: activity.published ? new Date(activity.published) : null,
			renote,
			visibility: activityAudience.visibility,
			visibleUsers: activityAudience.visibleUsers,
			uri,
		});
	} finally {
		unlock();
	}
}
