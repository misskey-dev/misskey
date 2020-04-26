import * as Bull from 'bull';
import * as httpSignature from 'http-signature';
import { IRemoteUser } from '../../models/entities/user';
import perform from '../../remote/activitypub/perform';
import { resolvePerson } from '../../remote/activitypub/models/person';
import Logger from '../../services/logger';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import { Instances, Users, UserPublickeys } from '../../models';
import { instanceChart } from '../../services/chart';
import { UserPublickey } from '../../models/entities/user-publickey';
import { fetchMeta } from '../../misc/fetch-meta';
import { toPuny, extractDbHost } from '../../misc/convert-host';
import { getApId } from '../../remote/activitypub/type';
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

	const host = toPuny(new URL(signature.keyId).hostname);

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(host)) {
		return `Blocked request: ${host}`;
	}

	const keyIdLower = signature.keyId.toLowerCase();
	if (keyIdLower.startsWith('acct:')) {
		return `Old keyId is no longer supported. ${keyIdLower}`;
	}

	let user: IRemoteUser;
	let key: UserPublickey;

	// keyIdを元にDBから取得
	const _key = await UserPublickeys.findOne({
		keyId: signature.keyId
	});

	if (_key) {
		// 登録済みユーザー
		user = await Users.findOne(_key.userId) as IRemoteUser;
		key = _key;
	} else {
		// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
		user = await resolvePerson(getApId(activity.actor)) as IRemoteUser;

		// それでもわからなければ終了
		if (user == null) {
			return `skip: failed to resolve user`;
		}

		key = await UserPublickeys.findOne(user.id).then(ensure);
	}

	// HTTP-Signatureの検証
	if (!httpSignature.verifySignature(signature, key.keyPem)) {
		return 'signature verification failed';
	}

	// signatureのsignerは、activity.actorと一致する必要がある
	if (user.uri !== activity.actor) {
		const diag = activity.signature ? '. Has LD-Signature. Forwarded?' : '';
		throw new Error(`activity.id(${activity.id}) has different host(${host})${diag}`);
	}

	// activity.idがあればホストが署名者のホストであることを確認する
	if (typeof activity.id === 'string') {
		const signerHost = extractDbHost(user.uri!);
		const activityIdHost = extractDbHost(activity.id);
		if (signerHost !== activityIdHost) {
			return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
		}
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
