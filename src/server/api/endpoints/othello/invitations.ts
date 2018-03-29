import Matching, { pack as packMatching } from '../../../../models/othello-matching';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Find session
	const invitations = await Matching.find({
		childId: user._id
	}, {
		sort: {
			_id: -1
		}
	});

	// Reponse
	res(Promise.all(invitations.map(async (i) => await packMatching(i, user))));
});
