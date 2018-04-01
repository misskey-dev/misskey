import parseAcct from '../../common/user/parse-acct';
import User from '../../models/user';

export default (redirect, respond) => async (req, res, next) => {
	const { username, host } = parseAcct(req.params.user);
	if (host !== null) {
		return res.sendStatus(422);
	}

	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	});
	if (user === null) {
		return res.sendStatus(404);
	}

	if (username !== user.username) {
		return res.redirect(redirect(user.username));
	}

	return respond(user, req, res, next);
};
