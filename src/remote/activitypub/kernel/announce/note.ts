import Resolver from '../../resolver';
import post from '../../../../services/note/create';
import { IRemoteUser, IUser } from '../../../../models/user';
import { IAnnounce, INote } from '../../type';
import { fetchNote, resolveNote } from '../../models/note';
import { resolvePerson } from '../../models/person';
import { apLogger } from '../../logger';
import { extractDbHost } from '../../../../misc/convert-host';
import Instance from '../../../../models/instance';

const logger = apLogger;

/**
 * アナウンスアクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, activity: IAnnounce, note: INote): Promise<void> {
	const uri = activity.id || activity;

	// アナウンサーが凍結されていたらスキップ
	if (actor.isSuspended) {
		return;
	}

	if (typeof uri !== 'string') {
		throw new Error('invalid announce');
	}

	// アナウンス先をブロックしてたら中断
	// TODO: いちいちデータベースにアクセスするのはコスト高そうなのでどっかにキャッシュしておく
	const instance = await Instance.findOne({ host: extractDbHost(uri) });
	if (instance && instance.isBlocked) return;

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
	const visibility = getVisibility(activity.to, activity.cc, actor);

	let visibleUsers: IUser[] = [];
	if (visibility == 'specified') {
		visibleUsers = await Promise.all(note.to.map(uri => resolvePerson(uri)));
	}
	//#endergion

	await post(actor, {
		createdAt: new Date(activity.published),
		renote,
		visibility,
		visibleUsers,
		uri
	});
}

type visibility = 'public' | 'home' | 'followers' | 'specified';

function getVisibility(to: string[], cc: string[], actor: IRemoteUser): visibility {
	const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

	to = to || [];
	cc = cc || [];

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
