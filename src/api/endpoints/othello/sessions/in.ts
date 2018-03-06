import $ from 'cafy';
import Session from '../../../models/othello-session';
import Game, { pack } from '../../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'code' parameter
	const [code, codeErr] = $(params.code).string().$;
	if (codeErr) return rej('invalid code param');

	// Fetch session
	const session = await Session.findOne({ code });

	if (session == null) {
		return rej('session not found');
	}

	// Destroy session
	Session.remove({
		_id: session._id
	});

	const parentIsBlack = Math.random() > 0.5;

	// Start game
	const game = await Game.insert({
		created_at: new Date(),
		black_user_id: parentIsBlack ? session.user_id : user._id,
		white_user_id: parentIsBlack ? user._id : session.user_id,
		logs: []
	});

	// Reponse
	res(await pack(game));
});
