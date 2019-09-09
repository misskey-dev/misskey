import Resolver from '../../resolver';
import post from '../../../../services/note/create';
import { IRemoteUser, User } from '../../../../models/entities/user';
import { IAnnounce, INote, getApId, getApIds } from '../../type';
import { fetchNote, resolveNote } from '../../models/note';
import { resolvePerson } from '../../models/person';
import { apLogger } from '../../logger';
import { extractDbHost } from '../../../../misc/convert-host';
import { fetchMeta } from '../../../../misc/fetch-meta';
import { getApLock } from '../../../../misc/app-lock';

const logger = apLogger;

/**
 * アナウンスアクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, activity: IAnnounce, note: INote): Promise<void> {
	const uri = getApId(activity);

	// アナウンサーが凍結されていたらスキップ
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
			renote = await resolveNote(note);
		} catch (e) {
			// 対象が4xxならスキップ
			if (e.statusCode >= 400 && e.statusCode < 500) {
				logger.warn(`Ignored announce target ${note.inReplyTo} - ${e.statusCode}`);
				return;
			}
			logger.warn(`Error in announce target ${note.inReplyTo} - ${e.statusCode || e}`);
			throw e;
		}

		logger.info(`Creating the (Re)Note: ${uri}`);

		//#region Visibility
		const to = getApIds(activity.to);
		const cc = getApIds(activity.cc);

		const visibility = getVisibility(to, cc, actor);

		let visibleUsers: User[] = [];
		if (visibility == 'specified') {
			visibleUsers = await Promise.all(to.map(uri => resolvePerson(uri)));
		}
		//#endergion

		await post(actor, {
			createdAt: activity.published ? new Date(activity.published) : null,
			renote,
			visibility,
			visibleUsers,
			uri
		});
	} finally {
		unlock();
	}
}

type visibility = 'public' | 'home' | 'followers' | 'specified';

function getVisibility(to: string[], cc: string[], actor: IRemoteUser): visibility {
	const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

	if (to.includes(PUBLIC)) {
		return 'public';
	} else if (cc.includes(PUBLIC)) {
		return 'home';
	} else if (to.includes(`${actor.uri}/followers`)) {
		return 'followers';
	} else {
		return 'specified';
	}
}
