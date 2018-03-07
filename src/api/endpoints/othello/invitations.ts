import Matching, { pack as packMatching } from '../../models/othello-matching';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Find session
	const invitations = await Matching.find({
		child_id: user._id
	});

	// Reponse
	res(Promise.all(invitations.map(async (i) => await packMatching(i, user))));
});
