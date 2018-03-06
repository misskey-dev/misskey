import rndstr from 'rndstr';
import Session, { pack } from '../../../models/othello-session';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// 以前のセッションはすべて削除しておく
	await Session.remove({
		user_id: user._id
	});

	// セッションを作成
	const session = await Session.insert({
		user_id: user._id,
		code: rndstr('a-z0-9', 3)
	});

	// Reponse
	res(await pack(session));
});
