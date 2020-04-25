import * as Bull from 'bull';
import * as httpSignature from 'http-signature';
import { IRemoteUser } from '../../models/entities/user';
import perform from '../../remote/activitypub/perform';
import { resolvePerson, updatePerson } from '../../remote/activitypub/models/person';
import Logger from '../../services/logger';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import { Instances, Users, UserPublickeys } from '../../models';
import { instanceChart } from '../../services/chart';
import { UserPublickey } from '../../models/entities/user-publickey';
import { fetchMeta } from '../../misc/fetch-meta';
import { toPuny } from '../../misc/convert-host';
import { validActor, getApId, IActivity } from '../../remote/activitypub/type';
import { ensure } from '../../prelude/ensure';
import { fetchNodeinfo } from '../../services/fetch-nodeinfo';
import { InboxJobData } from '..';

const logger = new Logger('inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: Bull.Job<InboxJobData>): Promise<string> => {
	const signature = job.data.signature;	// HTTP-signature
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity);
	delete info['@context'];
	logger.debug(JSON.stringify(info, null, 2));
	//#endregion

	const keyIdLower = signature.keyId.toLowerCase();
	let user: IRemoteUser;
	let key: UserPublickey;

	if (keyIdLower.startsWith('acct:')) {
		return `Old keyId is no longer supported. ${keyIdLower}`;
	}

	// アクティビティ内のホストの検証
	const host = toPuny(new URL(signature.keyId).hostname);
	try {
		ValidateActivity(activity, host);
	} catch (e) {
		return e.message;
	}

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(host)) {
		return `Blocked request: ${host}`;
	}

	const _key = await UserPublickeys.findOne({
		keyId: signature.keyId
	});

	if (_key) {
		// 登録済みユーザー
		user = await Users.findOne(_key.userId) as IRemoteUser;
		key = _key;
	} else {
		// 未登録ユーザーの場合はリモート解決
		user = await resolvePerson(getApId(activity.actor)) as IRemoteUser;
		if (user == null) {
			throw new Error('failed to resolve user');
		}

		key = await UserPublickeys.findOne(user.id).then(ensure);
	}

	// Update Person activityの場合は、ここで署名検証/更新処理まで実施して終了
	if (activity.type === 'Update') {
		if (activity.object && typeof activity.object !== 'string' && validActor.includes(activity.object.type)) {
			if (!httpSignature.verifySignature(signature, key.keyPem)) {
				return `skip: Update activity received, but signature verification failed.`;
			} else {
				await updatePerson(getApId(activity.actor), null, activity.object);
				return `ok: person updated`;
			}
		}
	}

	if (!httpSignature.verifySignature(signature, key.keyPem)) {
		return 'signature verification failed';
	}

	// Update stats
	registerOrFetchInstanceDoc(user.host).then(i => {
		Instances.update(i.id, {
			latestRequestReceivedAt: new Date(),
			lastCommunicatedAt: new Date(),
			isNotResponding: false
		});

		fetchNodeinfo(i);

		instanceChart.requestReceived(i.host);
	});

	// アクティビティを処理
	await perform(user, activity);
	return `ok`;
};

/**
 * Validate host in activity
 * @param activity Activity
 * @param host Expect host
 */
function ValidateActivity(activity: IActivity, host: string) {
	// id (if exists)
	if (typeof activity.id === 'string') {
		const uriHost = toPuny(new URL(activity.id).hostname);
		if (host !== uriHost) {
			const diag = activity.signature ? '. Has LD-Signature. Forwarded?' : '';
			throw new Error(`activity.id(${activity.id}) has different host(${host})${diag}`);
		}
	}

	// actor (if exists)
	if (typeof activity.actor === 'string') {
		const uriHost = toPuny(new URL(activity.actor).hostname);
		if (host !== uriHost) throw new Error('activity.actor has different host');
	}

	// For Create activity
	if (activity.type === 'Create' && typeof activity.object !== 'string') {
		// object.id (if exists)
		if (typeof activity.object.id === 'string') {
			const uriHost = toPuny(new URL(activity.object.id).hostname);
			if (host !== uriHost) throw new Error('activity.object.id has different host');
		}

		// object.attributedTo (if exists)
		if (typeof activity.object.attributedTo === 'string') {
			const uriHost = toPuny(new URL(activity.object.attributedTo).hostname);
			if (host !== uriHost) throw new Error('activity.object.attributedTo has different host');
		}
	}
}
