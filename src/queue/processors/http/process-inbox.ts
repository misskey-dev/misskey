import * as kue from 'kue';
import * as debug from 'debug';

const httpSignature = require('http-signature');
import parseAcct from '../../../acct/parse';
import User, { IRemoteUser } from '../../../models/user';
import perform from '../../../remote/activitypub/perform';
import { resolvePerson } from '../../../remote/activitypub/models/person';

const log = debug('misskey:queue:inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: kue.Job, done): Promise<void> => {
	const signature = job.data.signature;
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity);
	delete info['@context'];
	delete info['signature'];
	log(info);
	//#endregion

	const keyIdLower = signature.keyId.toLowerCase();
	let user;

	if (keyIdLower.startsWith('acct:')) {
		const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
		if (host === null) {
			console.warn(`request was made by local user: @${username}`);
			done();
			return;
		}

		user = await User.findOne({ usernameLower: username, host: host.toLowerCase() }) as IRemoteUser;

		// アクティビティを送信してきたユーザーがまだMisskeyサーバーに登録されていなかったら登録する
		if (user === null) {
			user = await resolvePerson(activity.actor);
		}
	} else {
		user = await User.findOne({
			host: { $ne: null },
			'publicKey.id': signature.keyId
		}) as IRemoteUser;

		// アクティビティを送信してきたユーザーがまだMisskeyサーバーに登録されていなかったら登録する
		if (user === null) {
			user = await resolvePerson(signature.keyId);
		}
	}

	if (user === null) {
		done(new Error('failed to resolve user'));
		return;
	}

	if (!httpSignature.verifySignature(signature, user.publicKey.publicKeyPem)) {
		console.warn('signature verification failed');
		done();
		return;
	}

	// アクティビティを処理
	try {
		await perform(user, activity);
		done();
	} catch (e) {
		done(e);
	}
};
